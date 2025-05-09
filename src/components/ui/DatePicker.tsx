import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DatePickerProps {
  isOpen: boolean;
  toggle: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date | null;
}

const DatePicker: React.FC<DatePickerProps> = ({
  isOpen,
  toggle,
  onConfirm,
  initialDate = null,
}) => {
  const today = new Date();
  const [month, setMonth] = useState<number>(initialDate?.getMonth() ?? today.getMonth());
  const [year, setYear] = useState<number>(initialDate?.getFullYear() ?? today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  const handleSubmit = () => {
    if (selectedDate) {
      onConfirm(selectedDate);
      toggle();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white border shadow-lg rounded-xl p-6 w-[340px] z-50"
        >
          <div className="flex justify-between items-center mb-4">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border px-2 py-1 rounded"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border px-2 py-1 w-20 rounded"
            />
          </div>

          <div className="grid grid-cols-7 text-xs text-center text-gray-500 mb-2">
            <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(getFirstDayOfMonth(month, year)).fill(null).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}
            {[...Array(daysInMonth(month, year)).keys()].map((day) => (
              <button
                key={day + 1}
                onClick={() => handleDayClick(day + 1)}
                className={`p-2 rounded-full text-sm hover:bg-blue-100 transition-all ${
                  selectedDate?.getDate() === day + 1 &&
                  selectedDate?.getMonth() === month &&
                  selectedDate?.getFullYear() === year
                    ? "bg-blue-500 text-white"
                    : ""
                }`}
              >
                {day + 1}
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={toggle}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              disabled={!selectedDate}
            >
              Confirm
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DatePicker;
