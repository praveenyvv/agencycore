'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_LABELS } from '@/types/agency';

export default function TeamPage() {
  const { currentUser, users, permissions } = useAuth();

  if (currentUser.role !== 'admin' && currentUser.role !== 'pm') {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="pt-6 space-y-2">
            <ShieldAlert className="mx-auto h-8 w-8 text-red-600" />
            <h2 className="text-sm font-semibold text-red-900">
              Access Denied (RBAC Protected)
            </h2>
            <p className="text-xs text-red-700">
              Only Admin / Founder and Project Manager roles can view and manage
              team permissions. Current role: {ROLE_LABELS[currentUser.role]}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team &amp; Role-Based Access Control
          </h1>
          <p className="text-xs text-zinc-500">
            {permissions.canManageUsers
              ? 'Admin mode: you can manage user roles and project assignments.'
              : 'PM mode: read-only directory view (Admin required to change roles).'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-zinc-100">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div>
                <div className="text-sm font-medium text-zinc-900">{u.name}</div>
                <div className="text-xs text-zinc-500">
                  {u.email} · {u.title}
                </div>
              </div>
              <Badge variant="outline">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                {ROLE_LABELS[u.role]}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
