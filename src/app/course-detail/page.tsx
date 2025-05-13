"use client"

import React from 'react';
import NavBar from "@/components/nav";
import Footer from "@/components/footer";
import CourseCard from "@/components/CourseCard";
import { useEffect, useState } from "react";
import { VideoOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";

const CourseDetailPage: React.FC = () => {
    const searchParams = useSearchParams();
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const mockUser = {
        name: "John Donut",
        avatarUrl: "https://i.pravatar.cc/150?img=45",
    };

    const [showModal, setShowModal] = useState(false);
    const [expandedModule, setExpandedModule] = useState<number | null>(null);
    const [courses, setCourses] = useState<any>(null);
    const [modules, setModules] = useState<any[]>([]);
    const [otherCourses, setOtherCourses] = useState<any[]>([]); 

    // fetch data from supabase
    useEffect(() => {
        const fetchData = async () => {
            const courseId = searchParams.get('id') || "10feb05e-8999-425f-bc0d-9c0940bf1e04";

            const { data: courseData, error: courseError } = await supabase
                .from("courses")
                .select("*")
                .eq("id", courseId)
                .single();

            const { data: moduleData, error: moduleError } = await supabase
                .from("lessons")
                .select("*, sub_lessons(*)")
                .eq("course_id", courseId)
                .order("order_no", { ascending: true });

            const { data: otherCourseData, error: otherCourseError } = await supabase
                .from("courses")
                .select(`
                    *,
                    lessons:lessons(count)
                `)
                .neq("id", courseId)
                .limit(3);

            if (courseData) setCourses(courseData);
            if (moduleData) setModules(moduleData);
            if (otherCourseData) {
                const formattedOtherCourses = otherCourseData.map(course => ({
                    ...course,
                    total_lessons: course.lessons.count
                }));
                setOtherCourses(formattedOtherCourses);
            }

            if (courseError || moduleError || otherCourseError) {
                console.error(courseError || moduleError || otherCourseError);
            }
        };

        fetchData();
    }, [searchParams]); // เพิ่ม searchParams เป็น dependency

    const toggleModule = (moduleId: number) => {
       setExpandedModule(expandedModule === moduleId ? null : moduleId);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <NavBar user={isAuthenticated ? mockUser : null} />
            
            <main className="flex-grow container mx-auto mt-20 px-4 py-8">
                {/* Back button */}
                <Link href="/our-courses" className="text-blue-600 mb-6 inline-flex items-center">
                    <img src="/Left-Arrow.svg" alt="Back Button" className="mr-1"/> 
                    <span>Back</span>
                </Link>

                {/* Course Header Section */}
                <div className="grid md:grid-cols-3 gap-8 mb-12 relative">
                    {/* Content Area */}
                    <div className="md:col-span-2">
                        {courses?.video_trailer_url ? (
                            <video 
                                className="relative w-full h-[400px] bg-gray-200 rounded-lg overflow-hidden"
                                controls>
                                <source src={courses?.video_trailer_url} type="video/mp4" />
                                    Your browser does not support the video tag.
                            </video>
                        ) : (
                            <div className="flex items-center justify-center w-full h-[400px] bg-gray-200 rounded-lg text-gray-500 text-sm">
                                <VideoOff className="w-10 h-10 mb-2" />
                                    <span>Video not found</span>
                            </div>
                        )}  

                        {/* Course Detail Section */}
                        <div className="my-12">
                            <h2 className="text-2xl font-bold mb-4">Course Detail</h2>
                            <div className="prose max-w-none text-gray-600">
                                {courses?.detail?.split('\n\n').map((para, idx) => (
                                <p key={idx} className="mb-4 whitespace-pre-line">
                                    {para}
                                </p>
                            ))}
                            </div>
                        </div>   

                        {/* Module Samples Section */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold mb-4">Module Samples</h2>
                            <div className="space-y-4">
                                {modules.map((module: any) => (
                                    <div key={module.id} className="border rounded-lg">
                                        <button
                                            className="w-full p-4 text-left flex items-center justify-between"
                                            onClick={() => toggleModule(module.id)}
                                        >
                                            <span className="flex items-center">
                                                <span className="text-gray-500 mr-4">{String(module.order_no).padStart(2, '0')}</span>
                                                {module.title}
                                            </span>
                                            <span className={`transform transition-transform ${expandedModule === module.id ? 'rotate-180' : ''}`}>
                                                ▼
                                            </span>
                                        </button>
                                        {expandedModule === module.id && module.title.length > 0 && (
                                            <div className="p-4 pt-0">
                                                <ul className="space-y-2 text-gray-600">
                                                    {module.sub_lessons?.map((sub: any) => (
                                                        <li key={sub.id} className="pl-12">• {sub.title}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Sticky Area */}
                    <div className="md:col-span-1">
                        <div className="sticky top-30 mb-12 p-6 border rounded-lg bg-white z-10">
                            <span className="text-orange-500">Course</span>
                            <h1 className="text-2xl font-bold mb-2">{courses?.name}</h1>
                            <p className="text-gray-600 mb-4">{courses?.summary}</p>
                            <p className="text-2xl font-bold mb-6">THB {courses?.price?.toLocaleString()}</p>
                            
                            {isAuthenticated ? (
                                <>
                                    <button className="w-full mb-3 py-2 px-4 border border-orange-500 text-orange-500 rounded hover:bg-orange-50">
                                        Add to Wishlist
                                    </button>
                                    <button 
                                        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        onClick={() => setShowModal(true)}
                                    >
                                        Subscribe This Course
                                    </button>
                                </>
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
                    </div>
                </div>

                {/* Other Interesting Courses Section */}
                <div className="mb-12">
                    <hr></hr>
                    <h2 className="text-center text-2xl font-bold my-6 ">Other Interesting Courses</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {otherCourses.map((course) => (
                            <Link href={`/course-detail?id=${course.id}`} key={course.id}>
                                <CourseCard course={course} />
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            {/* Modal - แสดงเฉพาะเมื่อ login แล้ว */}
            {isAuthenticated && showModal && (
                <div className="fixed inset-0 bg-white bg-opacity-100 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Confirmation</h3>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <img src="/Frame-6.svg" alt="X Button" />
                            </button>
                        </div>
                        <p className="mb-6">Do you sure to subscribe {courses.name} Course?</p>
                        <div className="flex space-x-4">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                            >
                                No, I don't
                            </button>
                            <Link 
                                href="/payment"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Yes, I want to subscribe
                            </Link>
                        </div>
                    </div>
                </div>
            )}
         
            {/* Register Section - แสดงเฉพาะเมื่อเป็น Guest */}
            {!isAuthenticated && (
                <div className="bg-blue-600 text-white py-16 px-4 rounded-lg">
                    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
                        <div className="md:w-1/2 mb-8 md:mb-0">
                            <h2 className="text-3xl font-bold mb-4">Want to start learning?</h2>
                            <Link 
                                href="/register" 
                                className="inline-block px-8 py-3 bg-white text-orange-500 rounded-lg font-semibold hover:bg-gray-100"
                            >
                                Register here
                            </Link>
                        </div>
                        <div className="md:w-1/2">
                            <img 
                                src="/learning.svg" 
                                alt="Learning Illustration" 
                                className="w-full max-w-md mx-auto"
                            />
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
export default CourseDetailPage;