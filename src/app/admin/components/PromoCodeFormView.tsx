import React,{ useState, useEffect, useRef, useCallback, useMemo} from "react";
import { ButtonT } from "@/components/ui/ButtonT";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCustomToast } from "@/components/ui/CustomToast";


interface Course {
  id: string;
  name: string;
  price?: number;
}

interface PromoCodeFormViewProps {
  formData: {
    code: string;
    min_purchase_amount: string;
    discount_type: string;
    discount_value: string;
    course_ids: string[];
  };
  isLoading: boolean;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleDiscountTypeChange: (type: string) => void;
  handleCoursesChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleCancel: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  setFormData?: any;
}

const PromoCodeFormView: React.FC<PromoCodeFormViewProps> = ({
  formData,
  isLoading,
  handleInputChange,
  handleDiscountTypeChange,
  handleCancel,
  handleSubmit,
  setFormData,
}) => {
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number>(0);

  const { success: toastSuccess, error: toastError } = useCustomToast();

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);    
      setError(null);        
      try {
        const res = await axios.get("/api/course");
        setCoursesList([
          { id: "all", name: "All Courses" },
          ...(res.data || []),
        ]);
      } catch (err) {
        setCoursesList([{ id: "all", name: "All Courses" }]);
        setError(`เกิดข้อผิดพลาดในการโหลดข้อมูล ${err.message}`);
      }finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);


  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [popoverOpen]);

  const handleToggleCourse = useCallback(
    (courseId: string) => {
      if (!setFormData) {
        return;
      }
      const currentIds = formData.course_ids || [];
      let newIds: string[] = [];

      if (currentIds.includes(courseId)) {
        // ถ้าเลือกอยู่แล้ว ให้ยกเลิก
        newIds = currentIds.filter((id: string) => id !== courseId);
      } else {
        // ถ้ายังไม่เลือก ให้เพิ่มเข้าไป
        newIds = [...currentIds, courseId];
      }
      setFormData((prev: any) => {
        const updated = { ...prev, course_ids: newIds };
        return updated;
      });
    },
    [formData.course_ids, setFormData]
  )

  // ลบ tag
  const handleRemoveTag = useCallback(
    (id: string) => {
      if (!setFormData) return;

      setFormData((prev: any) => ({
        ...prev,
        course_ids: prev.course_ids.filter((cid: string) => cid !== id),
      }));
    },
    [setFormData]
  );

  // แสดงชื่อคอร์สที่เลือก
  const getSelectedCoursesDisplay = useMemo(() => {
    return coursesList.filter((c) => formData.course_ids?.includes(c.id));
  }, [formData.course_ids]);

  return (
    <>
      <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 border-b-3 border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-800">Add Promo code</h1>
        <div className="flex items-center space-x-4">
          <ButtonT
            variant="Secondary"
            className="w-[149px] h-[32px]"
            onClick={handleCancel}
          >
            Cancel
          </ButtonT>
          <ButtonT
            variant="primary"
            className="w-[149px] h-[32px]"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? "Creating..." : "Create"}
          </ButtonT>
        </div>
      </div>

      <div className="bg-geay-50 flex-1 h-screen">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="px-24 py-14 mx-10 border-b-3 rounded-2xl bg-white">
            {/* Debug info */}
            {/* <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
              Debug - Selected course_ids: {JSON.stringify(formData.course_ids)}
            </div> */}

            {/* 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Promo code */}
              <div>
                <label
                  htmlFor="promo-code"
                  className="block text-sm font-medium mb-2"
                >
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
                <label
                  htmlFor="min-purchase"
                  className="block text-sm font-medium mb-2"
                >
                  Minimum purchase amount (THB){" "}
                  <span className="text-red-500">*</span>
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
                {/* Fixed amount */}
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="discount_type"
                    checked={formData.discount_type === "Fixed amount"}
                    onChange={() => handleDiscountTypeChange("Fixed amount")}
                    className="accent-blue-600"
                  />
                  <span>Fixed amount (THB)</span>
                  <input
                    type="number"
                    name="discount_value"
                    value={
                      formData.discount_type === "Fixed amount"
                        ? formData.discount_value
                        : ""
                    }
                    onChange={handleInputChange}
                    className="w-24 border border-gray-300 rounded-lg px-2 py-1 ml-2"
                    disabled={formData.discount_type !== "Fixed amount"}
                    min={0}
                  />
                </label>
                {/* Percent */}
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="discount_type"
                    checked={formData.discount_type === "Percent"}
                    onChange={() => handleDiscountTypeChange("Percent")}
                    className="accent-blue-600"
                  />
                  <span>Percent (%)</span>
                  <input
                    type="number"
                    name="discount_value"
                    value={
                      formData.discount_type === "Percent"
                        ? formData.discount_value
                        : ""
                    }
                    onChange={handleInputChange}
                    className="w-24 border border-gray-300 rounded-lg px-2 py-1 ml-2"
                    disabled={formData.discount_type !== "Percent"}
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
                    ref={triggerRef}
                    className={`relative min-h-[48px] w-full border rounded-md px-3 py-2 flex flex-wrap items-center gap-2 cursor-pointer transition-colors ${
                      popoverOpen
                        ? "border-orange-400 ring-1 ring-orange-400"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    tabIndex={0}
                    onClick={() => setPopoverOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPopoverOpen(true);
                      }
                    }}
                  >
                    {getSelectedCoursesDisplay.length === 0 ? (
                      <span className="text-gray-400">Select courses</span>
                    ) : (
                      getSelectedCoursesDisplay.map((course) => (
                        <span
                          key={course.id}
                          className="flex items-center px-3 py-1 rounded-full text-sm mr-2 bg-blue-50 border border-blue-200 text-blue-700"
                        >
                          {course.name}
                          <button
                            type="button"
                            className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(course.id);
                            }}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))
                    )}
                    <div className="ml-auto flex-shrink-0">
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                        className={`text-gray-400 transition-transform ${
                          popoverOpen ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          stroke="currentColor"
                          strokeWidth="2"
                          d="M6 9l6 6 6-6"
                        />
                      </svg>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="p-0"
                  style={{ width: triggerWidth }}
                  sideOffset={4}
                >
                  <Command>
                    <CommandInput
                      placeholder="Search courses..."
                      className="border-none"
                    />
                    <CommandList className="max-h-[200px]">
                      {coursesList.map((course) => {
                        const isChecked =
                          formData.course_ids?.includes(course.id) || false;

                        return (
                          <CommandItem
                            key={course.id}
                            className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50"
                            onSelect={() => false} // ป้องกัน default behavior
                          >
                            <div
                              className="flex items-center w-full cursor-pointer"
                              onClick={() => {
                                handleToggleCourse(course.id);
                              }}
                            >
                              <Checkbox
                                checked={isChecked}
                                className="mr-2 pointer-events-none"
                              />
                              <span className="flex-1 select-none">
                                {course.name}
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
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
