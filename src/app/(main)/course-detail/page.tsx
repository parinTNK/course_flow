"use client"

import React from 'react';
import NavBar from "@/components/nav";
import Footer from "@/components/footer";
import CourseCard from "@/components/CourseCard";
import CallToAction from '@/components/landing/CallToAction';
import { useEffect, useState } from "react";
import { VideoOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel";
import ConfirmationModal from "@/app/admin/components/ConfirmationModal";

const CourseDetailPage: React.FC = () => {
    const searchParams = useSearchParams();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

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

            // เช็คสถานะ subscribe จาก database
            const { data: subscriptionData, error: subscriptionError } = await supabase
                .from("subscriptions")
                .select("*")
                .eq("course_id", courseId)
                .eq("user_id", "current_user_id") // ต้องแทนที่ด้วย user id จริง
                .single();

            if (subscriptionData) {
                setIsSubscribed(true);
            }

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
                    lessons!inner(
                        id,
                        sub_lessons(count)
                    )
                `)
                .neq("id", courseId);

            if (courseData) setCourses(courseData);
            if (moduleData) setModules(moduleData);
            if (otherCourseData) {
                const formattedOtherCourses = otherCourseData.map(course => {
                    // คำนวณจำนวน lessons ทั้งหมด (รวม sub_lessons)
                    const totalSubLessons = course.lessons.reduce((total: number, lesson: any) => {
                        return total + (lesson.sub_lessons?.count || 0);
                    }, 0);
                    
                    return {
                        ...course,
                        total_lessons: totalSubLessons
                    };
                });
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
            <main className="flex-grow container mx-auto mt-20 px-4 py-8">
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

                        {/* Attach File Section - แสดงเฉพาะเมื่อ user subscribe แล้ว */}
                        {isAuthenticated && isSubscribed && (
                            <div className="my-12">
                                <h2 className="text-2xl font-bold mb-4">Attach File</h2>
                                {courses?.attachment_url ? (
                                    <a 
                                        href={courses.attachment_url}
                                        download
                                        className="block bg-blue-50 p-4 rounded-lg w-full max-w-sm hover:bg-blue-100 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-white p-2 rounded">
                                                <img src="/file.svg" alt="Document" className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{courses.name}.pdf</p>
                                                <p className="text-xs text-gray-500">68 mb</p>
                                            </div>
                                        </div>
                                    </a>
                                ) : (
                                    <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center text-gray-500 w-full max-w-md">
                                        <p>No attachment file available for this course</p>
                                    </div>
                                )}
                            </div>
                        )}

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
                                isSubscribed ? (
                                    <Link 
                                        href={`/course-learning/${courses?.id}`}
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
                                            onClick={() => setShowModal(true)}
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
                    </div>
                </div>

                {/* Other Interesting Courses Section - แสดงเฉพาะเมื่อยังไม่ได้ subscribe */}
                {!isSubscribed && (
                    <div className="mb-12">
                        <hr></hr>
                        <h2 className="text-center text-2xl font-bold my-6">Other Interesting Courses</h2>
                        <div className="relative">
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-1 md:-ml-2">
                                    {otherCourses.map((course) => (
                                        <CarouselItem key={course.id} className="pl-1 md:pl-2 md:basis-1/3">
                                            <div className="scale-95 px-6"> {/* เปลี่ยนจาก mx-4 เป็น px-6 */}
                                                <Link href={`/course-detail?id=${course.id}`}>
                                                    <CourseCard course={course} />
                                                </Link>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="absolute -left-4 -translate-y-1/2 bg-white shadow-lg" /> {/* ปรับตำแหน่งและเพิ่ม shadow */}
                                <CarouselNext className="absolute -right-4 -translate-y-1/2 bg-white shadow-lg" /> {/* ปรับตำแหน่งและเพิ่ม shadow */}
                            </Carousel>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal - แสดงเฉพาะเมื่อ login แล้ว */}
            {isAuthenticated && (
                <ConfirmationModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onConfirm={() => {
                        setShowModal(false);
                        window.location.href = '/payment';
                    }}
                    title="Confirmation"
                    message={`Do you sure to subscribe ${courses?.name} Course?`}
                    confirmText="Yes, I want to subscribe"
                    cancelText="No, I don't"
                    confirmButtonClass="bg-[#1D4ED8] text-white hover:bg-blue-700" // ปรับสีให้ตรงตามรูป
                    cancelButtonClass="bg-[#1D4ED8] text-white hover:bg-blue-700" // ทำให้ปุ่ม Cancel มีสีเหมือนกัน
                />
            )}
         
            {/* Register Section - แสดงเฉพาะเมื่อเป็น Guest */}
            {!isAuthenticated && <CallToAction />}
        </div>
    );
}
export default CourseDetailPage;