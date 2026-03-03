'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { School, Plus, Edit2, Trash2, Loader2, Users, Building2 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Program, Section, Department } from '@/lib/types';
import { formatYear } from '@/lib/utils';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'program' | 'section'>('program');
  const [editingItem, setEditingItem] = useState<Program | Section | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    programId: '',
    programName: '',
    departmentId: '',
    sectionName: '',
    year: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programsRes, departmentsRes] = await Promise.all([
        fetch('/api/programs'),
        fetch('/api/departments')
      ]);

      const programsData = await programsRes.json();
      const departmentsData = await departmentsRes.json();

      setPrograms(programsData.programs || []);
      setSections(programsData.sections || []);
      setDepartments(departmentsData.departments || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateProgramDialog = () => {
    setDialogType('program');
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      programId: '',
      programName: '',
      departmentId: '',
      sectionName: '',
      year: 1,
    });
    setDialogOpen(true);
  };

  const openCreateSectionDialog = () => {
    setDialogType('section');
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      programId: '',
      programName: '',
      departmentId: '',
      sectionName: '',
      year: 1,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: Program | Section, type: 'program' | 'section') => {
    setDialogType(type);
    setEditingItem(item);
    setFormData({
      code: 'code' in item ? item.code : '',
      name: item.name,
      description: 'description' in item ? item.description || '' : '',
      programId: 'programId' in item ? item.programId : '',
      programName: 'programName' in item ? item.programName : '',
      departmentId: 'departmentId' in item ? (item.departmentId || '') : '',
      sectionName: 'sectionName' in item ? item.sectionName : '',
      year: 'year' in item ? item.year : 1,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      let res;
      if (editingItem) {
        // Update existing item
        res = await fetch(`/api/${dialogType}s/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            type: dialogType,
          }),
        });
      } else {
        // Create new item
        res = await fetch('/api/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            type: dialogType,
          }),
        });
      }

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: dialogType === 'program'
            ? (editingItem ? 'Program updated' : 'Program created')
            : (editingItem ? 'Section updated' : 'Section created'),
        });
        setDialogOpen(false);
        fetchData();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, type: 'program' | 'section') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const res = await fetch(`/api/${type}s/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
        });
        fetchData();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete',
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
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Programs & Sections</h1>
              <p className="text-slate-600">Manage academic programs and sections</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreateProgramDialog} className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-semibold backdrop-blur-md border border-yellow-300/50 shadow-lg shadow-yellow-500/20 transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Add Program
            </Button>
            <Button onClick={openCreateSectionDialog} className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-semibold backdrop-blur-md border border-yellow-300/50 shadow-lg shadow-yellow-500/20 transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>
        </div>

        <Tabs defaultValue="programs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="programs">
              Programs ({programs.length})
            </TabsTrigger>
            <TabsTrigger value="sections">
              Sections ({sections.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="programs">
            <Card className="bg-white/60 backdrop-blur-md border border-emerald-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900">All Programs</CardTitle>
                <CardDescription className="text-slate-600">
                  Academic programs offered by the institution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
                ) : programs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <School className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No programs yet. Click "Add Program" to create one.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 sticky top-0 bg-white">Code</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 sticky top-0 bg-white">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 sticky top-0 bg-white">Department</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 sticky top-0 bg-white">Description</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900 sticky top-0 bg-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programs.map((program) => (
                          <tr key={program.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm font-medium text-slate-900">{program.code}</span>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-700">{program.name}</td>
                            <td className="py-3 px-4 text-sm text-slate-700">{program.departmentName || '-'}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{program.description}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(program, 'program')}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(program.id, 'program')}
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
          </TabsContent>

          <TabsContent value="sections">
            <Card className="bg-white/60 backdrop-blur-md border border-emerald-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900">All Sections</CardTitle>
                <CardDescription className="text-slate-600">
                  Class sections organized by program and year
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
                ) : sections.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <School className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No sections yet. Click "Add Section" to create one.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 sticky top-0 bg-white">Program</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 sticky top-0 bg-white">Section</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 sticky top-0 bg-white">Year</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900 sticky top-0 bg-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sections.map((section) => (
                          <tr key={section.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-700">{section.programName}</td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm font-medium text-slate-900">{section.sectionName}</span>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-700">{formatYear(section.year)}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(section, 'section')}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(section.id, 'section')}
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
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[650px] bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 -mx-6 -mt-6 px-6 py-5 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {dialogType === 'program' ? (
                    <School className="w-5 h-5 text-white" />
                  ) : (
                    <Users className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    {dialogType === 'program'
                      ? (editingItem ? 'Edit Program' : 'Create New Program')
                      : (editingItem ? 'Edit Section' : 'Create New Section')
                    }
                  </DialogTitle>
                  <DialogDescription className="text-emerald-100 text-sm mt-0.5">
                    {dialogType === 'program'
                      ? (editingItem ? 'Update the program information below' : 'Add a new academic program to the system')
                      : (editingItem ? 'Update the section information below' : 'Add a new class section to a program')
                    }
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Form Content */}
            {dialogType === 'program' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-1">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                      <School className="w-4 h-4 text-emerald-600" />
                      Program Details
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Program Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      placeholder="e.g., BSCS"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Program Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., BS in Computer Science"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      Organization
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-semibold text-slate-700">
                      Department
                    </Label>
                    <Select
                      value={formData.departmentId}
                      onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                    >
                      <SelectTrigger id="department" className="bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl">
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id} className="hover:bg-emerald-50 focus:bg-emerald-50">
                            <span className="font-medium">{dept.code}</span>
                            <span className="text-slate-500 ml-2">- {dept.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                      Description
                    </Label>
                    <Input
                      id="description"
                      placeholder="Brief description of the program"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-1">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                      <School className="w-4 h-4 text-emerald-600" />
                      Program Selection
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="program" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Select Program <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.programId}
                      onValueChange={(value) => setFormData({ ...formData, programId: value, programName: programs.find(p => p.id === value)?.name || '' })}
                    >
                      <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                        <SelectValue placeholder="Choose a program" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl">
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id} className="hover:bg-emerald-50 focus:bg-emerald-50">
                            <span className="font-medium">{program.code}</span>
                            <span className="text-slate-500 ml-2">- {program.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      Section Details
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sectionName" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Section Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sectionName"
                      placeholder="e.g., BSCS-1A"
                      value={formData.sectionName}
                      onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })}
                      className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Year Level <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.year.toString()}
                      onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                        <SelectValue placeholder="Select year" />
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
                </div>
              </div>
            )}

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
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : dialogType === 'program' ? (
                  editingItem ? 'Update Program' : 'Create Program'
                ) : (
                  editingItem ? 'Update Section' : 'Create Section'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
