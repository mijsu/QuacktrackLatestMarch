'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupProfessorId, setSignupProfessorId] = useState('');
  const [signupRole, setSignupRole] = useState<'admin' | 'professor'>('professor');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(loginEmail, loginPassword);

    if (result.success && result.user) {
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      // Redirect based on user role
      if (result.user.role === 'professor') {
        router.push('/my-schedule');
      } else {
        router.push('/');
      }
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Login failed',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const result = await signup(signupEmail, signupPassword, signupName, signupRole, signupProfessorId);

    if (result.success && result.user) {
      toast({
        title: 'Success',
        description: 'Account created successfully',
      });
      // Redirect based on user role
      if (result.user.role === 'professor') {
        router.push('/my-schedule');
      } else {
        router.push('/');
      }
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Signup failed',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full mb-4 shadow-lg ring-4 ring-yellow-400/30">
            <img src="/logo.png" alt="PTC Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white">PTC QuackTrack</h1>
          <p className="text-emerald-100 mt-2">Professional University Schedule Management</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-md border border-white/20">
            <TabsTrigger value="login" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80">Login</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Welcome Back</CardTitle>
                <CardDescription className="text-emerald-100">Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your.email@university.edu"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-semibold backdrop-blur-md border border-yellow-300/50 shadow-lg shadow-yellow-500/20 transition-all duration-200" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Create Account</CardTitle>
                <CardDescription className="text-emerald-100">Sign up to get started with PTC QuackTrack</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Dr. John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@university.edu"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <select
                      id="signup-role"
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value as 'admin' | 'professor')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="professor">Professor</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  {signupRole === 'professor' && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-professor-id">Professor ID</Label>
                      <Input
                        id="signup-professor-id"
                        type="text"
                        placeholder="e.g., PROF-2024-001"
                        value={signupProfessorId}
                        onChange={(e) => setSignupProfessorId(e.target.value)}
                      />
                      <p className="text-xs text-slate-500">Your unique professor identifier</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-semibold backdrop-blur-md border border-yellow-300/50 shadow-lg shadow-yellow-500/20 transition-all duration-200" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
