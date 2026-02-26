'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  TrendingUp,
  Building2,
  GraduationCap,
  X,
  MapPin
} from 'lucide-react';
import { DAYS, TIME_MAP } from '@/lib/types';

interface ScheduleItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  sectionName: string;
  professorName: string;
  day: string;
  startSlot: number;
  duration: number;
  programName: string;
  year: number;
  professorId?: string;
}

interface ProfessorStats {
  name: string;
  count: number;
  hours: number;
}

interface StatisticsDashboardProps {
  schedule: ScheduleItem[];
  totalProfessors: number;
  totalSections: number;
  totalSubjects: number;
}

export function StatisticsDashboard({ 
  schedule, 
  totalProfessors, 
  totalSections, 
  totalSubjects 
}: StatisticsDashboardProps) {
  const [selectedProfessor, setSelectedProfessor] = useState<ProfessorStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get schedules for selected professor
  const professorSchedules = React.useMemo(() => {
    if (!selectedProfessor) return [];
    return schedule.filter(item => item.professorName === selectedProfessor.name);
  }, [schedule, selectedProfessor]);

  // Group professor schedules by day
  const professorSchedulesByDay = React.useMemo(() => {
    const grouped: Record<string, ScheduleItem[]> = {};
    DAYS.forEach(day => {
      grouped[day] = professorSchedules
        .filter(item => item.day === day)
        .sort((a, b) => a.startSlot - b.startSlot);
    });
    return grouped;
  }, [professorSchedules]);

  // Handle professor click
  const handleProfessorClick = (prof: ProfessorStats) => {
    setSelectedProfessor(prof);
    setIsModalOpen(true);
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!schedule || schedule.length === 0) {
      return {
        totalSchedules: 0,
        byDay: {},
        byProgram: {},
        byYear: {},
        byProfessor: [],  // Must be array for .slice() to work
        avgSchedulesPerProfessor: 0,
        avgSchedulesPerSection: 0,
        utilizationRate: 0,
      };
    }

    const byDay: Record<string, number> = {};
    const byProgram: Record<string, number> = {};
    const byYear: Record<string, number> = {};
    const byProfessor: Record<string, { name: string; count: number; hours: number }> = {};

    schedule.forEach((item) => {
      // By day
      byDay[item.day] = (byDay[item.day] || 0) + 1;
      
      // By program
      byProgram[item.programName || 'Unknown'] = (byProgram[item.programName || 'Unknown'] || 0) + 1;
      
      // By year
      const yearKey = `Year ${item.year}`;
      byYear[yearKey] = (byYear[yearKey] || 0) + 1;
      
      // By professor - track both count and hours
      if (!byProfessor[item.professorId || item.professorName]) {
        byProfessor[item.professorId || item.professorName] = { 
          name: item.professorName, 
          count: 0,
          hours: 0
        };
      }
      byProfessor[item.professorId || item.professorName].count++;
      byProfessor[item.professorId || item.professorName].hours += (item.duration || 3);
    });

    // Sort professors by count
    const professorStats = Object.values(byProfessor).sort((a, b) => b.count - a.count);

    // Calculate total teaching hours from schedule
    const totalTeachingHours = schedule.reduce((sum, item) => sum + (item.duration || 3), 0);
    const avgHoursPerProfessor = totalProfessors > 0 
      ? Math.round(totalTeachingHours / totalProfessors * 10) / 10 
      : 0;

    // Capacity: 36 hours per professor per week
    const maxHoursPerProfessor = 36;
    const utilizationRate = totalProfessors > 0 
      ? Math.round((totalTeachingHours / (totalProfessors * maxHoursPerProfessor)) * 100) 
      : 0;

    return {
      totalSchedules: schedule.length,
      totalTeachingHours,
      avgHoursPerProfessor,
      byDay,
      byProgram,
      byYear,
      byProfessor: professorStats,
      avgSchedulesPerProfessor: totalProfessors > 0 
        ? Math.round(schedule.length / totalProfessors * 10) / 10 
        : 0,
      avgSchedulesPerSection: totalSections > 0 
        ? Math.round(schedule.length / totalSections * 10) / 10 
        : 0,
      utilizationRate,
    };
  }, [schedule, totalProfessors, totalSections]);

  const dayColors: Record<string, string> = {
    Mon: 'bg-blue-500',
    Tue: 'bg-green-500',
    Wed: 'bg-yellow-500',
    Thu: 'bg-orange-500',
    Fri: 'bg-purple-500',
    Sat: 'bg-pink-500',
  };

  const yearColors: Record<string, string> = {
    'Year 1': 'bg-emerald-500',
    'Year 2': 'bg-blue-500',
    'Year 3': 'bg-purple-500',
    'Year 4': 'bg-amber-500',
  };

  // Format time slot for display
  const formatTimeSlot = (startSlot: number, duration: number): string => {
    const startTime = TIME_MAP[startSlot] || 'Unknown';
    const endTime = TIME_MAP[startSlot + duration] || 'Unknown';
    return `${startTime} - ${endTime}`;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Total Schedules</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalSchedules.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-emerald-600 font-medium">Professors</p>
                  <p className="text-2xl font-bold text-emerald-700">{totalProfessors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-medium">Sections</p>
                  <p className="text-2xl font-bold text-purple-700">{totalSections}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-medium">Subjects</p>
                  <p className="text-2xl font-bold text-amber-700">{totalSubjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Utilization Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="bg-white/60 border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Avg Hours/Professor</p>
                  <p className="text-xl font-bold text-slate-700">{stats.avgHoursPerProfessor} hrs</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total Teaching Hours</p>
                  <p className="text-xl font-bold text-slate-700">{stats.totalTeachingHours?.toLocaleString() || 0} hrs</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Capacity Utilization</p>
                  <p className="text-xl font-bold text-slate-700">{stats.utilizationRate}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* By Day */}
          <Card className="bg-white/60 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Schedule Distribution by Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const count = stats.byDay[day] || 0;
                  const maxCount = Math.max(...Object.values(stats.byDay), 1);
                  const percentage = (count / maxCount) * 100;
                  
                  return (
                    <div key={day} className="flex items-center gap-2">
                      <span className="w-12 text-xs font-medium text-slate-600">{day}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${dayColors[day]} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-xs font-bold text-slate-700 text-right">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* By Year */}
          <Card className="bg-white/60 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-500" />
                Schedule Distribution by Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Year 1', 'Year 2', 'Year 3', 'Year 4'].map((year) => {
                  const count = stats.byYear[year] || 0;
                  const maxCount = Math.max(...Object.values(stats.byYear), 1);
                  const percentage = (count / maxCount) * 100;
                  
                  return (
                    <div key={year} className="flex items-center gap-2">
                      <span className="w-16 text-xs font-medium text-slate-600">{year}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${yearColors[year]} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-xs font-bold text-slate-700 text-right">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* By Program */}
        <Card className="bg-white/60 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              Schedule Distribution by Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byProgram).map(([program, count]) => {
                const percentage = stats.totalSchedules > 0 
                  ? Math.round((count / stats.totalSchedules) * 100) 
                  : 0;
                
                return (
                  <Badge 
                    key={program} 
                    variant="outline"
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200"
                  >
                    <span className="font-medium">{program}</span>
                    <span className="ml-2 text-emerald-600 font-bold">{count.toLocaleString()}</span>
                    <span className="ml-1 text-slate-400">({percentage}%)</span>
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* All Professors */}
        <Card className="bg-white/60 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Professor Workload ({Array.isArray(stats.byProfessor) ? stats.byProfessor.length : 0} Professors)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
              {Array.isArray(stats.byProfessor) && stats.byProfessor.map((prof, index) => {
                const maxHours = 36; // Max hours per professor per week
                const percentage = Math.round((prof.hours / maxHours) * 100);
                
                return (
                  <div 
                    key={index}
                    onClick={() => handleProfessorClick(prof)}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index < 3 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-slate-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
                          {prof.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{percentage}% capacity</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {prof.count} schedules ({prof.hours} hrs)
                    </Badge>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">Click on a professor to view their schedule details</p>
          </CardContent>
        </Card>
      </div>

      {/* Professor Schedule Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                <Users className="w-5 h-5" />
              </div>
              {selectedProfessor?.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-500" />
                <strong>{selectedProfessor?.count}</strong> schedules
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-emerald-500" />
                <strong>{selectedProfessor?.hours}</strong> hours/week
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <strong>{Math.round(((selectedProfessor?.hours || 0) / 36) * 100)}%</strong> capacity
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {DAYS.map(day => {
              const daySchedules = professorSchedulesByDay[day] || [];
              if (daySchedules.length === 0) return null;

              return (
                <div key={day} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className={`${dayColors[day]} text-white px-4 py-2 font-semibold flex items-center justify-between`}>
                    <span>{day}</span>
                    <span className="text-sm opacity-90">
                      {daySchedules.length} schedule{daySchedules.length > 1 ? 's' : ''} • {daySchedules.reduce((sum, s) => sum + s.duration, 0)} hours
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {daySchedules.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 hover:bg-slate-50">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-600">
                            {formatTimeSlot(item.startSlot, item.duration)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {item.subjectCode} - {item.subjectName}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {item.sectionName} • {item.programName}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.duration} hrs
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Weekly Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{selectedProfessor?.count}</p>
                  <p className="text-xs text-slate-500">Total Schedules</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{selectedProfessor?.hours}</p>
                  <p className="text-xs text-slate-500">Teaching Hours</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {DAYS.filter(day => professorSchedulesByDay[day]?.length > 0).length}
                  </p>
                  <p className="text-xs text-slate-500">Days with Classes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {new Set(professorSchedules.map(s => s.sectionName)).size}
                  </p>
                  <p className="text-xs text-slate-500">Unique Sections</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
