import React from "react";
import { ButtonT } from "@/components/ui/ButtonT";
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
import {
  ALL_COURSES_ID,
  DISCOUNT_TYPE_FIXED,
  DISCOUNT_TYPE_PERCENT,
  PromoCodeFormData,
  Course,
} from "@/types/promoCode";
import LoadingSpinner from "../components/LoadingSpinner";
import { IoIosArrowBack } from "react-icons/io";

interface PromoCodeFormViewProps {
  formData: PromoCodeFormData;
  isLoading: boolean;
  errors?: Record<string, string>;
  coursesList: Course[];
  popoverOpen: boolean;
  triggerRef: React.RefObject<HTMLDivElement>;
  triggerWidth: number;
  getSelectedCoursesDisplay: Course[];
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleDiscountTypeChange: (type: string) => void;
  handleCancel: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  setPopoverOpen: (open: boolean) => void;
  handleCoursesBlur: () => void;
  handleToggleCourse: (courseId: string) => void;
  handleRemoveTag: (id: string) => void;
  handlePercentBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleFixedBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  isCreateDisabled?: boolean;
  isLoadingCourses?: boolean;
  mode?: "create" | "edit";
  onDeletePromoCode?: () => void;
}

const PromoCodeFormView: React.FC<PromoCodeFormViewProps> = ({
  formData,
  isLoading,
  errors = {},
  coursesList,
  popoverOpen,
  triggerRef,
  triggerWidth,
  getSelectedCoursesDisplay,
  handleInputChange,
  handleDiscountTypeChange,
  handleCancel,
  handleSubmit,
  setPopoverOpen,
  handleCoursesBlur,
  handleToggleCourse,
  handleRemoveTag,
  handlePercentBlur,
  handleFixedBlur,
  isCreateDisabled = false,
  isLoadingCourses = false,
  mode = "create",
  onDeletePromoCode,
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-8 bg-white px-8 py-6 border-b-3 border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="cursor-pointer"
            onClick={handleCancel}
          >
            <IoIosArrowBack className="h-7 w-7 text-gray-600" />
          </button>
          <h1 className="text-3xl font-semibold flex items-center">
            {mode === "edit" ? (
              <>
                <span className="text-gray-400 font-normal mr-2">
                  Promo code
                </span>
                <span className="text-gray-800 font-semibold">
                  {formData.code || ""}
                </span>
              </>
            ) : (
              "Add Promo code"
            )}
          </h1>
        </div>
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
            disabled={isCreateDisabled}
            onClick={handleSubmit}
          >
            {isLoading
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
              ? "Save"
              : "Create"}
          </ButtonT>
        </div>
      </div>
      {isLoadingCourses ? (
        <LoadingSpinner text="Loading courses..." size="md" />
      ) : (
        <div className="bg-geay-50 flex-1 h-screen">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="px-24 py-14 mx-10 border-b-3 rounded-2xl bg-white">
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
                    className={`w-full px-4 py-2 border rounded-md ${
                      errors.code ? "border-red-500" : ""
                    }`}
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.code && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors.code}
                    </div>
                  )}
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
                    className={`w-full px-4 py-2 border rounded-md ${
                      errors.min_purchase_amount ? "border-red-500" : ""
                    }`}
                    value={formData.min_purchase_amount}
                    onChange={handleInputChange}
                    min={0}
                    required
                  />
                  {errors.min_purchase_amount && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors.min_purchase_amount}
                    </div>
                  )}
                </div>
              </div>

              {/* Discount type */}
              <div className="mt-8">
                <label className="block text-sm font-medium mb-2">
                  Select discount type <span className="text-red-500">*</span>
                </label>
                {errors.discount_type && (
                  <div className="text-red-500 text-xs mb-2">
                    {errors.discount_type}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fixed amount */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="discount_type"
                      checked={formData.discount_type === DISCOUNT_TYPE_FIXED}
                      onChange={() =>
                        handleDiscountTypeChange(DISCOUNT_TYPE_FIXED)
                      }
                      className="accent-blue-600 cursor-pointer"
                    />
                    <span>Fixed amount (THB)</span>
                    <input
                      type="number"
                      name="discount_value"
                      placeholder="THB"
                      value={
                        formData.discount_type === DISCOUNT_TYPE_FIXED
                          ? formData.discount_value
                          : ""
                      }
                      onChange={handleInputChange}
                      onBlur={handleFixedBlur}
                      className={`w-24 border border-gray-300 rounded-lg px-2 py-1 ml-2 ${
                        formData.discount_type === DISCOUNT_TYPE_FIXED
                          ? "border-gray-300"
                          : ""
                      }`}
                      disabled={formData.discount_type !== DISCOUNT_TYPE_FIXED}
                      min={0}
                      max={formData.min_purchase_amount}
                    />
                  </label>
                  {/* Percent */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="discount_type"
                      checked={formData.discount_type === DISCOUNT_TYPE_PERCENT}
                      onChange={() =>
                        handleDiscountTypeChange(DISCOUNT_TYPE_PERCENT)
                      }
                      className="accent-blue-600 cursor-pointer"
                    />
                    <span>Percent (%)</span>
                    <input
                      type="number"
                      name="discount_value"
                      placeholder="Percent"
                      value={
                        formData.discount_type === DISCOUNT_TYPE_PERCENT
                          ? formData.discount_value
                          : ""
                      }
                      onChange={handleInputChange}
                      onBlur={handlePercentBlur}
                      className={`w-24 border border-gray-300 rounded-lg px-2 py-1 ml-2 ${
                        formData.discount_type === DISCOUNT_TYPE_PERCENT
                          ? "border-gray-300"
                          : ""
                      }`}
                      disabled={
                        formData.discount_type !== DISCOUNT_TYPE_PERCENT
                      }
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
                {coursesList.length <= 1 ? (
                  <div className="text-gray-400 py-2">No courses available</div>
                ) : (
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
                        onBlur={handleCoursesBlur}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setPopoverOpen(true);
                          }
                        }}
                      >
                        {formData.course_ids.length === 1 &&
                        formData.course_ids[0] === ALL_COURSES_ID ? (
                          <span className="">All courses</span>
                        ) : (
                          getSelectedCoursesDisplay.map((course) => (
                            <span
                              key={course.id}
                              className="flex items-center px-3 py-1 rounded-md text-sm mr-2 bg-[#E5ECF8] border border-[#8DADE0] font-semibold"
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
                                <X
                                  size={14}
                                  className="text-[#2F5FAC] cursor-pointer"
                                />
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
                            const isInvalid =
                              formData.discount_type === DISCOUNT_TYPE_FIXED &&
                              isChecked &&
                              course.id !== ALL_COURSES_ID &&
                              Number(course.price) <
                                Number(formData.discount_value);

                            return (
                              <CommandItem
                                key={course.id}
                                value={course.id}
                                className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                                  isInvalid
                                    ? "border border-red-500 bg-red-50"
                                    : ""
                                }`}
                                onSelect={() => false}
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
                                  <span className="ml-2 text-xs text-gray-500">
                                    {course.price}
                                  </span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </form>
          {mode === "edit" && onDeletePromoCode && (
            <div className="flex justify-end mt-6 mr-10">
              <button
                type="button"
                className="text-[#2F5FAC] text-[16px] font-bold hover:text-blue-500"
                onClick={onDeletePromoCode}
              >
                Delete Promo code
              </button>
            </div>
          )}
          {errors.discount_value && (
            <div className="mx-20 mt-6">
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">
                {errors.discount_value}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PromoCodeFormView;
