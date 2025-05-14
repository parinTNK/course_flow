import React, { useState } from "react";

interface Module {
    id: number;
    title: string;
    order_no: number;
    sub_lessons: any[];
}

interface CourseModulesProps {
    modules: Module[];
}

export const CourseModules: React.FC<CourseModulesProps> = ({ modules }) => {
    const [expandedModule, setExpandedModule] = useState<number | null>(null);

    const toggleModule = (moduleId: number) => {
        setExpandedModule(expandedModule === moduleId ? null : moduleId);
    };

    return (
        <div className="space-y-4">
            {modules.map((module) => (
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
    );
};