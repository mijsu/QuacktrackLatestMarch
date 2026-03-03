'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Users, Plus, Edit2, Trash2, Loader2, Search, Briefcase, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Department } from '@/lib/types';

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [professorToDelete, setProfessorToDelete] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    professorId: '',
    specialization: '',
    departmentIds: [] as string[],
  });

  useEffect(() => {
    fetchProfessors();
    fetchDepartments();
  }, []);

  const fetchProfessors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/professors');
      const data = await res.json();
      setProfessors(data.professors || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch professors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const openCreateDialog = () => {
    setEditingProfessor(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      professorId: '',
      specialization: '',
      departmentIds: [] as string[],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (professor: any) => {
    setEditingProfessor(professor);
    setFormData({
      name: professor.name,
      email: professor.email,
      password: '',
      professorId: professor.professorId || '',
      specialization: professor.specialization || '',
      departmentIds: professor.departmentIds || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || formData.name.trim() === '') {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email || formData.email.trim() === '') {
      toast({
        title: 'Validation Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    // For new professors, password is required
    if (!editingProfessor && (!formData.password || formData.password.trim() === '')) {
      toast({
        title: 'Validation Error',
        description: 'Password is required for new professors',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const method = editingProfessor ? 'PUT' : 'POST';
      const url = editingProfessor ? `/api/professors/${editingProfessor.id}` : '/api/professors';

      console.log('Submitting professor data:', formData);
      console.log('Method:', method);
      console.log('URL:', url);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log('Response:', data);

      if (data.success) {
        toast({
          title: 'Success',
          description: editingProfessor ? 'Professor updated successfully' : 'Professor created successfully',
        });
        setDialogOpen(false);
        fetchProfessors();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save professor',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: 'Error',
        description: 'Failed to save professor',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (professor: any) => {
    setProfessorToDelete(professor);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!professorToDelete) return;

    try {
      const res = await fetch(`/api/professors/${professorToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Professor deleted successfully',
        });
        fetchProfessors();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete professor',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete professor',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteConfirm(false);
      setProfessorToDelete(null);
    }
  };

  // Filter professors based on search query
  const filteredProfessors = professors.filter((professor) => {
    const query = searchQuery.toLowerCase();

    // Get department names for this professor
    const profDepts: string[] = professor.departmentIds
      ? professor.departmentIds.map(id => {
          const dept = departments.find(d => d.id === id);
          return dept ? dept.name.toLowerCase() : '';
        }).filter(name => name !== '')
      : [];

    const matchesQuery =
      professor.name.toLowerCase().includes(query) ||
      professor.email.toLowerCase().includes(query) ||
      (professor.specialization && professor.specialization.toLowerCase().includes(query)) ||
      profDepts.some(deptName => deptName.includes(query));

    return matchesQuery;
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Professors Management</h1>
              <p className="text-slate-600">Manage faculty and instructor accounts</p>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-semibold backdrop-blur-md border border-yellow-300/50 shadow-lg shadow-yellow-500/20 transition-all duration-200">
            <Plus className="w-4 h-4 mr-2" />
            Add Professor
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search professors by name, email, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card className="bg-white/60 backdrop-blur-md border border-emerald-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">All Professors</CardTitle>
            <CardDescription className="text-slate-600">
              {searchQuery ? (
                <>
                  Showing {filteredProfessors.length} of {professors.length} {professors.length === 1 ? 'professor' : 'professors'}
                  {filteredProfessors.length === 0 && ' matching your search'}
                </>
              ) : (
                <>{professors.length} {professors.length === 1 ? 'professor' : 'professors'} in the system</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : filteredProfessors.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>{searchQuery ? 'No professors found matching your search.' : 'No professors yet. Click "Add Professor" to create one.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfessors.map((professor) => (
                  <Card key={professor.id} className="border border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={professor.avatar} alt={professor.name} />
                          <AvatarFallback>{professor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(professor)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(professor)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-slate-900">{professor.name}</h3>
                        <p className="text-sm text-slate-600">{professor.email}</p>
                        {professor.professorId && (
                          <p className="text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
                            ID: {professor.professorId}
                          </p>
                        )}
                        {professor.specialization && (
                          <p className="text-xs text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">
                            {professor.specialization}
                          </p>
                        )}
                        {professor.departmentIds && professor.departmentIds.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {professor.departmentIds.map((deptId) => {
                              const dept = departments.find(d => d.id === deptId);
                              return dept ? (
                                <span key={dept.id} className="text-xs bg-emerald-600 text-white px-2 py-1 rounded-full">
                                  {dept.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    {editingProfessor ? 'Edit Professor' : 'Create New Professor'}
                  </DialogTitle>
                  <DialogDescription className="text-emerald-100 text-sm mt-0.5">
                    {editingProfessor ? 'Update the professor information below' : 'Add a new faculty member account'}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Two-Column Form Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-1">
              {/* Left Column - Account Details */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Account Details
                  </h4>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Dr. John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                {/* Professor ID */}
                <div className="space-y-2">
                  <Label htmlFor="professorId" className="text-sm font-semibold text-slate-700">Professor ID</Label>
                  <Input
                    id="professorId"
                    placeholder="e.g., PROF-2024-001"
                    value={formData.professorId}
                    onChange={(e) => setFormData({ ...formData, professorId: e.target.value })}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  />
                  <p className="text-xs text-slate-500">Unique identifier</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="professor@university.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    Password {!editingProfessor && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  />
                  {editingProfessor && (
                    <p className="text-xs text-slate-500">Leave empty to keep current</p>
                  )}
                </div>
              </div>

              {/* Right Column - Professional Information */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    Professional Info
                  </h4>
                </div>

                {/* Specialization */}
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-sm font-semibold text-slate-700">Specialization</Label>
                  <Input
                    id="specialization"
                    placeholder="e.g., Algorithms & Data Structures"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                {/* Departments */}
                <div className="space-y-2">
                  <Label htmlFor="departments" className="text-sm font-semibold text-slate-700">Department Assignment</Label>
                  <Select
                    value={formData.departmentIds[0] || ''}
                    onValueChange={(value) => {
                      // Toggle the department
                      const existingIndex = formData.departmentIds.indexOf(value);
                      if (existingIndex > -1) {
                        // Remove it
                        setFormData({
                          ...formData,
                          departmentIds: formData.departmentIds.filter(id => id !== value)
                        });
                      } else {
                        // Add it
                        setFormData({
                          ...formData,
                          departmentIds: [...formData.departmentIds, value]
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="departments" className="bg-slate-50/50 border-slate-200 focus:ring-emerald-500/20">
                      <SelectValue placeholder="Select departments..." />
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

                  {/* Selected Departments Display */}
                  {formData.departmentIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.departmentIds.map((deptId) => {
                        const dept = departments.find(d => d.id === deptId);
                        return dept ? (
                          <Badge
                            key={deptId}
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer"
                            onClick={() => setFormData({
                              ...formData,
                              departmentIds: formData.departmentIds.filter(id => id !== deptId)
                            })}
                          >
                            {dept.code}
                            <span className="ml-1 text-emerald-500">×</span>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/50 mt-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-emerald-600" />
                    Quick Tips
                  </h5>
                  <ul className="text-xs text-slate-600 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                      Professors can be assigned to multiple departments
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                      Email is used for login authentication
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                      Specialization helps with schedule assignments
                    </li>
                  </ul>
                </div>
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
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingProfessor ? 'Update Professor' : 'Create Professor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl max-w-md">
            <div className="flex items-start gap-4 pt-2">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <AlertDialogHeader className="text-left p-0 mb-0">
                  <AlertDialogTitle className="text-xl font-bold text-slate-900">Delete Professor?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600 mt-2">
                    Are you sure you want to delete <strong>{professorToDelete?.name}</strong>? This action cannot be undone.
                    {professorToDelete && (
                      <span className="block mt-2 text-xs text-amber-600">
                        Note: Any schedules assigned to this professor may need to be regenerated.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
            </div>
            <AlertDialogFooter className="mt-6 pt-4 border-t border-slate-100 gap-3">
              <AlertDialogCancel className="px-6 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg shadow-red-500/25 transition-all duration-200"
              >
                Delete Professor
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
