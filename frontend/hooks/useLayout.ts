// hooks/useLayout.ts
// This custom hook manages the layout state for the dashboard, including pane visibility and resizing.
// It handles the left sidebar, right context pane, dark mode, and right pane width.

import { useState, useRef, useEffect } from "react";

export function useLayout() {
  // State for pane visibility
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [rightWidth, setRightWidth] = useState(320);
  const isDraggingRight = useRef(false);

  // Effect to apply dark mode to the document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Effect for handling right pane resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRight.current) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 250 && newWidth <= 600) setRightWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isDraggingRight.current) {
        isDraggingRight.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Handler for starting right pane drag
  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRight.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return {
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
    isDark,
    setIsDark,
    rightWidth,
    handleMouseDownRight,
  };
}