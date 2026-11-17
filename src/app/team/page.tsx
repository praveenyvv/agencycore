'use client';

import React, { useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      password: password.trim() || undefined,
    });

    setIsAddOpen(false);
    setName('');
    setEmail('');
    setTitle('Co-Founder & Admin');
    setPassword('');
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
    <div className="space-y-6 max-w-5xl">
      {/* 1. Page Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#111827] tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-[#4361ee]" />
            Founders &amp; Admins Hub
          </h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">
            Operations are managed exclusively by Founders &amp; Admins. All accounts share the same live synchronized workspace.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="h-[36px] px-4 rounded-[8px] bg-[#4361ee] hover:bg-[#3451d1] text-white shadow-[0_2px_6px_rgba(67,97,238,0.25)] text-[13px] font-medium gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Founder / Admin
        </Button>
      </div>

      {/* 2. Tinted Info Banner */}
      <div className="rounded-[12px] bg-gradient-to-r from-[#eef0fd] to-[#e8f0fe] border border-[rgba(67,97,238,0.18)] p-4">
        <div className="flex items-start gap-3">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#4361ee] text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-[12px]">
            <div className="font-bold text-[#111827] flex items-center gap-2">
              <span>Full Administrative Access &amp; Real-time Data Sync</span>
              <span className="rounded-[20px] bg-[#dbeafe] px-2 py-0.5 text-[10.5px] font-semibold text-[#1d4ed8]">
                Founders Only
              </span>
            </div>
            <p className="text-[#6b7280] leading-relaxed">
              Every founder has complete control over projects, renewals, client meetings, proposals, task execution, encrypted credentials, and financial invoices. Any update made by one founder is immediately visible to everyone.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Admin Directory Card */}
      <div className="rounded-[12px] bg-white border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#e5e7eb]">
          <h2 className="text-[15px] font-bold text-[#111827]">
            Active Founders &amp; Admins ({users.length})
          </h2>
          <span className="text-[12px] text-[#9ca3af]">
            Current: <strong className="text-[#111827]">{currentUser.name}</strong>
          </span>
        </div>

        <div className="divide-y divide-[#e5e7eb]">
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
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-[#fafbff] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-[40px] h-[40px] rounded-full bg-[#4361ee] text-white font-bold text-[13px] flex items-center justify-center shrink-0 shadow-xs">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-[#111827]">
                        {u.name}
                      </span>
                      {isCurrent && (
                        <span className="rounded-[20px] bg-[#f3f4f6] px-2 py-0.5 text-[10.5px] font-semibold text-[#4b5563]">
                          You
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[20px] text-[11px] font-semibold bg-[#d1fae5] text-[#065f46]">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Founder &amp; Admin
                      </span>
                    </div>
                    <div className="text-[12px] text-[#6b7280] mt-0.5">
                      {u.email} · {u.title || 'Co-Founder & Admin'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setChangingPassUser(u);
                      setNewPassword('');
                      setConfirmPassword('');
                      setPassError('');
                      setPassSuccess(false);
                    }}
                    className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[7px] border border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#4361ee] hover:text-[#4361ee] text-[12px] font-medium transition-colors cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Change Password
                  </button>

                  {!isCurrent && (
                    <button
                      onClick={() => switchPersona(u.id)}
                      className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[7px] bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb] hover:text-[#111827] text-[12px] font-medium transition-colors cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Switch To
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add New Founder / Admin */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px] p-4 animate-fade-up">
          <div className="w-full max-w-[460px] rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#4361ee]" />
                <h3 className="text-[15px] font-bold text-[#111827]">
                  Add New Founder / Admin
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-7 h-7 rounded-[6px] text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin}>
              <div className="p-6 space-y-3.5">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                    Full Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-[36px] text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                    Email Address *
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="ramesh@holabusiness.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-[36px] text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                    Title / Position
                  </label>
                  <Input
                    placeholder="Co-Founder & Admin"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-[36px] text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                    Temporary Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Leave blank for default: admin123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-[36px] text-[13px] pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111827]"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 border-t border-[#e5e7eb] bg-[#fafafa] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="h-[36px] px-4 text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-[36px] px-5 rounded-[8px] bg-[#4361ee] hover:bg-[#3451d1] text-white text-[13px]"
                >
                  Create Admin
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {changingPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px] p-4 animate-fade-up">
          <div className="w-full max-w-[420px] rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#4361ee]" />
                <h3 className="text-[15px] font-bold text-[#111827]">
                  Change Password for {changingPassUser.name}
                </h3>
              </div>
              <button
                onClick={() => setChangingPassUser(null)}
                className="w-7 h-7 rounded-[6px] text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="p-6 space-y-3.5">
                {passError && (
                  <div className="rounded-[8px] bg-[#fef2f2] border border-[#fca5a5] p-2 text-[12px] text-[#ef4444]">
                    {passError}
                  </div>
                )}
                {passSuccess && (
                  <div className="rounded-[8px] bg-[#ecfdf5] border border-[#bbf7d0] p-2 text-[12px] text-[#065f46] flex items-center gap-1.5">
                    <Check className="h-4 w-4" />
                    Password updated successfully!
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                    New Password (min 4 characters)
                  </label>
                  <Input
                    required
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="h-[36px] text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                    Confirm New Password
                  </label>
                  <Input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="h-[36px] text-[13px]"
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 border-t border-[#e5e7eb] bg-[#fafafa] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setChangingPassUser(null)}
                  className="h-[36px] px-4 text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-[36px] px-5 rounded-[8px] bg-[#4361ee] hover:bg-[#3451d1] text-white text-[13px]"
                >
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
