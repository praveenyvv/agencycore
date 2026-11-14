'use client';

import React from 'react';
import { Archive, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuditArchivePage() {
  const { permissions, accessibleProjects } = useAuth();

  if (!permissions.canViewAuditLogs) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="pt-6 space-y-2">
            <ShieldAlert className="mx-auto h-8 w-8 text-red-600" />
            <h2 className="text-sm font-semibold text-red-900">
              Access Restricted
            </h2>
            <p className="text-xs text-red-700">
              Internal audit logs are restricted to agency staff.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
          <Archive className="h-4 w-4" />
          Immutable Audit &amp; Project Archive
        </h1>
        <p className="text-xs text-zinc-500">
          Global audit index across {accessibleProjects.length} projects. Full
          6-tab project timelines are wired in Step 4 &amp; Step 5.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Archive Readiness</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-zinc-600">
          PostgreSQL immutability triggers (`trg_immutable_activity_logs` &amp;
          `enforce_project_archive_lock`) are defined in{' '}
          <code>supabase/migrations/0001_agency_core_schema.sql</code>.
        </CardContent>
      </Card>
    </div>
  );
}
