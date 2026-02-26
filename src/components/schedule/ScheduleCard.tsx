'use client';

import React, { memo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { TIME_MAP, SLOT_HEIGHT, HEADER_HEIGHT, DAYS } from '@/lib/types';

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

// Hash function to get consistent color index for section name
const getSectionColor = (sectionName: string) => {
  let hash = 0;
  for (let i = 0; i < sectionName.length; i++) {
    hash = ((hash << 5) - hash) + sectionName.charCodeAt(i);
    hash = hash & hash;
  }
  return SECTION_GRADIENTS[Math.abs(hash) % SECTION_GRADIENTS.length];
};

interface ScheduleCardProps {
  item: {
    id: string;
    subjectCode: string;
    subjectName: string;
    sectionName: string;
    professorName: string;
    startSlot: number;
    duration: number;
    day: string;
    type: string;
    stackIndex: number;
    totalStack: number;
  };
  dayWidth: number;
  dayIndex: number;
  isHovered: boolean;
  isProfessor?: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
}

const ScheduleCard = memo(function ScheduleCard({
  item,
  dayWidth,
  dayIndex,
  isHovered,
  isProfessor,
  onHover,
  onClick,
}: ScheduleCardProps) {
  const slotH = SLOT_HEIGHT;
  const headerH = HEADER_HEIGHT;
  const padding = 6;

  // Calculate position
  const topPos = headerH + (item.startSlot - 1) * slotH;
  const heightPos = (item.duration + 1) * slotH;
  const cardWidth = dayWidth - (padding * 2);
  const leftPx = dayIndex * dayWidth + padding;

  // Calculate time string with safety check
  const endTimeSlot = item.startSlot + item.duration;
  const startTimeStr = TIME_MAP[item.startSlot] || 'Unknown';
  const endTimeStr = TIME_MAP[endTimeSlot] || `${endTimeSlot > 15 ? 'After 9 PM' : 'Unknown'}`;
  const timeStr = `${startTimeStr} - ${endTimeStr}`;

  const sectionColor = getSectionColor(item.sectionName);

  // Z-index: hovered card on top, otherwise by stack index
  const currentZIndex = isHovered ? 9999 : 100 + item.stackIndex;

  // Hover effects
  const hoverTranslateY = isHovered ? -4 : 0;
  const hoverScale = isHovered ? 1.02 : 1;

  const handleMouseEnter = useCallback(() => onHover(item.id), [item.id, onHover]);
  const handleMouseLeave = useCallback(() => onHover(null), [onHover]);

  return (
    <div
      className={`absolute p-1.5 rounded-lg text-xs cursor-pointer transition-all duration-200 pointer-events-auto select-none contain-layout ${sectionColor.bg} border-l-4 ${sectionColor.border} ${isProfessor ? 'opacity-70' : ''}`}
      style={{
        top: topPos + hoverTranslateY,
        height: heightPos,
        left: leftPx,
        width: cardWidth,
        zIndex: currentZIndex,
        transform: isHovered ? `scale(${hoverScale})` : 'scale(1)',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
    </div>
  );
});

export default ScheduleCard;
