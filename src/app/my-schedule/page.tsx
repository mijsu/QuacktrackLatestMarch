'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ScheduleItem, DAYS, TIME_MAP, SLOT_HEIGHT, HEADER_HEIGHT } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Calendar, Clock, Loader2, Search, Check } from 'lucide-react';
import { formatSemester } from '@/lib/utils';

// Section-based gradient color mapping
const SECTION_GRADIENTS = [
  { bg: 'bg-gradient-to-br from-emerald-100 to-emerald-200', border: 'border-emerald-500', text: 'text-emerald-700', shadow: 'shadow-emerald-500/20' },
  { bg: 'bg-gradient-to-br from-blue-100 to-blue-200', border: 'border-blue-500', text: 'text-blue-700', shadow: 'shadow-blue-500/20' },
  { bg: 'bg-gradient-to-br from-purple-100 to-purple-200', border: 'border-purple-500', text: 'text-purple-700', shadow: 'shadow-purple-500/20' },
  { bg: 'bg-gradient-to-br from-rose-100 to-rose-200', border: 'border-rose-500', text: 'text-rose-700', shadow: 'shadow-rose-500/20' },
  { bg: 'bg-gradient-to-br from-amber-100 to-amber-200', border: 'border-amber-500', text: 'text-amber-700', shadow: 'shadow-amber-500/20' },
  { bg: 'bg-gradient-to-br from-cyan-100 to-cyan-200', border: 'border-cyan-500', text: 'text-cyan-700', shadow: 'shadow-cyan-500/20' },
  { bg: 'bg-gradient-to-br from-orange-100 to-orange-200', border: 'border-orange-500', text: 'text-orange-700', shadow: 'shadow-orange-500/20' },
  { bg: 'bg-gradient-to-br from-teal-100 to-teal-200', border: 'border-teal-500', text: 'text-teal-700', shadow: 'shadow-teal-500/20' },
  { bg: 'bg-gradient-to-br from-violet-100 to-violet-200', border: 'border-violet-500', text: 'text-violet-700', shadow: 'shadow-violet-500/20' },
  { bg: 'bg-gradient-to-br from-fuchsia-100 to-fuchsia-200', border: 'border-fuchsia-500', text: 'text-fuchsia-700', shadow: 'shadow-fuchsia-500/20' },
  { bg: 'bg-gradient-to-br from-lime-100 to-lime-200', border: 'border-lime-500', text: 'text-lime-700', shadow: 'shadow-lime-500/20' },
  { bg: 'bg-gradient-to-br from-sky-100 to-sky-200', border: 'border-sky-500', text: 'text-sky-700', shadow: 'shadow-sky-500/20' },
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

export default function MySchedulePage() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [viewingItem, setViewingItem] = useState<ScheduleItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [settings, setSettings] = useState<{ academicYear: string; currentSemester: number } | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !user) return;
    fetchSettings();
    fetchSchedule();
  }, [mounted, user]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings({
          academicYear: data.settings.academicYear,
          currentSemester: data.settings.currentSemester
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/schedule?type=professor&professorId=${user?.id}`);
      const data = await res.json();
      setSchedule(data.schedule || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (item: ScheduleItem) => {
    setViewingItem(item);
    setDialogOpen(true);
  };

  // Calculate positions for overlapping schedule items - memoized to ensure consistency
  const positionedItems = useMemo(() => {
    if (!schedule || schedule.length === 0) return [];
    
    console.log('My Schedule - Calculating positions for', schedule.length, 'items');
    
    // Create a working copy with proper type conversion and default values
    const items = schedule.map((item) => ({
      ...item,
      startSlot: Number(item.startSlot) || 0,
      duration: Number(item.duration) || 3, // Default to 3 hours
      stackIndex: 0,
      totalStack: 1
    }));

    // Group items by day and time slot for overlap detection
    const itemsByDay: Record<string, typeof items> = {};
    items.forEach((item) => {
      const day = item.day || '';
      if (!itemsByDay[day]) {
        itemsByDay[day] = [];
      }
      itemsByDay[day].push(item);
    });

    // Process each day independently
    Object.entries(itemsByDay).forEach(([day, dayItems]) => {
      if (dayItems.length === 0) return;

      // Sort by start time (earliest first)
      dayItems.sort((a, b) => a.startSlot - b.startSlot);

      // Group items into overlapping clusters
      // Items overlap if their time ranges intersect
      const clusters: typeof items[] = [];
      
      dayItems.forEach((item) => {
        const itemStart = item.startSlot;
        const itemEnd = item.startSlot + item.duration;
        
        // Find which existing clusters this item overlaps with
        const overlappingClusterIndices: number[] = [];
        
        clusters.forEach((cluster, clusterIndex) => {
          const hasOverlap = cluster.some((clusterItem) => {
            const clusterStart = clusterItem.startSlot;
            const clusterEnd = clusterItem.startSlot + clusterItem.duration;
            // Two time ranges overlap if one starts before the other ends
            return itemStart < clusterEnd && itemEnd > clusterStart;
          });
          
          if (hasOverlap) {
            overlappingClusterIndices.push(clusterIndex);
          }
        });
        
        if (overlappingClusterIndices.length === 0) {
          // No overlap with any existing cluster - create new cluster
          clusters.push([item]);
        } else {
          // Merge all overlapping clusters with this item
          const mergedCluster = [item];
          // Remove clusters in reverse order to maintain correct indices
          overlappingClusterIndices.sort((a, b) => b - a).forEach((idx) => {
            mergedCluster.push(...clusters[idx]);
            clusters.splice(idx, 1);
          });
          clusters.push(mergedCluster);
        }
      });

      // Assign stackIndex and totalStack within each cluster
      clusters.forEach((cluster) => {
        // Sort cluster by start time for consistent ordering
        cluster.sort((a, b) => a.startSlot - b.startSlot);
        
        const totalInCluster = cluster.length;
        
        // Each item in the cluster gets its position
        cluster.forEach((item, index) => {
          // Directly update the item (it's a reference to the item in items array)
          item.stackIndex = index;
          item.totalStack = totalInCluster;
        });
      });
    });

    console.log('My Schedule - Positioned items:', items.filter(i => i.totalStack > 1).length, 'items have overlaps');
    
    return items;
  }, [schedule]);

  // Filter positioned items by search query
  const visibleItems = useMemo(() => {
    if (!searchQuery) return positionedItems;
    return positionedItems.filter((item) =>
      item.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sectionName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [positionedItems, searchQuery]);

  // Don't render until mounted on client
  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6">
          <div className="h-[400px] sm:h-[565px] bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Fixed Mobile Header with Filters and Date/Time */}
      <div className="fixed top-[64px] left-0 right-0 lg:hidden z-[99] bg-white/95 backdrop-blur-xl border-b border-emerald-200/50 shadow-sm px-2 sm:px-3 py-2">
        <div className="flex flex-row justify-between items-center gap-1.5">
          <div className="relative flex-1 max-w-[100px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-[10px] bg-white/60 backdrop-blur-md border border-emerald-200/50 focus:border-emerald-400 w-full"
            />
          </div>

          {mounted && (
            <div className="flex flex-col items-end gap-1">
              {/* Semester Info - Separate Container */}
              <div className="bg-white/60 backdrop-blur-md border-emerald-200/50 rounded-lg px-2 py-1 shadow-sm">
                <div className="text-[11px] font-semibold text-emerald-700 leading-tight">
                  SY {settings?.academicYear || '2024-2025'} - {settings?.currentSemester ? formatSemester(settings.currentSemester) : formatSemester(1)}
                </div>
              </div>
              {/* Date and Time - Separate Container */}
              <div className="flex flex-row items-center gap-1.5 bg-white/60 backdrop-blur-md border-emerald-200/50 rounded-lg px-2 py-0.5 shadow-sm">
                <div className="flex items-center gap-0.5 text-emerald-700">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[10px] font-medium">
                    {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="w-px h-3.5 bg-emerald-200 rounded-full"></div>
                <div className="flex items-center gap-0.5 text-emerald-700">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[10px] font-medium">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 pt-4 lg:pt-6 lg:pt-8 mt-[72px] lg:mt-0">
        {/* Desktop Only Sticky Header */}
        <div className="hidden lg:block sticky top-0 z-30 bg-white/80 backdrop-blur-xl -mx-8 px-8 py-3 mb-4 border-b border-emerald-200/50 shadow-sm">
          <div className="flex flex-row justify-between items-center gap-3">
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-600">
                My Teaching Schedule
              </span>
            </div>

            <div className="flex items-center gap-3 flex-1 justify-center">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search schedule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8 text-sm bg-white/60 backdrop-blur-md border-emerald-200/50 focus:border-emerald-400 w-full"
                />
              </div>
            </div>

            {mounted && (
              <div className="flex flex-col items-end gap-2">
                {/* Semester Info - Separate Container */}
                <div className="bg-white/60 backdrop-blur-md border-emerald-200/50 rounded-lg px-3 py-1 shadow-sm">
                  <div className="text-xs font-semibold text-emerald-700 leading-tight">
                    SY {settings?.academicYear || '2024-2025'} - {settings?.currentSemester ? formatSemester(settings.currentSemester) : formatSemester(1)}
                  </div>
                  </div>
                  {/* Date and Time - Separate Container */}
                  <div className="flex flex-row items-center gap-2 bg-white/60 backdrop-blur-md border-emerald-200/50 rounded-lg px-3 py-0.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium">
                        {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-emerald-200 rounded-full"></div>
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium">
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="flex gap-0 -mx-4 sm:mx-0">
          {/* Fixed Time Column */}
          <div
            className="flex flex-col bg-white border border-slate-200 rounded-l-xl"
            style={{ width: '60px', height: `calc(${HEADER_HEIGHT}px + (15 * ${SLOT_HEIGHT}px))` }}
          >
            {/* Time Header */}
            <div
              className="bg-slate-50 border-b border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
              style={{ height: `${HEADER_HEIGHT}px` }}
            >
              Time
            </div>
            {/* Time Labels */}
            {Array.from({ length: 15 }, (_, i) => i + 1).map((hour) => (
              <div
                key={hour}
                className="bg-white border-b border-dashed border-slate-100 flex items-center justify-center text-xs text-slate-400 font-medium"
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                {TIME_MAP[hour]}
              </div>
            ))}
          </div>

          {/* Scrollable Days Grid */}
          <div className="flex-1 overflow-x-auto px-4 sm:px-0">
            <div
              ref={containerRef}
              className="bg-white border-r border-t border-b border-slate-200 rounded-r-xl relative overflow-hidden"
              style={{
                height: `calc(${HEADER_HEIGHT}px + (15 * ${SLOT_HEIGHT}px))`,
                minWidth: `${(60 * 5) + 800}px`,
              }}
            >
              {/* Background Grid for Days */}
              <div
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `repeat(${DAYS.length}, 1fr)`,
                  gridTemplateRows: `${HEADER_HEIGHT}px repeat(15, ${SLOT_HEIGHT}px)`,
                  minWidth: `${60 * DAYS.length}px`,
                }}
              >
                {/* Day Headers */}
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="bg-slate-50 border-b border-slate-200 border-r border-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {day}
                  </div>
                ))}

                {/* Day Cells */}
                {Array.from({ length: 15 }, (_, i) => i + 1).map((hour) => (
                  <React.Fragment key={hour}>
                    {DAYS.map((day) => (
                      <div
                        key={`${day}-${hour}`}
                        className="bg-white border-r border-slate-100 border-b border-dashed border-slate-100"
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>

              {/* Events Layer */}
              <div className="absolute inset-0 pointer-events-none z-30" style={{ minWidth: '60px' }}>
                {visibleItems.length === 0 && !loading && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                      <p className="text-sm text-slate-600 mb-2">No schedule items found</p>
                      <p className="text-xs text-slate-500">
                        Contact administrator for schedule assignment
                      </p>
                    </div>
                  </div>
                )}
                
                {visibleItems.map((item) => {
                  const containerWidth = containerRef.current?.offsetWidth || 800;
                  const dayWidth = containerWidth / DAYS.length;
                  const dayIndex = DAYS.indexOf(item.day);

                  // Calculate base position
                  const topPos = HEADER_HEIGHT + (item.startSlot - 1) * SLOT_HEIGHT;
                  // Height: (duration + 1) * SLOT_HEIGHT to make card visually extend to end time row
                  const heightPos = (item.duration + 1) * SLOT_HEIGHT;
                  
                  // Layered card stacking - cards stack directly on top of each other
                  const totalInStack = item.totalStack || 1;
                  const stackIndex = item.stackIndex || 0;
                  const padding = 6;

                  // Card width - full width, all cards in stack have same width and position
                  const cardWidth = dayWidth - (padding * 2);
                  const leftPx = dayIndex * dayWidth + padding;

                  // Calculate end time with safety check
                  const endTimeSlot = item.startSlot + item.duration;
                  const startTimeStr = TIME_MAP[item.startSlot] || 'Unknown';
                  const endTimeStr = TIME_MAP[endTimeSlot] || `${endTimeSlot > 15 ? 'After 9 PM' : 'Unknown'}`;
                  const timeStr = `${startTimeStr} - ${endTimeStr}`;

                  const sectionColor = getSectionColor(item.sectionName);
                  const isHovered = hoveredCardId === item.id;

                  const currentZIndex = isHovered ? 9999 : 100 + stackIndex;
                  
                  // Hover effects
                  const hoverTranslateY = isHovered ? -4 : 0;
                  const hoverScale = isHovered ? 1.02 : 1;

                  return (
                    <div
                      key={item.id}
                      className={`absolute p-1.5 rounded-lg text-xs cursor-pointer transition-all duration-200 pointer-events-auto select-none ${sectionColor.bg} border-l-4 ${sectionColor.border}`}
                      style={{
                        top: `${topPos + hoverTranslateY}px`,
                        height: `${heightPos}px`,
                        left: `${leftPx}px`,
                        width: `${cardWidth}px`,
                        zIndex: currentZIndex,
                        transform: isHovered ? `scale(${hoverScale})` : 'scale(1)',
                      }}
                      onMouseEnter={() => setHoveredCardId(item.id)}
                      onMouseLeave={() => setHoveredCardId(null)}
                      onClick={() => openViewModal(item)}
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
                        <span>{timeStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
                    <p className="text-sm text-slate-600 mt-2">Loading schedule...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Details Dialog */}
      {viewingItem && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl max-w-md overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 -mx-6 -mt-6 px-6 py-5 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">Schedule Details</DialogTitle>
                  <DialogDescription className="text-emerald-100 text-sm mt-0.5">
                    View complete schedule information
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Subject Info Card */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/50 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${viewingItem.type === 'lecture' ? 'bg-indigo-100' : 'bg-pink-100'}`}>
                  <span className={`text-xl font-bold ${viewingItem.type === 'lecture' ? 'text-indigo-600' : 'text-pink-600'}`}>
                    {viewingItem.subjectCode.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={viewingItem.type === 'lecture' ? 'default' : 'secondary'}
                      className={viewingItem.type === 'lecture' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pink-600 hover:bg-pink-700'}
                    >
                      {viewingItem.type === 'lecture' ? 'Lecture' : 'Lab'}
                    </Badge>
                  </div>
                  <div className="font-bold text-slate-900">{viewingItem.subjectCode}</div>
                  <div className="text-sm text-slate-600">{viewingItem.subjectName}</div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Day */}
              <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Day</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{viewingItem.day}</p>
              </div>

              {/* Time */}
              <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {TIME_MAP[viewingItem.startSlot]} - {TIME_MAP[viewingItem.startSlot + viewingItem.duration]}
                </p>
              </div>

              {/* Duration */}
              <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {viewingItem.duration} hour{viewingItem.duration > 1 ? 's' : ''}
                </p>
              </div>

              {/* Section */}
              <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Section</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{viewingItem.sectionName}</p>
              </div>
            </div>

            {/* Additional Hours Info */}
            {viewingItem.type === 'combined' && (viewingItem.lectureHours || viewingItem.labHours) && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="font-semibold text-sm text-slate-900 mb-3">Weekly Hours</h4>
                <div className="grid grid-cols-2 gap-3">
                  {viewingItem.lectureHours !== undefined && (
                    <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                      <span className="text-xs text-indigo-600 font-medium">Lecture</span>
                      <p className="text-lg font-bold text-indigo-700">{viewingItem.lectureHours}h</p>
                    </div>
                  )}
                  {viewingItem.labHours !== undefined && (
                    <div className="bg-pink-50 rounded-lg p-3 border border-pink-100">
                      <span className="text-xs text-pink-600 font-medium">Lab</span>
                      <p className="text-lg font-bold text-pink-700">{viewingItem.labHours}h</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <DialogFooter className="mt-6 pt-4 border-t border-slate-100">
              <Button
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                  setViewingItem(null);
                }}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
