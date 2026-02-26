'use client';

import React, { useState, useEffect, memo } from 'react';
import { ScheduleItem, DAYS, TIME_MAP, SLOT_HEIGHT, HEADER_HEIGHT } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';

// Section-based gradient color mapping
const SECTION_GRADIENTS = [
  { bg: 'bg-gradient-to-br from-emerald-100 to-emerald-200', border: 'border-emerald-500', text: 'text-emerald-700' },
  { bg: 'bg-gradient-to-br from-blue-100 to-blue-200', border: 'border-blue-500', text: 'text-blue-700' },
  { bg: 'bg-gradient-to-br from-purple-100 to-purple-200', border: 'border-purple-500', text: 'text-purple-700' },
  { bg: 'bg-gradient-to-br from-rose-100 to-rose-200', border: 'border-rose-500', text: 'text-rose-700' },
  { bg: 'bg-gradient-to-br from-amber-100 to-amber-200', border: 'border-amber-500', text: 'text-amber-700' },
  { bg: 'bg-gradient-to-br from-cyan-100 to-cyan-200', border: 'border-cyan-500', text: 'text-cyan-700' },
  { bg: 'bg-gradient-to-br from-orange-100 to-orange-200', border: 'border-orange-500', text: 'text-orange-700' },
  { bg: 'bg-gradient-to-br from-teal-100 to-teal-200', border: 'border-teal-500', text: 'text-teal-700' },
  { bg: 'bg-gradient-to-br from-violet-100 to-violet-200', border: 'border-violet-500', text: 'text-violet-700' },
  { bg: 'bg-gradient-to-br from-fuchsia-100 to-fuchsia-200', border: 'border-fuchsia-500', text: 'text-fuchsia-700' },
  { bg: 'bg-gradient-to-br from-lime-100 to-lime-200', border: 'border-lime-500', text: 'text-lime-700' },
  { bg: 'bg-gradient-to-br from-sky-100 to-sky-200', border: 'border-sky-500', text: 'text-sky-700' },
];

// Hash function to get consistent color index
const getSectionColor = (sectionName: string) => {
  let hash = 0;
  for (let i = 0; i < sectionName.length; i++) {
    hash = ((hash << 5) - hash) + sectionName.charCodeAt(i);
    hash = hash & hash;
  }
  return SECTION_GRADIENTS[Math.abs(hash) % SECTION_GRADIENTS.length];
};

// Memoized individual schedule card - only re-renders when its specific props change
const ScheduleCard = memo(function ScheduleCard({
  item,
  dayWidth,
  headerH,
  slotH,
  isHovered,
  onHover,
  onClick,
  userRole,
}: {
  item: ScheduleItem & { stackIndex: number; totalStack: number };
  dayWidth: number;
  headerH: number;
  slotH: number;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
  userRole?: string;
}) {
  const dayIndex = DAYS.indexOf(item.day);
  if (dayIndex === -1) return null;

  // Pre-calculate positions
  const topPos = headerH + (item.startSlot - 1) * slotH;
  const heightPos = (item.duration + 1) * slotH;
  const padding = 6;
  const cardWidth = dayWidth - (padding * 2);
  const leftPx = dayIndex * dayWidth + padding;

  // Time string with safety check
  const endTimeSlot = item.startSlot + item.duration;
  const startTimeStr = TIME_MAP[item.startSlot] || 'Unknown';
  const endTimeStr = TIME_MAP[endTimeSlot] || `${endTimeSlot > 15 ? 'After 9 PM' : 'Unknown'}`;
  const timeStr = `${startTimeStr} - ${endTimeStr}`;

  const sectionColor = getSectionColor(item.sectionName);
  const currentZIndex = isHovered ? 9999 : 100 + (item.stackIndex || 0);
  const hoverTranslateY = isHovered ? -4 : 0;
  const hoverScale = isHovered ? 1.02 : 1;

  return (
    <div
      className={`absolute p-1.5 rounded-lg text-xs cursor-pointer transition-all duration-200 pointer-events-auto select-none ${sectionColor.bg} border-l-4 ${sectionColor.border} ${userRole === 'professor' ? 'opacity-70' : ''}`}
      style={{
        top: `${topPos + hoverTranslateY}px`,
        height: `${heightPos}px`,
        left: `${leftPx}px`,
        width: `${cardWidth}px`,
        zIndex: currentZIndex,
        transform: isHovered ? `scale(${hoverScale})` : 'scale(1)',
      }}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-0.5">
        <span className={`font-bold ${sectionColor.text} text-[0.75rem] truncate leading-tight`}>
          {item.subjectCode} - {item.subjectName}
        </span>
        <Badge variant="outline" className={`text-[0.55rem] py-0 px-1 h-4 border-current ${sectionColor.text} bg-white/50`}>
          {item.type === 'lecture' ? 'LEC' : 'LAB'}
        </Badge>
      </div>
      <div className="flex flex-col gap-0 text-[0.65rem] text-slate-600 leading-tight">
        <span className="font-medium">{item.sectionName}</span>
        <span>{item.professorName}</span>
        <span>{timeStr}</span>
      </div>
      {userRole === 'professor' && (
        <Badge variant="secondary" className="mt-0.5 text-[0.55rem] py-0 px-1 h-4">
          <Lock className="w-2 h-2 mr-0.5" />
          Locked
        </Badge>
      )}
    </div>
  );
});

interface VirtualizedScheduleGridProps {
  schedule: ScheduleItem[];
  containerRef: React.RefObject<HTMLDivElement>;
  hoveredCardId: string | null;
  setHoveredCardId: (id: string | null) => void;
  openEditModal: (item: ScheduleItem) => void;
  userRole?: string;
}

export function VirtualizedScheduleGrid({
  schedule,
  containerRef,
  hoveredCardId,
  setHoveredCardId,
  openEditModal,
  userRole,
}: VirtualizedScheduleGridProps) {
  // Use state for dimensions to avoid accessing ref during render
  const [dayWidth, setDayWidth] = useState(133); // Default: 800 / 6 days

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setDayWidth(containerWidth / DAYS.length);
      }
    };

    // Initial update
    updateDimensions();

    // Update on resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [containerRef]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30" style={{ minWidth: '60px' }}>
      {schedule.map((item) => (
        <ScheduleCard
          key={item.id}
          item={item as ScheduleItem & { stackIndex: number; totalStack: number }}
          dayWidth={dayWidth}
          headerH={HEADER_HEIGHT}
          slotH={SLOT_HEIGHT}
          isHovered={hoveredCardId === item.id}
          onHover={setHoveredCardId}
          onClick={() => openEditModal(item)}
          userRole={userRole}
        />
      ))}
    </div>
  );
}
