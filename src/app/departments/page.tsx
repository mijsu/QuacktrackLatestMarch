'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Department, Program } from '@/lib/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Building2, Plus, Pencil, Trash2, Users, BookOpen, AlertCircle, Check, AlertTriangle } from 'lucide-react';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  // Remove confirmation dialogs
  const [removeProgramDialogOpen, setRemoveProgramDialogOpen] = useState(false);
  const [removeProfessorDialogOpen, setRemoveProfessorDialogOpen] = useState(false);
  const [removingProgram, setRemovingProgram] = useState<Program | null>(null);
  const [removingProfessor, setRemovingProfessor] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      fetchDepartments();
      fetchPrograms();
    }
  }, [mounted, user]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const [departmentsRes, programsRes, professorsRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/programs'),
        fetch('/api/professors')
      ]);

      const departmentsData = await departmentsRes.json();
      const programsData = await programsRes.json();
      const professorsData = await professorsRes.json();

      setDepartments(departmentsData.departments || []);
      setPrograms(programsData.programs || []);
      setProfessors(professorsData.professors || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch departments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs');
      const data = await res.json();
      setPrograms(data.programs || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const openCreateModal = () => {
    setEditingDepartment(null);
    setFormData({ name: '', code: '', description: '' });
    setDialogOpen(true);
  };

  const openEditModal = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || ''
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (department: Department) => {
    setDeletingDepartment(department);
    setDeleteDialogOpen(true);
  };

  const saveDepartment = async () => {
    if (!formData.name || !formData.code) {
      toast({
        title: 'Validation Error',
        description: 'Name and code are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingDepartment) {
        // Update existing department
        const res = await fetch('/api/departments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingDepartment.id,
            ...formData
          }),
        });

        if (res.ok) {
          setDepartments(prev =>
            prev.map(dept =>
              dept.id === editingDepartment.id
                ? { ...dept, ...formData }
                : dept
            )
          );
          toast({
            title: 'Success',
            description: 'Department updated successfully',
          });
        }
      } else {
        // Create new department
        const res = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (data.department) {
          setDepartments(prev => [...prev, data.department]);
          toast({
            title: 'Success',
            description: 'Department created successfully',
          });
        }
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: 'Error',
        description: 'Failed to save department',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!deletingDepartment) return;

    try {
      const res = await fetch(`/api/departments?id=${deletingDepartment.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDepartments(prev =>
          prev.filter(dept => dept.id !== deletingDepartment.id)
        );
        toast({
          title: 'Success',
          description: 'Department deleted successfully',
        });
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete department',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingDepartment(null);
    }
  };

  // Remove program from department
  const openRemoveProgramDialog = (program: Program) => {
    setRemovingProgram(program);
    setRemoveProgramDialogOpen(true);
  };

  const confirmRemoveProgram = async () => {
    if (!removingProgram) return;

    try {
      const res = await fetch(`/api/programs/${removingProgram.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: null,
        }),
      });

      if (res.ok) {
        setPrograms(prev =>
          prev.map(p =>
            p.id === removingProgram.id
              ? { ...p, departmentId: null }
              : p
          )
        );
        toast({
          title: 'Success',
          description: 'Program removed from department successfully',
        });
      }
    } catch (error) {
      console.error('Error removing program:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove program from department',
        variant: 'destructive',
      });
    } finally {
      setRemoveProgramDialogOpen(false);
      setRemovingProgram(null);
    }
  };

  // Remove professor from department
  const openRemoveProfessorDialog = (professor: any) => {
    setRemovingProfessor(professor);
    setRemoveProfessorDialogOpen(true);
  };

  const confirmRemoveProfessor = async () => {
    if (!removingProfessor || !editingDepartment) return;

    try {
      const newDepartmentIds = (removingProfessor.departmentIds || []).filter(
        (id: string) => id !== editingDepartment.id
      );

      const res = await fetch(`/api/professors/${removingProfessor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentIds: newDepartmentIds,
        }),
      });

      if (res.ok) {
        setProfessors(prev =>
          prev.map(p =>
            p.id === removingProfessor.id
              ? { ...p, departmentIds: newDepartmentIds }
              : p
          )
        );
        toast({
          title: 'Success',
          description: 'Professor removed from department successfully',
        });
      }
    } catch (error) {
      console.error('Error removing professor:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove professor from department',
        variant: 'destructive',
      });
    } finally {
      setRemoveProfessorDialogOpen(false);
      setRemovingProfessor(null);
    }
  };

  const getDepartmentPrograms = (departmentId: string) => {
    return programs.filter(p => p.departmentId === departmentId);
  };

  const getDepartmentProfessors = (departmentId: string) => {
    // Filter professors who are assigned to this department
    return professors.filter(prof =>
      prof.departmentIds && prof.departmentIds.includes(departmentId)
    );
  };

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6">
          <div className="h-8 w-48 sm:w-64 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 sm:w-48 bg-slate-200 rounded animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6">
        {/* Departments Grid Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Academic Departments
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Manage academic departments and their assigned programs and professors
          </p>
        </div>

        {/* Create Department Button */}
        {user?.role === 'admin' && (
          <Button
            onClick={openCreateModal}
            className="mb-6 sm:mb-8 w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Department
          </Button>
        )}

        {/* Departments Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-3" />
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : departments.length === 0 ? (
          <Alert className="border-emerald-200 bg-emerald-50">
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              No departments found. Create your first academic department to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {departments.map((department) => {
              const deptPrograms = getDepartmentPrograms(department.id);
              const profCount = getDepartmentProfessors(department.id).length;

              return (
                <div
                  key={department.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg hover:z-10 transition-all duration-200 relative"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                        {department.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {department.code}
                      </Badge>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(department)}
                          className="h-8 w-8 text-slate-600 hover:text-emerald-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(department)}
                          className="h-8 w-8 text-slate-600 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {department.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {department.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    {/* Programs Count */}
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900">
                          {deptPrograms.length} {deptPrograms.length === 1 ? 'Program' : 'Programs'}
                        </div>
                        <div className="text-xs text-slate-600">
                          {deptPrograms.length > 0
                            ? deptPrograms.map(p => p.name).join(', ')
                            : 'No programs assigned yet'}
                        </div>
                      </div>
                    </div>

                    {/* Professors Count */}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <div className="text-sm font-semibold text-slate-900">
                        {profCount} {profCount === 1 ? 'Professor' : 'Professors'} Assigned
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[750px] max-w-[95vw] bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 -mx-6 -mt-6 px-6 py-5 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  {editingDepartment ? 'Edit Department' : 'Create Department'}
                </DialogTitle>
                <DialogDescription className="text-emerald-100 text-sm mt-0.5">
                  {editingDepartment
                    ? 'Update the department information below'
                    : 'Add a new academic department to the system'}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Two-Column Form Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-1 max-h-[65vh] overflow-y-auto">
            {/* Left Column - Department Details */}
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Department Details
                </h4>
              </div>

              {/* Department Code */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  Department Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="e.g., IICT, IBOA"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="uppercase bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  maxLength={10}
                />
              </div>

              {/* Department Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  Department Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Institute of Information and Communication Technology"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the department..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  maxLength={500}
                  className="resize-none bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {/* Right Column - Assignments (only when editing) */}
            <div className="space-y-4">
              {editingDepartment ? (
                <>
                  {/* Assigned Programs Section */}
                  <div className="pb-3 border-b border-slate-100">
                    <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      Assigned Programs
                    </h4>
                  </div>
                  <div className="max-h-[140px] overflow-y-auto">
                    {getDepartmentPrograms(editingDepartment.id).length > 0 ? (
                      <div className="space-y-2">
                        {getDepartmentPrograms(editingDepartment.id).map((program) => (
                          <div
                            key={program.id}
                            className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                              <div>
                                <span className="text-sm font-medium text-slate-900">{program.name}</span>
                                <Badge variant="secondary" className="text-xs ml-1.5">
                                  {program.code}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openRemoveProgramDialog(program)}
                              className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Remove from department"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic py-3 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                        No programs assigned yet
                      </div>
                    )}
                  </div>

                  {/* Assigned Professors Section */}
                  <div className="pt-2">
                    <div className="pb-3 border-b border-slate-100">
                      <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Assigned Professors
                      </h4>
                    </div>
                    <div className="max-h-[140px] overflow-y-auto">
                      {getDepartmentProfessors(editingDepartment.id).length > 0 ? (
                        <div className="space-y-2">
                          {getDepartmentProfessors(editingDepartment.id).map((professor) => (
                            <div
                              key={professor.id}
                              className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <span className="text-sm font-medium text-slate-900">{professor.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openRemoveProfessorDialog(professor)}
                                className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Remove from department"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic py-3 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                          No professors assigned yet
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Info Box for Create Mode */}
                  <div className="pb-3 border-b border-slate-100">
                    <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-emerald-600" />
                      Quick Guide
                    </h4>
                  </div>

                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/50">
                    <h5 className="text-sm font-semibold text-slate-700 mb-3">Creating a Department</h5>
                    <ul className="text-xs text-slate-600 space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                        Enter a unique department code (e.g., IICT)
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                        Provide the full department name
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                        Add an optional description
                      </li>
                    </ul>
                  </div>

                  <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200/50">
                    <h5 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Note
                    </h5>
                    <p className="text-xs text-amber-700">
                      After creating the department, you can assign programs and professors through the edit dialog.
                    </p>
                  </div>
                </>
              )}
            </div>
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
              onClick={saveDepartment}
              className="px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200"
            >
              {editingDepartment ? 'Update Department' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl max-w-md">
          <div className="flex items-start gap-4 pt-2">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <AlertDialogHeader className="text-left p-0 mb-0">
                <AlertDialogTitle className="text-xl font-bold text-slate-900">Delete Department?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 mt-2">
                  Are you sure you want to delete <span className="font-semibold text-slate-900">&quot;{deletingDepartment?.name}&quot;</span>?
                  This action cannot be undone and may affect assigned programs and professors.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>
          <AlertDialogFooter className="mt-6 pt-4 border-t border-slate-100 gap-3">
            <AlertDialogCancel className="px-6 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="px-6 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-500/25 transition-all duration-200"
            >
              Delete Department
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Program Confirmation Dialog */}
      <AlertDialog open={removeProgramDialogOpen} onOpenChange={setRemoveProgramDialogOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl max-w-md">
          <div className="flex items-start gap-4 pt-2">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <AlertDialogHeader className="text-left p-0 mb-0">
                <AlertDialogTitle className="text-xl font-bold text-slate-900">Remove Program?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 mt-2">
                  Remove <span className="font-semibold text-slate-900">&quot;{removingProgram?.name}&quot;</span> ({removingProgram?.code}) from this department?
                  The program will no longer be associated with this department.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>
          <AlertDialogFooter className="mt-6 pt-4 border-t border-slate-100 gap-3">
            <AlertDialogCancel className="px-6 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveProgram}
              className="px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all duration-200"
            >
              Remove Program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Professor Confirmation Dialog */}
      <AlertDialog open={removeProfessorDialogOpen} onOpenChange={setRemoveProfessorDialogOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl max-w-md">
          <div className="flex items-start gap-4 pt-2">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <AlertDialogHeader className="text-left p-0 mb-0">
                <AlertDialogTitle className="text-xl font-bold text-slate-900">Remove Professor?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 mt-2">
                  Remove <span className="font-semibold text-slate-900">&quot;{removingProfessor?.name}&quot;</span> from this department?
                  The professor will no longer be associated with this department.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>
          <AlertDialogFooter className="mt-6 pt-4 border-t border-slate-100 gap-3">
            <AlertDialogCancel className="px-6 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveProfessor}
              className="px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all duration-200"
            >
              Remove Professor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
