import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import React from "react";

type DraftDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onDiscard: () => void;
};

export default function DraftDialog({ open, onOpenChange, onConfirm, onDiscard }: DraftDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Unsaved Drafts</DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-2 text-base text-gray-700">
          You have unsaved drafts. Save before leaving?
        </div>
        <DialogFooter className="flex flex-row gap-2 justify-end">
          <button
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={onDiscard}
          >
            Leave without saving
          </button>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={onConfirm}
          >
            Save and leave
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
