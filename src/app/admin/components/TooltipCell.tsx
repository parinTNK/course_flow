"use client";

import React, { useRef, useEffect, useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface TooltipCellProps {
  text: string | null | undefined;
  maxWidth?: string; 
  defaultText?: string;
  className?: string;
}

const TooltipCell: React.FC<TooltipCellProps> = ({
  text,
  maxWidth = "max-w-[200px]",
  defaultText = "-",
  className = "",
}) => {
  const ref = useRef<HTMLTableCellElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const displayText = text || defaultText;

  useEffect(() => {
    const el = ref.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [text]);

  const cell = (
    <td
      ref={ref}
      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 truncate ${maxWidth} ${className} cursor-default`}
    >
      {displayText}
    </td>
  );

  return isTruncated ? (
    <Tooltip>
      <TooltipTrigger asChild>{cell}</TooltipTrigger>
      <TooltipContent>{displayText}</TooltipContent>
    </Tooltip>
  ) : (
    cell
  );
};

export default TooltipCell;
