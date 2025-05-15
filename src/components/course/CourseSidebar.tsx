import Link from "next/link";
import React from "react";

interface CourseSidebarProps {
    course: any;
    isAuthenticated: boolean;
    isSubscribed: boolean;
    onSubscribe: () => void;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
    course,
    isAuthenticated,
    isSubscribed,
    onSubscribe
}) => {
    return (
        <div className="sticky top-30 mb-12 p-6 border rounded-lg bg-white z-10">
            <span className="text-orange-500">Course</span>
            <h1 className="text-2xl font-bold mb-2">{course?.name}</h1>
            <p className="text-gray-600 mb-4">{course?.summary}</p>
            <p className="text-2xl font-bold mb-6">THB {course?.price?.toLocaleString()}</p>
            
            {isAuthenticated ? (
                isSubscribed ? (
                    <Link 
                        href={`/course-learning/${course?.id}`}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 block text-center"
                    >
                        Start Learning
                    </Link>
                ) : (
                    <>
                        <button className="w-full mb-3 py-2 px-4 border border-orange-500 text-orange-500 rounded hover:bg-orange-50">
                            Add to Wishlist
                        </button>
                        <button 
                            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={onSubscribe}
                        >
                            Subscribe This Course
                        </button>
                    </>
                )
            ) : (
                <>
                    <Link 
                        href="/login" 
                        className="w-full mb-3 py-2 px-4 border border-orange-500 text-orange-500 rounded hover:bg-orange-50 block text-center"
                    >
                        Add to Wishlist
                    </Link>
                    <Link 
                        href="/login"
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 block text-center"
                    >
                        Subscribe This Course
                    </Link>
                </>
            )}
        </div>
    );
};