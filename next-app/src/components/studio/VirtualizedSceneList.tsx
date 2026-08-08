import React, { useRef, useState, useEffect, ReactNode } from 'react';

interface Section {
  id: string;
  // other fields are not needed for virtualization
}

interface VirtualizedSceneListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Estimated height of each item (px). Adjust if UI changes. */
  itemHeight?: number;
}

/**
 * Simple virtualized list implementation without external dependencies.
 * Renders only the items that are visible in the scroll viewport plus a small buffer.
 * Used in StoryboardPanel to efficiently handle 50‑100 scene cards.
 */
export default function VirtualizedSceneList<T>({
  items,
  renderItem,
  itemHeight = 800,
}: VirtualizedSceneListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Update container height on mount / resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerHeight(el.clientHeight);
    const handleResize = () => setContainerHeight(el.clientHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onScroll = () => {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  };

  const startIdx = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // buffer
  const endIdx = Math.min(items.length, startIdx + visibleCount);

  const offsetY = startIdx * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="relative overflow-auto h-full"
      style={{ height: '100%' }}
    >
      {/* Spacer to give the list its full scroll height */}
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {items.slice(startIdx, endIdx).map((item, i) => (
        <React.Fragment key={startIdx + i}>
          {renderItem(item, startIdx + i)}
        </React.Fragment>
      ))}
        </div>
      </div>
    </div>
  );
}
