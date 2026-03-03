'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { User, Loader2, CheckCircle, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    professorId: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        professorId: (user as any).professorId || '',
      });
      setLoading(false);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/professors/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Update localStorage directly with the new user data
        const updatedUser = {
          ...user,
          name: data.professor.name,
          avatar: data.professor.avatar,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Trigger a page re-render to reflect the changes
        window.location.reload();

        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-600">View and update your profile information</p>
          </div>
        </div>

        <div className="space-y-6 max-w-2xl">
          {/* Profile Card */}
          <Card className="bg-white/60 backdrop-blur-md border border-emerald-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Profile Information</CardTitle>
              <CardDescription className="text-slate-600">
                Update your personal information. Contact your administrator to change your email or professor ID.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Display */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200/30">
                <Avatar className="w-20 h-20 ring-4 ring-white shadow-lg">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-emerald-900 text-2xl font-semibold">
                    {user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900">Current Profile Picture</p>
                  <p className="text-xs text-slate-600">Generated from your name</p>
                </div>
              </div>

              {/* Read-Only Fields with Badge */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">Administrator Only Fields</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="professorId">Professor ID</Label>
                    <Input
                      id="professorId"
                      value={formData.professorId || 'Not assigned'}
                      readOnly
                      disabled
                      className="bg-slate-50 text-slate-600 cursor-not-allowed border-slate-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      readOnly
                      disabled
                      className="bg-slate-50 text-slate-600 cursor-not-allowed border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="bg-white/80"
                />
                <p className="text-xs text-slate-500">
                  This name will be displayed throughout the system
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-semibold backdrop-blur-md border border-yellow-300/50 shadow-lg shadow-yellow-500/20 transition-all duration-200 w-full md:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card className="bg-white/60 backdrop-blur-md border border-emerald-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Account Details</CardTitle>
              <CardDescription className="text-slate-600">
                Your account information and role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-600">Role</Label>
                  <p className="text-sm font-medium text-slate-900 capitalize mt-1">
                    {user?.role}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Account Created</Label>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
