"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type DropdownOption = {
  label: string
  value: string
}

type DropdownSelectProps = {
  options?: DropdownOption[]
  placeholder?: string
  className?: string
  onValueChange?: (value: string) => void
  value?: string
}

export default function DropdownSelect({
  options = [],
  placeholder = "Select an option",
  className = "",
  onValueChange,
  value,
}: DropdownSelectProps) {
  return (
    <Select onValueChange={onValueChange} value={value}>
      <SelectTrigger className={`w-[27.875rem] box-shadow-1 focus:ring-0 ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={`w-[27.875rem] box-shadow-1 focus:ring-0 ${className}`}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

// // Demo usage
// export function DemoDropdownPage() {
//   const fruitOptions: DropdownOption[] = [
//     { label: "Apple", value: "apple" },
//     { label: "Banana", value: "banana" },
//     { label: "Mango", value: "mango" },
//     { label: "Grape", value: "grape" },
//   ]

//   const [selected, setSelected] = React.useState("")

//   return (
//     <div className="min-h-screen p-10 space-y-6 bg-gray-100">
//       <h1 className="text-xl font-bold">Custom Dropdown Preview</h1>

//       <DropdownSelect
//         options={fruitOptions}
//         placeholder="Select a fruit"
//         value={selected}
//         onValueChange={(val) => setSelected(val)}
//       />

//       <p className="text-gray-700 text-sm">Selected: {selected || "None"}</p>
//     </div>
//   )
// }
