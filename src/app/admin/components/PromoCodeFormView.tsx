import React from 'react';
import { ButtonT } from '@/components/ui/ButtonT';
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

const allCoursesOption = { id: "all", name: "All courses" };
const coursesList = [
  allCoursesOption,
  { id: "1", name: "Service Design Essentials" },
  { id: "2", name: "Software Developer" },
  { id: "7", name: "UX/UI Design Beginer" },
  { id: "3", name: "Product Design for Business 101" },
  { id: "4", name: "Product Design for Business 201" },
  { id: "5", name: "Product Design for Business 301" },
  { id: "6", name: "Product Design for Business 401" },
];

interface PromoCodeFormViewProps {
  formData: {
    code: string;
    min_purchase_amount: string;
    discount_type: string;
    discount_value: string;
    course_ids: string[];
  };
  isLoading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleDiscountTypeChange: (type: string) => void;
  handleCoursesChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void; // ไม่ใช้ select แล้ว
  handleCancel: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  setFormData?: any; // เพิ่มถ้าต้องการ set state จาก parent
}

const inputBoxWidth = "w-full"; // ใช้กับทั้ง input และ popover

const PromoCodeFormView: React.FC<PromoCodeFormViewProps> = ({
  formData,
  isLoading,
  handleInputChange,
  handleDiscountTypeChange,
  handleCancel,
  handleSubmit,
  setFormData,
}) => {
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  // เลือก/ไม่เลือกคอร์ส
  const handleToggleCourse = (id: string) => {
    if (!setFormData) return;
    setFormData((prev: any) => {
      if (id === "all") {
        return {
          ...prev,
          course_ids: prev.course_ids.includes("all") ? [] : ["all"],
        };
      }
      const filtered = prev.course_ids.filter((cid: string) => cid !== "all");
      const exists = filtered.includes(id);
      return {
        ...prev,
        course_ids: exists
          ? filtered.filter((cid: string) => cid !== id)
          : [...filtered, id],
      };
    });
  };

  // ลบ tag
  const handleRemoveTag = (id: string) => {
    if (!setFormData) return;
    setFormData((prev: any) => ({
      ...prev,
      course_ids: prev.course_ids.filter((cid: string) => cid !== id),
    }));
  };

  // แสดงชื่อคอร์สที่เลือก (ยกเว้น all)
  const selectedCourses = coursesList.filter(
    (c) => c.id !== "all" && formData.course_ids.includes(c.id)
  );

  return (
    <>
      <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 border-b-3 border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800">Add Promo code</h1>
        <div className="flex items-center space-x-4">
          <ButtonT variant="Secondary" className="w-[149px] h-[32px]" onClick={handleCancel}>
            Cancel
          </ButtonT>
          <ButtonT
            variant="primary"
            className="w-[149px] h-[32px]"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </ButtonT>
        </div>
      </div>

      <div className="bg-geay-50 flex-1 h-screen">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="px-24 py-14 mx-10 border-b-3 rounded-2xl bg-white">
            {/* 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Promo code */}
              <div>
                <label htmlFor="promo-code" className="block text-sm font-medium mb-2">
                  Set promo code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="promo-code"
                  name="code"
                  placeholder="Enter promo code"
                  className="w-full px-4 py-2 border rounded-md"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {/* Minimum purchase */}
              <div>
                <label htmlFor="min-purchase" className="block text-sm font-medium mb-2">
                  Minimum purchase amount (THB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="min-purchase"
                  name="min_purchase_amount"
                  placeholder="0"
                  className="w-full px-4 py-2 border rounded-md"
                  value={formData.min_purchase_amount}
                  onChange={handleInputChange}
                  min={0}
                  required
                />
              </div>
            </div>

            {/* Discount type */}
            <div className="mt-8">
              <label className="block text-sm font-medium mb-2">
                Select discount type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fixed */}
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="discount_type"
                    checked={formData.discount_type === "fixed"}
                    onChange={() => handleDiscountTypeChange("fixed")}
                    className="accent-blue-600"
                  />
                  <span>Fixed amount (THB)</span>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_type === "fixed" ? formData.discount_value : ""}
                    onChange={handleInputChange}
                    className="w-24 border border-gray-300 rounded-lg px-2 py-1 ml-2"
                    disabled={formData.discount_type !== "fixed"}
                    min={0}
                  />
                </label>
                {/* Percent */}
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="discount_type"
                    checked={formData.discount_type === "percent"}
                    onChange={() => handleDiscountTypeChange("percent")}
                    className="accent-blue-600"
                  />
                  <span>Percent (%)</span>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_type === "percent" ? formData.discount_value : ""}
                    onChange={handleInputChange}
                    className="w-24 border border-gray-300 rounded-lg px-2 py-1 ml-2"
                    disabled={formData.discount_type !== "percent"}
                    min={0}
                    max={100}
                  />
                </label>
              </div>
            </div>
            {/* Courses Included */}
            <div className="mt-8">
              <label className="block text-sm font-medium mb-2">
                Courses Included
              </label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <div
                    className={`relative ${inputBoxWidth} min-h-[48px] border rounded-md px-3 py-2 flex flex-wrap items-center gap-2 cursor-pointer ${
                      popoverOpen ? "border-orange-400" : "border-gray-300"
                    }`}
                    tabIndex={0}
                    onClick={() => setPopoverOpen(true)}
                  >
                    {formData.course_ids.includes("all") ? (
                      <span className="bg-gray-100 px-3 py-1 rounded-full text-sm mr-2">
                        All courses
                      </span>
                    ) : selectedCourses.length === 0 ? (
                      <span className="text-gray-400">Select courses</span>
                    ) : (
                      selectedCourses.map((course) => (
                        <span
                          key={course.id}
                          className="flex items-center bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-sm mr-2"
                        >
                          {course.name}
                          <button
                            type="button"
                            className="ml-1 text-gray-400 hover:text-red-500"
                            onClick={e => {
                              e.stopPropagation();
                              handleRemoveTag(course.id);
                            }}
                          >
                            <X size={16} />
                          </button>
                        </span>
                      ))
                    )}
                    <span className="ml-auto text-gray-400">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M6 9l6 6 6-6"/></svg>
                    </span>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className={`${inputBoxWidth} p-0`}
                  style={{ minWidth: "100%" }}
                >
                  <Command>
                    <CommandInput placeholder="Search courses..." />
                    <CommandList>
                      {coursesList.map((course) => (
                        <CommandItem key={course.id} className="flex items-center">
                          <Checkbox
                            checked={
                              course.id === "all"
                                ? formData.course_ids.includes("all")
                                : formData.course_ids.includes(course.id)
                            }
                            onCheckedChange={() => handleToggleCourse(course.id)}
                            id={course.id}
                          />
                          <label htmlFor={course.id} className="ml-2 cursor-pointer select-none">
                            {course.name}
                          </label>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default PromoCodeFormView;