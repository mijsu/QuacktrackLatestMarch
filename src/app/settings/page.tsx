'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Settings, Database, Loader2, CheckCircle, Save, Trash2, RefreshCw, AlertTriangle, Users, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { dispatchSettingsChanged } from '@/lib/utils';

interface SystemSettings {
  id: string;
  systemName: string;
  academicYear: string;
  currentSemester: number;
}

interface ExistingData {
  departments: number;
  programs: number;
  professors: number;
  subjects: number;
  sections: number;
  hasData: boolean;
}

export default function SettingsPage() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [existingData, setExistingData] = useState<ExistingData | null>(null);

  const [formData, setFormData] = useState({
    systemName: '',
    academicYear: '',
    currentSemester: 1,
  });

  useEffect(() => {
    fetchSettings();
    fetchExistingData();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setFormData({
          systemName: data.settings.systemName,
          academicYear: data.settings.academicYear,
          currentSemester: data.settings.currentSemester,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingData = async () => {
    try {
      const res = await fetch('/api/seed');
      const data = await res.json();
      if (data.success) {
        setExistingData(data.existingData);
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const handleClearDatabase = async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/seed', {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setSeeded(false);
        setSeedResult(null);
        setExistingData(null);
        toast({
          title: 'Database Cleared',
          description: `Successfully deleted ${data.deleted} documents.`,
        });
        // Refresh existing data
        fetchExistingData();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to clear database',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear database',
        variant: 'destructive',
      });
    } finally {
      setClearing(false);
      setShowClearConfirm(false);
    }
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        setSeeded(true);
        setSeedResult(data.data);
        toast({
          title: 'Database Seeded',
          description: `Added ${data.data.subjects} subjects, ${data.data.programs} programs, ${data.data.sections} sections, ${data.data.departments} departments, and ${data.data.professors} professors.`,
        });
        // Refresh existing data
        fetchExistingData();
      } else if (data.existingData) {
        toast({
          title: 'Database Already Has Data',
          description: 'Please clear the database first before seeding.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to seed database',
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
      setShowSeedConfirm(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSettings(data.settings);
        dispatchSettingsChanged();
        toast({
          title: 'Settings Saved',
          description: 'System settings updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
            <p className="text-slate-600">Configure system preferences and manage data</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Seed Database Card */}
          <Card className="bg-white/60 backdrop-blur-md border border-emerald-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Database className="w-5 h-5 text-emerald-600" />
                Database Management
              </CardTitle>
              <CardDescription className="text-slate-600">
                Populate the database with sample data for testing the auto-generate schedule feature.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Data Status */}
              {existingData && existingData.hasData && (
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/50">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Current Database Status</h4>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-slate-200/50 text-center">
                      <Building2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{existingData.departments}</p>
                      <p className="text-xs text-slate-500">Departments</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-200/50 text-center">
                      <GraduationCap className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{existingData.programs}</p>
                      <p className="text-xs text-slate-500">Programs</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-200/50 text-center">
                      <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{existingData.professors}</p>
                      <p className="text-xs text-slate-500">Professors</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-200/50 text-center">
                      <BookOpen className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{existingData.subjects}</p>
                      <p className="text-xs text-slate-500">Subjects</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-200/50 text-center">
                      <Database className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{existingData.sections}</p>
                      <p className="text-xs text-slate-500">Sections</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Seed Configuration */}
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/50">
                <h4 className="text-sm font-semibold text-amber-800 mb-2">Seed Configuration</h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white border-amber-200 text-amber-700">2</Badge>
                    <span className="text-slate-600">Departments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white border-amber-200 text-amber-700">4</Badge>
                    <span className="text-slate-600">Programs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white border-amber-200 text-amber-700">60</Badge>
                    <span className="text-slate-600">Professors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white border-amber-200 text-amber-700">240</Badge>
                    <span className="text-slate-600">Sections</span>
                  </div>
                </div>
                <p className="text-xs text-amber-700 mt-2">
                  IICT (BSIT, BSCS) & IBOA (BSOA, BSBA) • 288 subjects (72 per program)
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Constraints: 36 hrs/professor/week, 8 hrs/day max. School hours: 7 AM - 9 PM.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Expected output: ~524 schedules at 98% utilization (2,114 teaching hours).
                </p>
              </div>

              {/* Seed Result */}
              {seeded && seedResult && (
                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/50">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold">Database Seeded Successfully</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div><span className="font-medium">{seedResult.departments}</span> departments</div>
                    <div><span className="font-medium">{seedResult.programs}</span> programs</div>
                    <div><span className="font-medium">{seedResult.professors}</span> professors</div>
                    <div><span className="font-medium">{seedResult.subjects}</span> subjects</div>
                    <div><span className="font-medium">{seedResult.sections}</span> sections</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => setShowClearConfirm(true)}
                  disabled={clearing || !existingData?.hasData}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  {clearing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Database
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setShowSeedConfirm(true)}
                  disabled={seeding || seeded || existingData?.hasData}
                  className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-semibold backdrop-blur-md border border-yellow-300/50 shadow-lg shadow-yellow-500/20 transition-all duration-200"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Seeding...
                    </>
                  ) : existingData?.hasData ? (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Clear First to Seed
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Seed Database
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Configuration Card */}
          <Card className="bg-white/60 backdrop-blur-md border border-emerald-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">System Configuration</CardTitle>
              <CardDescription className="text-slate-600">
                Configure global system settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="systemName">System Name</Label>
                    <Input
                      id="systemName"
                      placeholder="e.g., PTC QuackTrack"
                      value={formData.systemName}
                      onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academicYear">Academic Year</Label>
                      <Input
                        id="academicYear"
                        placeholder="e.g., 2024-2025"
                        value={formData.academicYear}
                        onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentSemester">Current Semester</Label>
                      <Select
                        value={formData.currentSemester.toString()}
                        onValueChange={(value) => setFormData({ ...formData, currentSemester: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">First Semester</SelectItem>
                          <SelectItem value="2">Second Semester</SelectItem>
                          <SelectItem value="3">Summer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-semibold backdrop-blur-md border border-yellow-300/50 shadow-lg shadow-yellow-500/20 transition-all duration-200"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Clear Database Confirmation Dialog */}
        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl max-w-md">
            <div className="flex items-start gap-4 pt-2">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <AlertDialogHeader className="text-left p-0 mb-0">
                  <AlertDialogTitle className="text-xl font-bold text-slate-900">Clear All Data?</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="text-slate-600 mt-2">
                  <p>This will permanently delete all data including:</p>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Departments</li>
                    <li>Programs</li>
                    <li>Professors</li>
                    <li>Subjects</li>
                    <li>Sections</li>
                    <li>Schedules</li>
                  </ul>
                  <p className="mt-2 text-red-600 font-medium">This action cannot be undone.</p>
                </div>
              </div>
            </div>
            <AlertDialogFooter className="mt-6 pt-4 border-t border-slate-100 gap-3">
              <AlertDialogCancel className="px-6 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearDatabase}
                className="px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg shadow-red-500/25 transition-all duration-200"
              >
                Clear All Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Seed Database Confirmation Dialog */}
        <AlertDialog open={showSeedConfirm} onOpenChange={setShowSeedConfirm}>
          <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl max-w-md">
            <div className="flex items-start gap-4 pt-2">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <AlertDialogHeader className="text-left p-0 mb-0">
                  <AlertDialogTitle className="text-xl font-bold text-slate-900">Seed Database?</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="text-slate-600 mt-2">
                  <p>This will populate the database with sample data:</p>
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li><span className="font-semibold">2</span> Departments (IICT, IBOA)</li>
                    <li><span className="font-semibold">4</span> Programs (BSIT, BSCS, BSOA, BSBA)</li>
                    <li><span className="font-semibold">60</span> Professors (30 per department)</li>
                    <li><span className="font-semibold">288</span> Subjects (9 per semester × 8 semesters × 4 programs)</li>
                    <li><span className="font-semibold">240</span> Sections (60 per program)</li>
                  </ul>
                  <p className="mt-2 text-xs text-amber-600">Constraints: 36 hrs/professor/week, 8 hrs/day. School hours: 7 AM - 9 PM.</p>
                  <p className="mt-1 text-xs text-amber-600">Expected: ~524 schedules at 98% utilization (~2,114 teaching hours)</p>
                </div>
              </div>
            </div>
            <AlertDialogFooter className="mt-6 pt-4 border-t border-slate-100 gap-3">
              <AlertDialogCancel className="px-6 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSeedDatabase}
                className="px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all duration-200"
              >
                Seed Database
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
