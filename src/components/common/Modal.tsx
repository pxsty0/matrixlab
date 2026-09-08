import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-4xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xs sm:p-4">
      <div
        className={`w-full rounded-xl bg-white text-zinc-900 shadow-xl ${maxWidthClasses} flex max-h-[85vh] flex-col overflow-hidden border border-zinc-200`}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <h3 id="modal-title" className="text-sm font-semibold text-zinc-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 text-xs text-zinc-700">
          {children}
        </div>
      </div>
    </div>
  );
};
