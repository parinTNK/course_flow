import React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import { Lesson, SubLesson } from "@/types/Course";

type Props = {
  modules: Lesson[];
};

export default function CourseModules({ modules }: Props) {
  return (
    <div className="mb-12">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Module Samples</h2>
      <Accordion.Root type="single" collapsible className="space-y-4">
        {modules.map((module) => (
          <Accordion.Item
            key={module.id}
            value={module.id}
            className="border rounded-lg overflow-hidden"
          >
            <Accordion.Header asChild>
              <Accordion.Trigger className="w-full p-4 flex justify-between items-center text-left hover:bg-gray-50 transition cursor-pointer">
                <span className="flex items-start text-[18px] sm:text-xl">
                  <span className="text-gray-500 mr-4">
                    {String(module.order_no + 1).padStart(2, "0")}
                  </span>
                  {module.title}
                </span>
                <ChevronDownIcon
                  className="h-5 w-5 text-gray-400 transition-transform duration-200"
                  aria-hidden
                />
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content className="px-6 py-2 text-gray-600 bg-gray-50 space-y-2">
              {module.sub_lessons?.map((sub: SubLesson) => (
                <div key={sub.id} className="pl-6 text-[14px] sm:text-base">• {sub.title}</div>
              ))}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}
