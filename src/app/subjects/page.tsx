'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BookOpen, Plus, Edit2, Trash2, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Subject } from '@/lib/types';
import { formatSemester, formatYear } from '@/lib/utils';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    year: 1,
    semester: 1,
    units: 3,
    lectureHours: 2,
    labHours: 3,
    programId: '' as string | null,
    programName: '' as string | null,
  });

  useEffect(() => {
    fetchSubjects();
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs');
      const data = await res.json();
      setPrograms(data.programs || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch subjects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingSubject(null);
    setFormData({
      code: '',
      name: '',
      year: 1,
      semester: 1,
      units: 3,
      lectureHours: 2,
      labHours: 3,
      programId: null,
      programName: null,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      code: subject.code,
      name: subject.name,
      year: subject.year,
      semester: subject.semester,
      units: subject.units,
      lectureHours: subject.lectureHours || 2,
      labHours: subject.labHours || 3,
      programId: subject.programId || null,
      programName: subject.programName || null,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const method = editingSubject ? 'PUT' : 'POST';
      const url = editingSubject ? `/api/subjects/${editingSubject.id}` : '/api/subjects';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success || data.subject) {
        toast({
          title: 'Success',
          description: editingSubject ? 'Subject updated successfully' : 'Subject created successfully',
        });
        setDialogOpen(false);
        fetchSubjects();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save subject',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save subject',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Subject deleted successfully',
        });
        fetchSubjects();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete subject',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete subject',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Subjects Management</h1>
              <p className="text-slate-600">Manage course offerings and subjects</p>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-semibold backdrop-blur-md border border-yellow-300/50 shadow-lg shadow-yellow-500/20 transition-all duration-200">
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </div>

        {/* Warning for subjects without program */}
        {subjects.some((s) => !s.programId) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Action Required: Assign Programs to Subjects</h3>
                <p className="text-sm text-red-700">
                  You have subjects without program assignments. These subjects will NOT be included in generated schedules.
                  Please edit each subject and assign it to the correct program.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card className="bg-white/60 backdrop-blur-md border border-emerald-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">All Subjects</CardTitle>
            <CardDescription className="text-slate-600">
              {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} in system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No subjects yet. Click "Add Subject" to create one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Code</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Program</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Year</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Sem</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Units</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Hours</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm font-medium text-slate-900">{subject.code}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">{subject.name}</td>
                        <td className="py-3 px-4 text-sm text-slate-700">
                          {subject.programName ? (
                            <Badge variant="outline" className="font-medium">
                              {subject.programName}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="font-medium">
                              No Program Assigned
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">{formatYear(subject.year)}</td>
                        <td className="py-3 px-4 text-sm text-slate-700">{formatSemester(subject.semester)}</td>
                        <td className="py-3 px-4 text-sm text-slate-700">{subject.units}</td>
                        <td className="py-3 px-4 text-sm text-slate-700">
                          <span className="font-semibold text-emerald-700">{subject.totalHours}</span>
                          <span className="text-slate-500 ml-2">
                            ({subject.lectureHours} lec + {subject.labHours} lab)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(subject)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(subject.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[700px] bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 -mx-6 -mt-6 px-6 py-5 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    {editingSubject ? 'Edit Subject' : 'Create New Subject'}
                  </DialogTitle>
                  <DialogDescription className="text-emerald-100 text-sm mt-0.5">
                    {editingSubject ? 'Update the course information below' : 'Add a new subject to the curriculum'}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Two-Column Form Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-1">
              {/* Left Column - Basic Information */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Basic Information
                  </h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    Subject Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="e.g., CS101"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    Subject Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Introduction to Computing"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    Program <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.programId || ''}
                    onValueChange={(value) => {
                      const selectedProgram = programs.find((p) => p.id === value);
                      setFormData({
                        ...formData,
                        programId: value || null,
                        programName: selectedProgram?.name || null,
                      });
                    }}
                  >
                    <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl">
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id} className="hover:bg-emerald-50 focus:bg-emerald-50">
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Required for schedule generation
                  </p>
                </div>
              </div>

              {/* Right Column - Schedule Settings */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Schedule Settings
                  </h4>
                </div>

                {/* Year & Semester */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-sm font-semibold text-slate-700">Year Level</Label>
                    <Select
                      value={formData.year.toString()}
                      onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl">
                        {[1, 2, 3, 4].map((year) => (
                          <SelectItem key={year} value={year.toString()} className="hover:bg-emerald-50 focus:bg-emerald-50">
                            {formatYear(year)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester" className="text-sm font-semibold text-slate-700">Semester</Label>
                    <Select
                      value={formData.semester.toString()}
                      onValueChange={(value) => setFormData({ ...formData, semester: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl">
                        {[1, 2].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()} className="hover:bg-emerald-50 focus:bg-emerald-50">
                            {formatSemester(sem)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Units */}
                <div className="space-y-2">
                  <Label htmlFor="units" className="text-sm font-semibold text-slate-700">Units</Label>
                  <Input
                    id="units"
                    type="number"
                    min="1"
                    max="6"
                    value={formData.units.toString()}
                    onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) })}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                {/* Hours Section */}
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="font-semibold text-sm text-slate-900 mb-3">Weekly Hours</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="lectureHours" className="text-sm font-medium text-slate-600">Lecture</Label>
                      <Input
                        id="lectureHours"
                        type="number"
                        min="0"
                        max="9"
                        placeholder="e.g., 2"
                        value={formData.lectureHours?.toString() || '0'}
                        onChange={(e) => setFormData({ ...formData, lectureHours: parseInt(e.target.value) || 0 })}
                        className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="labHours" className="text-sm font-medium text-slate-600">Lab</Label>
                      <Input
                        id="labHours"
                        type="number"
                        min="0"
                        max="9"
                        placeholder="e.g., 3"
                        value={formData.labHours?.toString() || '0'}
                        onChange={(e) => setFormData({ ...formData, labHours: parseInt(e.target.value) || 0 })}
                        className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="mt-6 pt-4 border-t border-slate-100 gap-3">
              <Button
                type="button"
                onClick={() => setDialogOpen(false)}
                variant="outline"
                className="px-6 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {editingSubject ? 'Update Subject' : 'Create Subject'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
