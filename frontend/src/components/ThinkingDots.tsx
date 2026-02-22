// components/ThinkingDots.tsx
// This component displays animated dots to indicate that the assistant is thinking or processing.

import React from "react";

export const ThinkingDots = () => {
  // Array of dots for animation
  const dots = ["●", "●", "●"];
  // State for active dot index
  const [activeIndex, setActiveIndex] = React.useState(0);

  // Effect to cycle through dots every 500ms
  React.useEffect(() => {
    const interval = setInterval(() => setActiveIndex((prev) => (prev + 1) % dots.length), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1">
      {dots.map((dot, idx) => (
        <span key={idx} className={`transition-all ${idx === activeIndex ? "opacity-100 scale-100" : "opacity-40 scale-75"}`}>
          {dot}
        </span>
      ))}
    </div>
  );
};