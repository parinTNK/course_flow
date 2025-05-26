import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { CourseFormData } from '@/types/courseAdmin';
import { getBangkokISOString } from '@/lib/bangkokTime';


interface LessonAttributes {
  id?: string | number; 
  title?: string;
  name?: string;
  order_no?: number;
  course_id?: string;
  sub_lessons_attributes?: SubLessonAttributes[];
  client_side_key?: string; 
  [key: string]: any;
}

interface SubLessonAttributes {
  id?: string | number;
  title?: string;
  name?: string; 
  video_url?: string;
  videoUrl?: string;
  order_no?: number;
  lesson_id?: string;
                                                   
  [key: string]: any; 
}

export async function PUT(                                
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const { courseId: id } = params; 
  if (!id) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }

  try {
    const formData: CourseFormData = await request.json();
    const { lessons_attributes, cover_image_url, promo_code_id, ...courseData } = formData;

    // Log the data being updated (excluding sensitive info)
    console.log('Updating course with data:', {
      ...courseData,
      video_trailer_fields: {
        video_trailer_mux_asset_id: formData.video_trailer_mux_asset_id,
        video_trailer_url: formData.video_trailer_url
      }
    });

    const { data: updatedCourse, error: courseError } = await supabase
      .from('courses')
      .update({
        ...courseData,
        ...(cover_image_url && { cover_image_url }),
        promo_code_id: promo_code_id,
        // Explicitly include video trailer fields
        video_trailer_mux_asset_id: formData.video_trailer_mux_asset_id || null,
        video_trailer_url: formData.video_trailer_url || null,
        updated_at: getBangkokISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (courseError) {
      console.error('Error updating course:', courseError);
      return NextResponse.json({ error: 'Failed to update course', details: courseError.message }, { status: 500 });
    }

    if (!updatedCourse) {
      return NextResponse.json({ error: 'Course not found or failed to update' }, { status: 404 });
    }

    const { data: existingLessonsAndSubLessonsInDb, error: fetchExistingLessonsError } = await supabase
      .from('lessons')
      .select('id, sub_lessons(id)')
      .eq('course_id', id);

    if (fetchExistingLessonsError) {
      console.error('Error fetching existing lessons:', fetchExistingLessonsError);
      return NextResponse.json({ error: 'Failed to process lessons due to fetch error', details: fetchExistingLessonsError.message }, { status: 500 });
    }

    const newLessonPayloads: Omit<LessonAttributes, 'id' | 'created_at' | 'sub_lessons_attributes' | 'client_side_key'>[] = [];
    const existingLessonPayloadsForUpsert: (Omit<LessonAttributes, 'created_at' | 'sub_lessons_attributes' | 'client_side_key'> & { id: string })[] = [];
    
    const allSubLessonsToProcess: (SubLessonAttributes & { parent_lesson_client_side_key: string | number })[] = [];
    const lessonClientKeysFromPayload: (string | number)[] = []; // Store client-side keys or DB IDs from payload
    const subLessonDbIdsToKeep: string[] = [];

    if (lessons_attributes && Array.isArray(lessons_attributes)) {
      lessons_attributes.forEach((lessonData: LessonAttributes, lessonIndex) => {
        const { id: lessonId, sub_lessons_attributes, ...lessonDetails } = lessonData;
        const lessonClientSideKey = lessonId || `new-lesson-placeholder-${lessonIndex}`;
        lessonClientKeysFromPayload.push(lessonClientSideKey);

        const commonLessonPayload = {
          course_id: updatedCourse.id,
          order_no: lessonIndex,
          title: lessonDetails.title || lessonDetails.name || '',
          updated_at: getBangkokISOString(),
        };

        if (lessonId && typeof lessonId === 'string' && !String(lessonId).startsWith('temp-')) {
          existingLessonPayloadsForUpsert.push({
            id: lessonId,
            ...commonLessonPayload,
          });
        } else {
          newLessonPayloads.push(commonLessonPayload);
        }

        if (sub_lessons_attributes && Array.isArray(sub_lessons_attributes)) {
          sub_lessons_attributes.forEach((subLessonData: SubLessonAttributes, subLessonIndex) => {
            const { id: subLessonId, ...subLessonDetails } = subLessonData;
            const subLessonPayload: any = {
              order_no: subLessonIndex,
              title: subLessonDetails.title || subLessonDetails.name || '',
              video_url: subLessonDetails.video_url || subLessonDetails.videoUrl || '',
              updated_at: getBangkokISOString(),
            };
            
            if (subLessonId && typeof subLessonId === 'string' && !String(subLessonId).startsWith('temp-')) {
              subLessonPayload.id = subLessonId;
              subLessonDbIdsToKeep.push(subLessonId);
            }
            allSubLessonsToProcess.push({ 
              ...subLessonPayload, 
              parent_lesson_client_side_key: lessonClientSideKey 
            });
          });
        }
      });
    }

    const existingLessonDbIds = existingLessonsAndSubLessonsInDb?.map(l => l.id) || [];
    const lessonsToDelete = existingLessonDbIds.filter(dbId => 
        !existingLessonPayloadsForUpsert.some(p => p.id === dbId)
    );

    if (lessonsToDelete.length > 0) {
      const { error: deleteSubLessonsOfDeletedLessonsError } = await supabase
        .from('sub_lessons')
        .delete()
        .in('lesson_id', lessonsToDelete);
      if (deleteSubLessonsOfDeletedLessonsError) {
        console.error('Error deleting sub-lessons of removed lessons:', deleteSubLessonsOfDeletedLessonsError);
      }
      
      const { error: deleteLessonsError } = await supabase.from('lessons').delete().in('id', lessonsToDelete);
      if (deleteLessonsError) {
        console.error('Error deleting lessons:', deleteLessonsError);
      }
    }
    
    let processedExistingLessons: any[] = [];
    if (existingLessonPayloadsForUpsert.length > 0) {
      const { data, error } = await supabase
        .from('lessons')
        .upsert(existingLessonPayloadsForUpsert, { onConflict: 'id' })
        .select('id, title, order_no, course_id');
      if (error) {
        console.error('Error upserting existing lessons:', error);
        return NextResponse.json({ error: 'Failed to save existing lessons', details: error.message }, { status: 500 });
      }
      processedExistingLessons = data || [];
    }

    // Insert new lessons
    let insertedNewLessons: any[] = [];
    if (newLessonPayloads.length > 0) {
      const { data, error: insertError } = await supabase
        .from('lessons')
        .insert(newLessonPayloads) 
        .select('id, title, order_no, course_id'); 
      if (insertError) {
        console.error('Error inserting new lessons:', insertError);
        return NextResponse.json({ error: 'Failed to save new lessons', details: insertError.message }, { status: 500 });
      }
      insertedNewLessons = data || [];
    }
    
    const allUpsertedAndInsertedLessons = [...processedExistingLessons, ...insertedNewLessons];

    const lessonClientKeyToDbIdMap = new Map<string | number, string>();
    lessons_attributes?.forEach((lessonAttr, index) => {
        const clientKey = lessonAttr.id || `new-lesson-placeholder-${index}`;
        let dbLessonMatch;
        if (lessonAttr.id && typeof lessonAttr.id === 'string' && !String(lessonAttr.id).startsWith('temp-')) {
            dbLessonMatch = allUpsertedAndInsertedLessons.find(l => l.id === lessonAttr.id);
        } else {
            const expectedTitle = lessonAttr.title || lessonAttr.name || '';
            dbLessonMatch = allUpsertedAndInsertedLessons.find(l =>
                l.course_id === updatedCourse.id &&
                l.order_no === index &&
                l.title === expectedTitle
            );
        }

        if (dbLessonMatch) {
            lessonClientKeyToDbIdMap.set(clientKey, dbLessonMatch.id);
        } else {
            const expectedTitle = lessonAttr.title || lessonAttr.name || '';
            console.warn(`Could not map lesson (client key: ${clientKey}, title: "${expectedTitle}", order: ${index}) to DB ID after upsert/insert. All DB lessons:`, JSON.stringify(allUpsertedAndInsertedLessons));
        }
    });
    
    const newSubLessonsToInsert: any[] = [];
    const existingSubLessonsToUpdate: any[] = [];
    
    for (const subLessonToProcess of allSubLessonsToProcess) {
      const parentLessonClientKey = subLessonToProcess.parent_lesson_client_side_key;
      const actualParentLessonDbId = lessonClientKeyToDbIdMap.get(parentLessonClientKey);

      if (actualParentLessonDbId) {
        const { parent_lesson_client_side_key, id, ...commonSubLessonData } = subLessonToProcess;
        
        const basePayload = {
          lesson_id: actualParentLessonDbId,
          ...commonSubLessonData
        };

        if (id && typeof id === 'string' && !String(id).startsWith('temp-')) {
          existingSubLessonsToUpdate.push({
            ...basePayload,
            id: id
          });
        } else {
          newSubLessonsToInsert.push(basePayload);
        }
      } else {
        console.warn(`Could not determine DB ID for parent lesson (client key: ${parentLessonClientKey}) for sub-lesson title:`, subLessonToProcess.title);
      }
    }
    const existingSubLessonDbIds = existingLessonsAndSubLessonsInDb?.flatMap(l => l.sub_lessons.map((sl: any) => sl.id)) || [];
    const subLessonsToDelete = existingSubLessonDbIds.filter(dbId => !subLessonDbIdsToKeep.includes(dbId));
    if (subLessonsToDelete.length > 0) {
      const { error: deleteSubLessonsError } = await supabase.from('sub_lessons').delete().in('id', subLessonsToDelete);
      if (deleteSubLessonsError) {
          console.error('Error deleting old sub-lessons:', deleteSubLessonsError);
      }
    }

    if (existingSubLessonsToUpdate.length > 0) {
      // console.log('Updating existing sub-lessons:', existingSubLessonsToUpdate);
      
      const updatePromises = existingSubLessonsToUpdate.map(subLesson => {
        const { id, ...updateData } = subLesson;
        return supabase
          .from('sub_lessons')
          .update(updateData)
          .eq('id', id)
          .select();
      });
      
      try {
        const updateResults = await Promise.all(updatePromises);
        const updateErrors = updateResults
          .filter(result => result.error)
          .map(result => result.error);
          
        if (updateErrors.length > 0) {
          console.error('Errors updating sub-lessons:', updateErrors);
          return NextResponse.json({ error: 'Failed to update some sub-lessons', details: updateErrors }, { status: 500 });
        }
      } catch (updateError) {
        console.error('Error updating sub-lessons:', updateError);
        return NextResponse.json({ error: 'Failed to update sub-lessons', details: updateError }, { status: 500 });
      }
    }

    if (newSubLessonsToInsert.length > 0) {
      // console.log('Inserting new sub-lessons:', newSubLessonsToInsert);
      const { error: insertSubLessonsError } = await supabase
        .from('sub_lessons')
        .insert(newSubLessonsToInsert)
        .select();
      
      if (insertSubLessonsError) {
        console.error('Error inserting new sub-lessons:', insertSubLessonsError);
        return NextResponse.json({ error: 'Failed to insert new sub-lessons', details: insertSubLessonsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Course updated successfully', course: updatedCourse });

  } catch (error: any) {
    console.error('Error in PUT /api/admin/courses-update/[courseId]:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
