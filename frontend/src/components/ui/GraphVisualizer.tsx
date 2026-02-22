"use client";

import React, { useEffect, useRef, useState } from 'react';
// 1. Import dynamic from Next.js
import dynamic from 'next/dynamic';

// 2. Dynamically import the graph library and disable Server-Side Rendering (SSR)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { 
  ssr: false,
  // Optional: Add a loading state while the heavy graph library loads
  loading: () => (
    <div className="flex items-center justify-center h-full text-xs text-slate-500 animate-pulse">
      Loading Graph Engine...
    </div>
  )
});

interface GraphVisualizerProps {
  data: {
    nodes: any[];
    links: any[];
  };
  isDark: boolean;
}

export default function GraphVisualizer({ data, isDark }: GraphVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 192 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions(prev => ({ ...prev, width: entry.contentRect.width }));
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.label || node.id;
          const fontSize = 12 / globalScale;
          
          // Draw Node Circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color || (isDark ? '#e2e8f0' : '#475569');
          ctx.fill();

          // Draw Node Text ALWAYS
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
          ctx.fillText(label, node.x, node.y + 7); 
        }}
        linkColor={() => isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)'}
      />
    </div>
  );
}