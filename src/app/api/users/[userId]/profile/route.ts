import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

// ========== HELPER FUNCTIONS ==========
function createErrorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function createSuccessResponse(data: unknown, status: number) {
  return Response.json(data, { status });
}

// ========== GET HANDLER ==========
export async function GET(
  req: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const userId = context.params.userId;

    if (!userId) {
      return createErrorResponse('Missing user_id', 400);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, date_of_birth, educational_background, profile_picture')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return createErrorResponse(error.message, 400);
    }

    return createSuccessResponse({ profile: data }, 200);
  } catch (e) {
    console.error('Server error in GET /api/users/[userId]/profile:', (e as Error).message);
    return createErrorResponse((e as Error).message || 'Unknown error', 500);
  }
}

// ========== VALIDATORS ==========
function validateName(name: string) {
  const re = /^[A-Za-z'-]+(?: [A-Za-z'-]+)*$/;
  return re.test(name);
}

function validateEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateDOB(dob: string) {
  const date = new Date(dob);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  if (date >= today) return false;

  const sixYearsAgo = new Date();
  sixYearsAgo.setFullYear(today.getFullYear() - 6);
  return date <= sixYearsAgo;
}

// ========== PATCH HANDLER ==========
export async function PATCH(
  req: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const userId = context.params.userId;

    if (!userId) {
      return createErrorResponse('Missing user_id', 400);
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      dob,
      school,
      email,
      profile_picture
    } = body;

    const errors: Record<string, string> = {};

    // Validate full name
    if (firstName != null || lastName != null) {
      const fullName = `${firstName || ''} ${lastName || ''}`.trim();
      if (!fullName || !validateName(fullName)) {
        errors.full_name = 'Name must use letters, apostrophe or hyphen only';
      }
    }

    // Validate DOB
    if (dob != null && !validateDOB(dob)) {
      errors.date_of_birth = 'Must be at least 6 years old, not today or future';
    }

    // Validate email
    if (email != null && !validateEmail(email)) {
      errors.email = 'Invalid email format';
    }

    // Handle validation errors
    if (Object.keys(errors).length > 0) {
      return createSuccessResponse({ errors }, 422);
    }

    // Update auth.users table if email is present
    if (email != null) {
      const { error: emailUpdateError } = await supabase.auth.updateUser({ email });
      if (emailUpdateError) {
        return createErrorResponse(emailUpdateError.message, 400);
      }
    }

    // Prepare profile update
    const updates: Record<string, unknown> = {};
    if (firstName != null || lastName != null) {
      updates.full_name = `${firstName || ''} ${lastName || ''}`.trim();
    }
    if (dob != null) updates.date_of_birth = dob;
    if (school != null) updates.educational_background = school;
    if (profile_picture != null) updates.profile_picture = profile_picture;

    let updatedProfile = null;
    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error("🔴 Supabase profile update error:", error.message);
        return createErrorResponse(error.message, 400);
      }

      updatedProfile = data;
    }

    return createSuccessResponse({ profile: updatedProfile }, 200);
  } catch (e) {
    console.error('PATCH error:', (e as Error).message);
    return createErrorResponse('Server error', 500);
  }
}
