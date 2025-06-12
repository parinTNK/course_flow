import React from "react";

export interface TabItem {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, value, onChange }) => (
  <div className="flex items-center justify-center gap-6">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        className={`pb-2 font-semibold border-b-2 cursor-pointer ${
          value === tab.value
            ? "border-black"
            : "border-transparent text-gray-400"
        }`}
        onClick={() => onChange(tab.value)}
        type="button"
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default Tabs;
