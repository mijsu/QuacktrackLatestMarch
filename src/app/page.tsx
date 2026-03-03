'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ScheduleItem, DAYS, TIME_MAP, SLOT_HEIGHT, HEADER_HEIGHT, ScheduleFilter } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Lock, Check, AlertCircle, Sparkles, Filter, Calendar, Clock, AlertTriangle, Search, BarChart3, Grid3X3, Zap } from 'lucide-react';
import { formatSemester, formatYear } from '@/lib/utils';
import { StatisticsDashboard } from '@/components/schedule/StatisticsDashboard';
import { VirtualizedScheduleGrid } from '@/components/schedule/VirtualizedScheduleGrid';

// Section-based gradient color mapping - stable reference
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

// Performance threshold for showing statistics view by default
const PERFORMANCE_THRESHOLD = 500;

// View modes for the dashboard
type ViewMode = 'grid' | 'statistics';

export default function SchedulePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<ScheduleFilter>('master');
  const [filterValue, setFilterValue] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [settings, setSettings] = useState<{ academicYear: string; currentSemester: number } | null>(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  
  // Performance optimization: view mode and counts
  const [viewMode, setViewMode] = useState<ViewMode>('statistics');
  const [totalProfessors, setTotalProfessors] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [showPerformanceWarning, setShowPerformanceWarning] = useState(false);

  // Debounced search query for better performance
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect professors away from admin dashboard
  useEffect(() => {
    if (mounted && user && user.role === 'professor') {
      router.push('/my-schedule');
    }
  }, [mounted, user, router]);

  // Filter options
  const [filterOptions, setFilterOptions] = useState<{
    sections: { id: string; name: string }[];
    professors: { id: string; name: string }[];
    years: number[];
  }>({
    sections: [],
    professors: [],
    years: [],
  });

  // Form state
  const [formData, setFormData] = useState({
    day: '',
    startSlot: 0,
    duration: 1,
    professorId: '',
  });
  const [validation, setValidation] = useState({ valid: false, message: '' });

  const containerRef = useRef<HTMLDivElement>(null);

  // Update time every second
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Fetch schedule, filter options, and settings on mount
  useEffect(() => {
    if (mounted && user) {
      fetchSchedule();
      fetchFilterOptions();
      fetchSettings();
    }
  }, [user, mounted, filterType, filterValue]);

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

  const fetchFilterOptions = async () => {
    try {
      // Fetch sections
      const sectionsRes = await fetch('/api/programs');
      const sectionsData = await sectionsRes.json();
      
      // Fetch professors
      const profRes = await fetch('/api/professors');
      const profData = await profRes.json();

      // Fetch subjects count
      const subjectsRes = await fetch('/api/subjects');
      const subjectsData = await subjectsRes.json();

      // Get unique years from sections
      const uniqueYears = [...new Set(sectionsData.sections?.map((s: any) => s.year) || [])].sort((a, b) => a - b);

      // Store total counts for statistics
      setTotalProfessors(profData.professors?.length || 0);
      setTotalSections(sectionsData.sections?.length || 0);
      setTotalSubjects(subjectsData.subjects?.length || 0);

      setFilterOptions({
        sections: sectionsData.sections?.map((s: any) => ({ id: s.id, name: s.sectionName })) || [],
        professors: profData.professors?.map((p: any) => ({ id: p.id, name: p.name })) || [],
        years: uniqueYears,
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      let url = '/api/schedule';

      // Add filter parameters
      if (filterType !== 'master' && filterValue) {
        const params = new URLSearchParams();
        params.append('type', filterType);
        if (filterType === 'section') params.append('sectionId', filterValue);
        if (filterType === 'professor') params.append('professorId', filterValue);
        if (filterType === 'year') params.append('year', filterValue);
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setSchedule(data.schedule || []);
      
      // Performance check: show warning and switch to statistics view if too many items
      const scheduleLength = (data.schedule || []).length;
      if (scheduleLength > PERFORMANCE_THRESHOLD && filterType === 'master') {
        setShowPerformanceWarning(true);
        setViewMode('statistics');
      } else {
        setShowPerformanceWarning(false);
        setViewMode('grid');
      }
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

  const generateSchedule = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear: settings?.academicYear || '2024-2025',
          semester: settings?.currentSemester || 1
        }),
      });

      const data = await res.json();

      if (data.schedule) {
        setSchedule(data.schedule);
        toast({
          title: 'Schedule Generated',
          description: `Successfully generated ${data.schedule.length} schedule items.`,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to generate schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowGenerateConfirm(false);
    }
  };

  const handleGenerateClick = () => {
    setShowGenerateConfirm(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormData({
      day: item.day,
      startSlot: item.startSlot,
      duration: item.duration,
      professorId: item.professorId,
    });
    setValidation({ valid: true, message: 'Slot is available' });
    setDialogOpen(true);
  };

  const saveChanges = async () => {
    if (!editingItem || !validation.valid) return;

    try {
      const res = await fetch(`/api/schedule/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.valid) {
        setSchedule((prev) =>
          prev.map((item) => (item.id === editingItem.id ? data.item : item))
        );
        setDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Changes saved successfully',
        });
      } else {
        setValidation({ valid: false, message: data.error || 'Failed to save' });
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    }
  };

  const getGridMetrics = () => {
    return { slotH: SLOT_HEIGHT, headerH: HEADER_HEIGHT };
  };

  // Calculate positions for overlapping schedule items - memoized to ensure consistency
  // NOTE: This is also done in VirtualizedScheduleGrid, but we keep this for filtering
  const positionedItems = useMemo(() => {
    if (!schedule || schedule.length === 0) return [];
    
    const items = schedule.map((item) => ({
      ...item,
      startSlot: Number(item.startSlot) || 0,
      duration: Number(item.duration) || 3,
      stackIndex: 0,
      totalStack: 1
    }));

    // Group items by day
    const itemsByDay: Record<string, typeof items> = {};
    items.forEach((item) => {
      const day = item.day || '';
      if (!itemsByDay[day]) {
        itemsByDay[day] = [];
      }
      itemsByDay[day].push(item);
    });

    // Process each day for stacking
    Object.entries(itemsByDay).forEach(([day, dayItems]) => {
      if (dayItems.length === 0) return;
      dayItems.sort((a, b) => a.startSlot - b.startSlot);

      const clusters: typeof items[] = [];
      
      dayItems.forEach((item) => {
        const itemStart = item.startSlot;
        const itemEnd = item.startSlot + item.duration;
        const overlappingClusterIndices: number[] = [];
        
        clusters.forEach((cluster, clusterIndex) => {
          const hasOverlap = cluster.some((clusterItem) => {
            const clusterStart = clusterItem.startSlot;
            const clusterEnd = clusterItem.startSlot + clusterItem.duration;
            return itemStart < clusterEnd && itemEnd > clusterStart;
          });
          
          if (hasOverlap) {
            overlappingClusterIndices.push(clusterIndex);
          }
        });
        
        if (overlappingClusterIndices.length === 0) {
          clusters.push([item]);
        } else {
          const mergedCluster = [item];
          overlappingClusterIndices.sort((a, b) => b - a).forEach((idx) => {
            mergedCluster.push(...clusters[idx]);
            clusters.splice(idx, 1);
          });
          clusters.push(mergedCluster);
        }
      });

      clusters.forEach((cluster) => {
        cluster.sort((a, b) => a.startSlot - b.startSlot);
        cluster.forEach((item, index) => {
          item.stackIndex = index;
          item.totalStack = cluster.length;
        });
      });
    });

    return items;
  }, [schedule]);

  // Filter positioned items by DEBOUNCED search query - this is the key optimization!
  const visibleItems = useMemo(() => {
    if (!debouncedSearchQuery) return positionedItems;
    const query = debouncedSearchQuery.toLowerCase();
    return positionedItems.filter((item) =>
      item.subjectName.toLowerCase().includes(query) ||
      item.subjectCode.toLowerCase().includes(query) ||
      item.professorName.toLowerCase().includes(query) ||
      item.sectionName.toLowerCase().includes(query) ||
      item.day.toLowerCase().includes(query)
    );
  }, [positionedItems, debouncedSearchQuery]);

  // Don't render until mounted on client to prevent hydration mismatch
  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <div className="w-full sm:w-auto">
              <div className="h-8 w-48 sm:w-64 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 sm:w-48 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-28 sm:w-32 bg-slate-200 rounded animate-pulse" />
          </div>
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
          {/* Left Section: Filters and Generate Button */}
          <div className="flex flex-row items-center gap-1 flex-1 min-w-0">
            {user?.role === 'admin' && (
              <>
                <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md border border-emerald-200/50 rounded-lg p-0.5 flex-shrink-0 shadow-sm">
                  <Filter className="w-3 h-3 text-emerald-600 ml-1 flex-shrink-0" />
                  <Select value={filterType} onValueChange={(v: ScheduleFilter) => setFilterType(v)}>
                    <SelectTrigger className="w-[50px] border-0 bg-transparent focus:ring-0 h-7 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[150]">
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="section">Section</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>
                  {filterType !== 'master' && (
                    <Select value={filterValue} onValueChange={setFilterValue}>
                      <SelectTrigger className="w-[55px] border-0 bg-transparent focus:ring-0 h-7 text-[10px]">
                        <SelectValue placeholder="..." />
                      </SelectTrigger>
                      <SelectContent className="z-[150]">
                        {filterType === 'section' && filterOptions.sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                        {filterType === 'professor' && filterOptions.professors.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.name}
                          </SelectItem>
                        ))}
                        {filterType === 'year' && filterOptions.years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {formatYear(year)}
                          </SelectItem>
                        ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Button
                    onClick={handleGenerateClick}
                    disabled={loading}
                    className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-semibold h-7 px-1.5 text-[10px] flex-shrink-0 backdrop-blur-md border border-yellow-300/50 shadow-lg shadow-yellow-500/20 transition-all duration-200"
                  >
                    <Sparkles className="w-3 h-3 mr-0.5" />
                    <span>Generate</span>
                  </Button>
                </>
              )}
          </div>

          {/* Compact Search Bar */}
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

          {/* Right Section: Date, Time, and Semester */}
          {mounted && (
            <div className="flex flex-col items-end gap-1">
              {/* Semester Info - Separate Container */}
              <div className="bg-white/60 backdrop-blur-md border border-emerald-200/50 rounded-lg px-2 py-1 shadow-sm">
                <div className="text-[11px] font-semibold text-emerald-700 leading-tight">
                  SY {settings?.academicYear || '2024-2025'} - {settings?.currentSemester ? formatSemester(settings.currentSemester) : formatSemester(1)}
                </div>
              </div>
              {/* Date and Time - Separate Container */}
              <div className="flex flex-row items-center gap-1 bg-white/60 backdrop-blur-md border border-emerald-200/50 rounded-lg px-2 py-0.5 shadow-sm">
                <div className="flex items-center gap-0.5 text-emerald-700">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[10px] font-medium">
                    {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="w-px h-3.5 bg-emerald-200/50"></div>
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
            {/* Left Section: Filters and Generate Button */}
            <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
              {user?.role === 'admin' && (
                <>
                  <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-emerald-200/50 rounded-lg p-1 flex-shrink-0 shadow-sm">
                    <Filter className="w-4 h-4 text-emerald-600 ml-1 flex-shrink-0" />
                    <Select value={filterType} onValueChange={(v: ScheduleFilter) => setFilterType(v)}>
                      <SelectTrigger className="w-[120px] border-0 bg-transparent focus:ring-0 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="master">Master</SelectItem>
                        <SelectItem value="section">Section</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>
                    {filterType !== 'master' && (
                      <Select value={filterValue} onValueChange={setFilterValue}>
                        <SelectTrigger className="w-[130px] border-0 bg-transparent focus:ring-0 h-8 text-xs">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filterType === 'section' && filterOptions.sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                          {filterType === 'professor' && filterOptions.professors.map((prof) => (
                            <SelectItem key={prof.id} value={prof.id}>
                              {prof.name}
                            </SelectItem>
                          ))}
                          {filterType === 'year' && filterOptions.years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {formatYear(year)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Button
                    onClick={handleGenerateClick}
                    className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-semibold h-8 px-3 text-xs flex-shrink-0 backdrop-blur-md border border-yellow-300/50 shadow-lg shadow-yellow-500/20 transition-all duration-200"
                    disabled={loading}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>Generate</span>
                  </Button>
                </>
              )}
            </div>

            {/* Middle Section: Current Semester and Search */}
            <div className="flex items-center gap-3 flex-1 justify-center">
              <span className="text-sm font-medium text-slate-600">
                SY {settings?.academicYear || '2024-2025'} - {settings?.currentSemester ? formatSemester(settings.currentSemester) : formatSemester(1)}
              </span>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search schedule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8 text-xs bg-white/60 backdrop-blur-md border border-emerald-200/50 focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Right Section: Date and Time */}
            {mounted && (
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex flex-row items-center gap-3 bg-white/60 backdrop-blur-md border border-emerald-200/50 rounded-lg px-3 py-1.5 shadow-sm">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium">
                      {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-emerald-200/50"></div>
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

        {/* Performance Warning Banner */}
        {showPerformanceWarning && schedule.length > PERFORMANCE_THRESHOLD && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <Zap className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <span className="font-semibold">Large dataset detected!</span> Showing {schedule.length.toLocaleString()} schedules may cause performance issues. 
              Statistics view is enabled by default. Use the toggle below to switch to Grid view, or apply a filter to reduce the number of items.
            </AlertDescription>
          </Alert>
        )}

        {/* View Mode Toggle & Schedule Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/60 border-slate-200 text-slate-600">
              {schedule.length.toLocaleString()} schedules
            </Badge>
            {filterType !== 'master' && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                Filtered: {filterType}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md border border-slate-200 rounded-lg p-1">
            <Button
              variant={viewMode === 'statistics' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('statistics')}
              className={`h-7 px-2 text-xs ${viewMode === 'statistics' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              Statistics
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`h-7 px-2 text-xs ${viewMode === 'grid' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Grid3X3 className="w-3.5 h-3.5 mr-1" />
              Grid
            </Button>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'statistics' ? (
          <StatisticsDashboard
            schedule={schedule}
            totalProfessors={totalProfessors}
            totalSections={totalSections}
            totalSubjects={totalSubjects}
          />
        ) : (
          /* Schedule Grid */
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
                className="bg-white border-r border-t border-b border-slate-200 rounded-r-xl relative overflow-hidden z-10"
                style={{
                  height: `calc(${HEADER_HEIGHT}px + (15 * ${SLOT_HEIGHT}px))`,
                  minWidth: `${(60 * 5) + 800}px`,
                }}
              >
                {/* Background Grid for Days */}
                <div
                  className="absolute inset-0 grid z-20"
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

                {/* Events Layer - Using Virtualized Grid for better performance */}
                <VirtualizedScheduleGrid
                  schedule={visibleItems}
                  containerRef={containerRef}
                  hoveredCardId={hoveredCardId}
                  setHoveredCardId={setHoveredCardId}
                  openEditModal={openEditModal}
                  userRole={user?.role}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-[95vw] bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 -mx-6 -mt-6 px-6 py-5 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Edit Schedule</DialogTitle>
                {editingItem && (
                  <DialogDescription className="text-emerald-100 text-sm mt-0.5">
                    {editingItem.subjectCode} - {editingItem.subjectName}
                  </DialogDescription>
                )}
              </div>
            </div>
          </div>

          {/* Subject Info Card */}
          {editingItem && (
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/50 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${editingItem.type === 'lecture' ? 'bg-indigo-100' : 'bg-pink-100'}`}>
                  <span className={`text-lg font-bold ${editingItem.type === 'lecture' ? 'text-indigo-600' : 'text-pink-600'}`}>
                    {editingItem.subjectCode.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{editingItem.subjectName}</div>
                  <div className="text-sm text-slate-500">Section: {editingItem.sectionName}</div>
                </div>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="space-y-5 px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="day" className="text-sm font-semibold text-slate-700">Day</Label>
                <Select
                  value={formData.day}
                  onValueChange={(value) => setFormData({ ...formData, day: value })}
                >
                  <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl">
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day} className="hover:bg-emerald-50 focus:bg-emerald-50">
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startSlot" className="text-sm font-semibold text-slate-700">Start Time</Label>
                <Select
                  value={formData.startSlot.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, startSlot: parseInt(value) })
                  }
                >
                  <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl">
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((hour) => (
                      <SelectItem key={hour} value={hour.toString()} className="hover:bg-emerald-50 focus:bg-emerald-50">
                        {TIME_MAP[hour]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-semibold text-slate-700">Duration</Label>
              <Select
                value={formData.duration.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, duration: parseInt(value) })
                }
              >
                <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <SelectItem key={d} value={d.toString()} className="hover:bg-emerald-50 focus:bg-emerald-50">
                      {d} Hour{d > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Validation Alert */}
            <Alert
              variant={validation.valid ? 'default' : 'destructive'}
              className={`${validation.valid ? 'bg-emerald-50 border-emerald-200' : ''} rounded-xl`}
            >
              {validation.valid ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription className={validation.valid ? 'text-emerald-700' : ''}>
                {validation.message}
              </AlertDescription>
            </Alert>
          </div>

          {/* Footer */}
          <DialogFooter className="mt-6 pt-4 border-t border-slate-100 gap-3">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="px-6 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={saveChanges}
              disabled={!validation.valid}
              className="px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Schedule Confirmation Dialog */}
      <AlertDialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl max-w-md">
          <div className="flex items-start gap-4 pt-2">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <AlertDialogHeader className="text-left p-0 mb-0">
                <AlertDialogTitle className="text-xl font-bold text-slate-900">Generate New Schedule?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 mt-2">
                  This will generate a new schedule for all sections.
                  <br /><br />
                  <span className="text-amber-600 font-medium">Any existing schedule data will be overwritten.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>
          <AlertDialogFooter className="mt-6 pt-4 border-t border-slate-100 gap-3">
            <AlertDialogCancel className="px-6 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={generateSchedule}
              className="px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all duration-200"
            >
              Generate Schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
