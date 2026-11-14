'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ROLE_LABELS } from '@/types/agency';

const loginSchema = z.object({
  email: z.string().email('Enter a valid agency or client email address'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { users, signInWithEmail, switchPersona } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'elena@agencycore.io' },
  });

  const onSubmit = (data: LoginFormValues) => {
    setAuthError(null);
    const ok = signInWithEmail(data.email);
    if (ok) {
      router.push('/');
    } else {
      setAuthError('No account found for that email. Use one of the RBAC demo accounts below.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950 font-bold text-base shadow-lg">
            AC
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-white">
            Sign in to AgencyCore
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Role-Based Agency Operations &amp; Project Lifecycle Hub
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-zinc-400" />
              Workspace Authentication
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Sign in with your agency email or select an RBAC persona below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <Input
                  type="email"
                  placeholder="name@agencycore.io"
                  className="border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-500"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.email.message}
                  </p>
                )}
                {authError && (
                  <p className="mt-1 text-xs text-red-400">{authError}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-white text-zinc-950 hover:bg-zinc-200"
              >
                Continue with Email
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-zinc-900 px-2 text-zinc-500">
                  Quick RBAC Persona Login
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    switchPersona(u.id);
                    router.push('/');
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-left hover:border-zinc-700 hover:bg-zinc-950 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-medium text-white">
                      {u.name}
                    </div>
                    <div className="text-[11px] text-zinc-400">{u.email}</div>
                  </div>
                  <Badge variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-200">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
