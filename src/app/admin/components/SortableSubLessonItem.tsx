import React, { useRef, useState } from 'react';
import { MdOutlineDragIndicator } from 'react-icons/md';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SubLesson } from '@/types/courseAdmin';
import SubLessonVideoUpload, { SubLessonVideoUploadRef } from '@/app/admin/components/SubLessonVideoUpload';

interface SortableSubLessonItemProps {
  subLesson: SubLesson;
  onRemove: (id: number | string) => void;
  onNameChange: (id: number | string, name: string) => void;
  onVideoUpdate?: (subLessonId: number | string, assetId: string, playbackId: string) => void;
  onVideoDelete?: (subLessonId: number | string) => void;
  onVideoUploadStateChange?: (subLessonId: number | string, uploadState: {
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
    currentAssetId?: string | null
  }) => void;
  videoUploadRefs?: React.MutableRefObject<Record<string | number, SubLessonVideoUploadRef | null>>;
}

export function SortableSubLessonItem({ 
  subLesson, 
  onRemove, 
  onNameChange, 
  onVideoUpdate, 
  onVideoDelete,
  onVideoUploadStateChange,
  videoUploadRefs
}: SortableSubLessonItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: subLesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  
  const videoUploadRef = useRef<SubLessonVideoUploadRef>(null);
  const [refReady, setRefReady] = useState(false);
  const lastLogTime = useRef<number>(0);
  
  React.useEffect(() => {
    if (videoUploadRefs && videoUploadRef.current && !refReady) {
      const now = Date.now();
      if (now - lastLogTime.current > 3000) {
        console.log(`✅ SubLesson[${subLesson.id}]: Video ref registered`);
        lastLogTime.current = now;
      }
      videoUploadRefs.current[subLesson.id] = videoUploadRef.current;
      setRefReady(true);
    }
  });
  
  React.useEffect(() => {
    return () => {
      if (videoUploadRefs && subLesson.id) {
        delete videoUploadRefs.current[subLesson.id];
      }
    };
  }, [subLesson.id, videoUploadRefs]);

  const setVideoUploadRef = React.useCallback((ref: SubLessonVideoUploadRef | null) => {
    videoUploadRef.current = ref;
    
    if (ref && videoUploadRefs) {
      videoUploadRefs.current[subLesson.id] = ref;
    }
  }, [subLesson.id, videoUploadRefs]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#F6F7FC] rounded-lg p-6 mb-4 relative"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-grab text-gray-400"
      >
        <MdOutlineDragIndicator size={20} />
      </div>

      <button
        type="button"
        onClick={() => onRemove(subLesson.id)}
        className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
      >
        Delete
      </button>

      <div className="mb-4 ml-7">
        <label className="block text-sm font-medium mb-1">
          Sub-lesson name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder="Enter sub-lesson name"
          value={subLesson.name || subLesson.title || ''}
          onChange={e => onNameChange(subLesson.id, e.target.value)}
        />
      </div>

      <div className="ml-7">
        <label className="block text-sm font-medium mb-1">
          Video <span className="text-red-500">*</span>
        </label>
        <SubLessonVideoUpload
          ref={setVideoUploadRef}
          subLessonId={subLesson.id}
          existingAssetId={subLesson.mux_asset_id}
          existingPlaybackId={subLesson.video_url || subLesson.videoUrl}
          onVideoUpdate={onVideoUpdate}
          onVideoDelete={onVideoDelete}
          onUploadStateChange={onVideoUploadStateChange}
        />
      </div>
    </div>
  );
}
