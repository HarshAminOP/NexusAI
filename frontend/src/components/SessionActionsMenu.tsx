// components/SessionActionsMenu.tsx
// Dropdown menu for session actions (rename, delete) with vertical dots icon
// Rebuilt from scratch with portal rendering to avoid clipping issues

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";

interface SessionActionsMenuProps {
  onRename: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  isDark: boolean;
}

export const SessionActionsMenu: React.FC<SessionActionsMenuProps> = ({
  onRename,
  onDelete,
  isDark,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position the dropdown above the button
      setPosition({
        top: rect.top - 10, // 10px above the button
        left: rect.left - 120 + rect.width, // Align right edge of dropdown with right edge of button
      });
    }

    setIsOpen(!isOpen);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className={`p-1 rounded transition-colors ${
          isDark
            ? "hover:bg-slate-700 text-slate-400 hover:text-white"
            : "hover:bg-slate-300 text-slate-500 hover:text-black"
        }`}
        title="Session options"
      >
        <MoreVertical className="h-3 w-3" />
      </button>

      {isOpen && createPortal(
        <div
          className="fixed z-[9999] w-32"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <div className={`${
            isDark
              ? "bg-slate-800 border-slate-700 text-slate-300"
              : "bg-white border-slate-200 text-slate-700"
          } border rounded-lg shadow-xl py-1`}>
            <button
              onClick={(e) => handleAction(() => onRename(e))}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                isDark
                  ? "hover:bg-slate-700 hover:text-white"
                  : "hover:bg-slate-100 hover:text-black"
              }`}
            >
              <Edit2 className="h-3 w-3" />
              Rename
            </button>
            <button
              onClick={(e) => handleAction(() => onDelete(e))}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                isDark
                  ? "text-red-400 hover:bg-red-900/50 hover:text-red-300"
                  : "text-red-600 hover:bg-red-100 hover:text-red-700"
              }`}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};