import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const { courseId } = params;
  
  if (!courseId) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }

  try {
    // Check if course has active subscriptions
    const { data: subscriptions, error: subscriptionsError, count } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact' })
      .eq('course_id', courseId)
      .limit(1);
    
    if (subscriptionsError) {
      console.error('Error checking for subscriptions:', subscriptionsError);
      return NextResponse.json({ 
        error: 'Failed to check for subscriptions', 
        details: subscriptionsError.message 
      }, { status: 500 });
    }
    
    // Return true if there are subscriptions, false otherwise
    return NextResponse.json({ 
      hasSubscription: subscriptions && subscriptions.length > 0,
      count: count || 0
    });

  } catch (error: any) {
    console.error('Error in GET /api/admin/courses/[courseId]/has-subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 });
  }
}
