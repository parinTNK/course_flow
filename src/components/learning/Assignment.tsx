"use client";

import { useLearning } from "./context/LearningContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Assignment() {
  const { currentLesson } = useLearning();
  const [assignmentStatus, setAssignmentStatus] = useState<"pending" | "submitted">("pending");
  const [assignmentAnswer, setAssignmentAnswer] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // ดึงข้อมูล user จาก session
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();
  }, []);

  const handleSubmit = async () => {
    try {
      // ตรวจสอบว่ามี user และข้อมูลที่จำเป็นครบถ้วน
      if (!currentLesson?.id || !assignmentAnswer.trim() || !user?.id) {
        throw new Error('Answer is required');
      }

      // ส่งข้อมูลไปยัง Supabase
      const { data, error } = await supabase
        .from('submissions')
        .insert([
          {
            assignment_id: currentLesson.assignment?.id, // Make sure assignment exists
            user_id: user?.id, // Need to get current user ID
            submission_date: new Date().toISOString(),
            status: 'submitted',
            grade: null // Grade will be updated by instructor later
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from submission');
      }

      setAssignmentStatus("submitted");
    } catch (error) {
      // Proper error handling with specific error message
      console.error('Error submitting assignment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to submit assignment: ${errorMessage}`);
    }
  };

  return (
    <div className="mt-8 p-6 border rounded-lg bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Assignment</h2>
        <span className={`px-3 py-1 rounded-full text-sm ${
          assignmentStatus === "submitted" 
            ? "bg-green-100 text-green-800" 
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {assignmentStatus === "submitted" ? "Submitted" : "Pending"}
        </span>
      </div>
      
      <p className="mb-4">{currentLesson?.assignment?.description}</p>
      
      {assignmentStatus === "pending" ? (
        <>
          <textarea
            className="w-full p-3 border rounded-lg mb-4 min-h-[120px]"
            value={assignmentAnswer}
            onChange={(e) => setAssignmentAnswer(e.target.value)}
            placeholder="Answer..."
          />
          <div className="flex justify-between items-center">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={handleSubmit}
              disabled={!assignmentAnswer.trim()}
            >
              Send Assignment
            </button>
            <span className="text-sm text-gray-500">Assign within 2 days</span>
          </div>
        </>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-medium mb-2">คำตอบของคุณ:</p>
          <p className="text-gray-700">{assignmentAnswer}</p>
        </div>
      )}
    </div>
  );
}