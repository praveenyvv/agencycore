'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { users, signInWithCredentials } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'elena@holabusiness.io',
      password: 'admin',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setAuthError(null);
    const res = signInWithCredentials(data.email, data.password);
    if (res.success) {
      router.push('/');
    } else {
      setAuthError(res.error || 'Invalid email or password. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa] px-4 py-12">
      <div className="w-full max-w-[420px] rounded-[16px] bg-white p-8 sm:p-10 shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#e5e7eb] space-y-6">
        {/* Logo Block */}
        <div className="flex items-center gap-2.5 justify-center">
          <div className="w-[42px] h-[42px] rounded-[10px] bg-[#4361ee] text-white font-bold text-[18px] flex items-center justify-center shadow-[0_2px_6px_rgba(67,97,238,0.25)]">
            HB
          </div>
          <div>
            <div className="text-[20px] font-bold text-[#111827] leading-none">
              HolaBusiness
            </div>
            <div className="text-[11px] text-[#6b7280] mt-0.5">
              Agency Operations OS
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[22px] font-bold text-[#111827]">
            Sign in
          </h2>
          <p className="text-[13px] text-[#6b7280] mt-1">
            Access your synchronized founder operations workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {authError && (
            <div className="rounded-[8px] bg-red-50 p-3 text-[12px] text-red-600 border border-red-200">
              {authError}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="name@holabusiness.io"
              className="h-[38px] text-[13px]"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-[11px] text-[#ef4444]">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                className="h-[38px] pr-10 text-[13px]"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-[#ef4444]">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-[40px] rounded-[8px] bg-[#4361ee] hover:bg-[#3451d1] text-white font-medium text-[13px] shadow-[0_2px_6px_rgba(67,97,238,0.25)] gap-2"
          >
            <span>Sign In to Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#e5e7eb]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
            <span className="bg-white px-2.5 text-[#9ca3af]">
              Authorized Founder Accounts
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                setValue('email', u.email);
                setValue('password', u.password || 'admin');
              }}
              className="flex w-full items-center justify-between rounded-[8px] border border-[#e5e7eb] bg-white p-2.5 text-left hover:border-[#4361ee] hover:bg-[#fafbff] transition-all cursor-pointer"
            >
              <div>
                <div className="text-[13px] font-semibold text-[#111827]">
                  {u.name}
                </div>
                <div className="text-[11px] text-[#9ca3af]">{u.email}</div>
              </div>
              <div className="flex items-center gap-1.5">
                {u.is_main_admin ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[20px] text-[10.5px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Main Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[20px] text-[10.5px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Admin
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
