"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Course } from '../types';

interface CoursesContextType {
    courses: Course[];
    isLoading: boolean;
    error: string | null;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    handleDeleteCourse: (id: string) => Promise<void>;
    fetchCourses: () => Promise<void>;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export const CoursesProvider = ({ children }: { children: ReactNode }) => {
    const [rawCourses, setRawCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/courses-list');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to fetch courses: ${response.statusText}`);
            }
            const data: Course[] = await response.json();
            setRawCourses(data);
        } catch (err) {
            setError((err as Error).message);
            console.error("Error fetching courses:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleDeleteCourse = useCallback(async (id: string) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            try {
                const response = await fetch(`/api/admin/courses-delete/${id}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete course');
                }
                setRawCourses(prevCourses => prevCourses.filter(course => course.id !== id));
                alert('Course deleted successfully');
            } catch (err) {
                alert(`Error deleting course: ${(err as Error).message}`);
                console.error("Error deleting course:", err);
            }
        }
    }, []);

    const courses = useMemo(() => {
        return rawCourses.filter(course =>
            (course.name || course.course_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [rawCourses, searchTerm]);

    const contextValue = useMemo(() => ({
        courses,
        isLoading,
        error,
        searchTerm,
        setSearchTerm,
        handleDeleteCourse,
        fetchCourses,
    }), [courses, isLoading, error, searchTerm, handleDeleteCourse, fetchCourses]);

    return (
        <CoursesContext.Provider value={contextValue}>
            {children}
        </CoursesContext.Provider>
    );
};

export const useCoursesContext = () => {
    const context = useContext(CoursesContext);
    if (context === undefined) {
        throw new Error('useCoursesContext must be used within a CoursesProvider');
    }
    return context;
};
