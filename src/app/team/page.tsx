'use client';

import React, { useState } from 'react';
import {
  Check,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ROLE_LABELS, type User } from '@/types/agency';

export default function TeamPage() {
  const { currentUser, users, createAdminUser, changeUserPassword, switchPersona } =
    useAuth();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [changingPassUser, setChangingPassUser] = useState<User | null>(null);

  // Add User Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('Co-Founder & Admin');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Change Password Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    createAdminUser({
      name: name.trim(),
      email: email.trim(),
      title: title.trim() || 'Co-Founder & Admin',
      password: password.trim() || 'admin',
    });

    setName('');
    setEmail('');
    setTitle('Co-Founder & Admin');
    setPassword('');
    setIsAddOpen(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    if (newPassword.length < 4) {
      setPassError('Password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match.');
      return;
    }

    if (changingPassUser) {
      changeUserPassword(changingPassUser.id, newPassword);
      setPassSuccess(true);
      setTimeout(() => {
        setChangingPassUser(null);
        setNewPassword('');
        setConfirmPassword('');
        setPassSuccess(false);
      }, 1000);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-zinc-900" />
            Founders &amp; Admins Hub
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Agency operations are restricted exclusively to Founders &amp; Admins. All accounts share the same live synchronized workspace.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="cursor-pointer gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Add Founder / Admin
        </Button>
      </div>

      {/* ── Shared Synchronization Banner ── */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-emerald-950 flex items-center gap-2">
              <span>Full Administrative Access &amp; Real-time Data Sync</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Founders Only
              </span>
            </div>
            <p className="text-emerald-800 leading-relaxed text-[11.5px]">
              Every admin has complete unrestricted control over all projects, client meetings, proposals, task execution, encrypted credentials, and financial invoices. There are no client portals or isolated silos—every founder sees live updates made by any other founder.
            </p>
          </div>
        </div>
      </div>

      {/* ── Admin Directory Card ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm">
            Active Founders &amp; Admins ({users.length})
          </CardTitle>
          <span className="text-xs text-zinc-400">
            Current session: <strong className="text-zinc-800">{currentUser.name}</strong>
          </span>
        </CardHeader>
        <CardContent className="divide-y divide-zinc-100">
          {users.map((u) => {
            const isCurrent = u.id === currentUser.id;
            const initials = u.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white shadow-2xs">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">
                        {u.name}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                          You
                        </span>
                      )}
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {ROLE_LABELS[u.role] || 'Founder & Admin'}
                      </Badge>
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {u.email} · {u.title || 'Co-Founder & Admin'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setChangingPassUser(u);
                      setNewPassword('');
                      setConfirmPassword('');
                      setPassError('');
                      setPassSuccess(false);
                    }}
                    className="cursor-pointer text-xs gap-1"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Change Password
                  </Button>

                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => switchPersona(u.id)}
                      className="cursor-pointer text-xs gap-1"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Switch To
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Modal: Add New Founder / Admin ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Add New Founder / Admin
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Email / Username *
                </label>
                <Input
                  required
                  type="email"
                  placeholder="ramesh@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Title *
                </label>
                <Input
                  required
                  placeholder="e.g. Technical Co-Founder & CTO"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 flex items-center justify-between">
                  <span>Initial Password *</span>
                  <span className="text-[10px] text-zinc-400">Can be changed later</span>
                </label>
                <div className="relative">
                  <Input
                    required
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter login password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 pr-8 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-2.5 text-[11px] text-zinc-500">
                <Lock className="inline-block h-3 w-3 mr-1 text-zinc-400" />
                This admin receives full administrative privileges and instant synchronization with all agency projects.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Create Admin
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Change Password ── */}
      {changingPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Change Password
                </h3>
              </div>
              <button
                onClick={() => setChangingPassUser(null)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
              <p className="text-xs text-zinc-500">
                Updating password for <strong className="text-zinc-800">{changingPassUser.name}</strong> ({changingPassUser.email}).
              </p>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  New Password *
                </label>
                <Input
                  required
                  type="password"
                  placeholder="Min 4 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Confirm New Password *
                </label>
                <Input
                  required
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {passError && (
                <p className="text-[11px] text-red-600 font-medium">{passError}</p>
              )}

              {passSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <Check className="h-3.5 w-3.5" /> Password updated successfully!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setChangingPassUser(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
