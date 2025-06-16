"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ComboboxSelectProps {
  items: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ComboboxSelect({
  items,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
}: ComboboxSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedItem = items.find((item) => item.id === value);

  // 🔁 Clear search เมื่อ dropdown ปิด
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  const filteredItems = items
    .filter((item) =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-[16px] font-normal",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {selectedItem?.label ?? placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="min-w-[var(--radix-popover-trigger-width)]  p-0"
        align="start"
        sideOffset={4}
      >
        <Command>
        {/* Sticky Search Input */}
          <div className="sticky top-0 z-10 bg-white">
            <CommandInput
                placeholder="Search..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="h-9"
            />
          </div>

          <CommandEmpty>No result found.</CommandEmpty>
          <CommandGroup  className="max-h-[300px] overflow-auto">
            {filteredItems.map((item) => (
              <CommandItem
                key={item.id}
                value={item.label}
                onSelect={(val) => {
                  const selected = items.find((i) => i.label === val);
                  if (selected) {
                    onChange(selected.id);
                    setOpen(false);
                  }
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
