"use client"

import NavBar from "@/components/nav";
import Footer from "@/components/footer";
import { useState } from "react";
import Link from "next/link";

export default function CourseDetail() {
    const mockUser = {
        name: "John Donut",
        avatarUrl: "https://i.pravatar.cc/150?img=45",
    };

    const [showModal, setShowModal] = useState(false);
    
    // Mock data สำหรับ Module Samples
    const [expandedModule, setExpandedModule] = useState<number | null>(null);

    const modules = [
        {
            id: 1,
            title: "Introduction",
            topics: [
                "Welcome to the Course",
                "Course Overview",
                "Getting to Know You",
                "What is Service Design ?",
                "Service Design vs. UX vs. UI vs. Design Thinking",
                "4 Levels of Service Design in an Organization",
                "Scope of Service Design",
                "Develop an Entirely New Service - U Drink I Drive",
                "Improving Existing Services - Credit Cards",
                "Improving Existing Services - MK",
                "Levels of Impact"
            ]
        },
        {
            id: 2,
            title: "Service Design Theories and Principles",
            topics: []
        },
        {
            id: 3,
            title: "Understanding Users and Finding Opportunities",
            topics: []
        },
        {
            id: 4,
            title: "Identifying and Validating Opportunities for Design",
            topics: []
        },
        {
            id: 5,
            title: "Prototyping",
            topics: []
        },
        {
            id: 6,
            title: "Course Summary",
            topics: []
        }
    ];

    // Mock data สำหรับ Related Courses
    const relatedCourses = [
        {
            id: 1,
            title: "Service Design Essentials",
            description: "Lorem ipsum dolor sit amet, conse ctetur adipiscing elit.",
            image: "/path/to/service-design-image.jpg",
            lessons: 6,
            hours: 6
        },
        {
            id: 2,
            title: "Software Developer",
            description: "Lorem ipsum dolor sit amet, conse ctetur adipiscing elit.",
            image: "/path/to/software-dev-image.jpg",
            lessons: 6,
            hours: 6
        },
        {
            id: 3,
            title: "UX/UI Design Beginer",
            description: "Lorem ipsum dolor sit amet, conse ctetur adipiscing elit.",
            image: "/path/to/uxui-design-image.jpg",
            lessons: 6,
            hours: 6
        }
    ];

    const toggleModule = (moduleId: number) => {
        if (expandedModule === moduleId) {
            setExpandedModule(null);
        } else {
            setExpandedModule(moduleId);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <NavBar user={mockUser} />
            
            <main className="flex-grow container mx-auto mt-20 px-4 py-8">
                {/* Back button */}
                <Link href="/our-courses" className="text-blue-600 mb-6 inline-block">
                    ← Back
                </Link>

                {/* Course Header Section */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="md:col-span-2">
                        <div className="relative w-full h-[400px] bg-gray-200 rounded-lg overflow-hidden">
                            {/* Placeholder for video/thumbnail */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-4xl">▶</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="md:col-span-1">
                        <div className="p-6 border rounded-lg">
                            <span className="text-orange-500">Course</span>
                            <h1 className="text-2xl font-bold mb-2">Service Design Essentials</h1>
                            <p className="text-gray-600 mb-4">Lorem ipsum dolor sit amet, conse ctetur adipiscing elit.</p>
                            <p className="text-2xl font-bold mb-6">THB 3,559.00</p>
                            
                            <button className="w-full mb-3 py-2 px-4 border border-orange-500 text-orange-500 rounded hover:bg-orange-50">
                                Add to Wishlist
                            </button>
                            <button 
                                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={() => setShowModal(true)}
                            >
                                Subscribe This Course
                            </button>
                        </div>
                    </div>
                </div>

                {/* Course Detail Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Course Detail</h2>
                    <div className="prose max-w-none">
                        <p className="text-gray-600">
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Elementum aenean fermentum, velit vel, scelerisque morbi accumsan. Nec, tellus leo id leo id felis egestas. Quam sit lorem quis vitae ut mus imperdiet. Volutpat placerat dignissim dolor faucibus elit ornare fringilla. Vivamus amet risus ullamcorper auctor nibh. Maecenas morbi nec vestibulum ac tempus vehicula.
                        </p>
                    </div>
                </div>

                {/* Module Samples Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Module Samples</h2>
                    <div className="space-y-4">
                        {modules.map((module) => (
                            <div key={module.id} className="border rounded-lg">
                                <button
                                    className="w-full p-4 text-left flex items-center justify-between"
                                    onClick={() => toggleModule(module.id)}
                                >
                                    <span className="flex items-center">
                                        <span className="text-gray-500 mr-4">{String(module.id).padStart(2, '0')}</span>
                                        {module.title}
                                    </span>
                                    <span className={`transform transition-transform ${expandedModule === module.id ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>
                                {expandedModule === module.id && module.topics.length > 0 && (
                                    <div className="p-4 pt-0">
                                        <ul className="space-y-2 text-gray-600">
                                            {module.topics.map((topic, index) => (
                                                <li key={index} className="pl-12">• {topic}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Other Interesting Courses Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Other Interesting Courses</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {relatedCourses.map((course) => (
                            <Link href={`/course-detail/${course.id}`} key={course.id}>
                                <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="relative h-48 bg-gray-200">
                                        {/* Course Image Placeholder */}
                                    </div>
                                    <div className="p-4">
                                        <span className="text-orange-500">Course</span>
                                        <h3 className="font-bold mb-2">{course.title}</h3>
                                        <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <span className="mr-4">{course.lessons} Lesson</span>
                                            <span>{course.hours} Hours</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Confirmation</h3>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                        <p className="mb-6">Do you sure to subscribe Service Design Essentials Course?</p>
                        <div className="flex justify-end space-x-4">
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

            <Footer />
        </div>
    );
}