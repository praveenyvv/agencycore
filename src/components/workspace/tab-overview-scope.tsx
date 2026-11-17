'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Edit3,
  History,
  Lock,
  Plus,
  Save,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn, formatTimestamp } from '@/lib/utils';
import type { DeliverableItem, Project } from '@/types/agency';

export function TabOverviewScope({ project }: { project: Project }) {
  const {
    permissions,
    requirements,
    activityLogs,
    users,
    updateRequirements,
    submitClientSignOff,
    toggleProjectArchive,
  } = useAuth();

  const req = requirements.find((r) => r.project_id === project.id);
  const scopeLogs = activityLogs.filter(
    (l) => l.project_id === project.id && l.action_type === 'SCOPE_UPDATED'
  );

  const [editing, setEditing] = useState(false);
  const [scopeSummary, setScopeSummary] = useState(req?.scope_summary ?? '');
  const [outOfScope, setOutOfScope] = useState(req?.out_of_scope_notes ?? '');
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(
    req?.deliverables_json ?? []
  );
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const canEdit = permissions.canEditScope && !project.is_archived;

  const startEditing = () => {
    setScopeSummary(req?.scope_summary ?? '');
    setOutOfScope(req?.out_of_scope_notes ?? '');
    setDeliverables(req?.deliverables_json ?? []);
    setChangeReason('');
    setReasonError(null);
    setEditing(true);
  };

  const handleAddDeliverable = () => {
    if (!newDeliverableTitle.trim()) return;
    setDeliverables((prev) => [
      ...prev,
      {
        id: `del-${Date.now()}`,
        title: newDeliverableTitle.trim(),
        completed: false,
        client_signed_off: false,
      },
    ]);
    setNewDeliverableTitle('');
  };

  const handleSave = () => {
    if (changeReason.trim().length < 5) {
      setReasonError(
        'A scope change reason (min 5 chars) is required to log this update.'
      );
      return;
    }
    updateRequirements(
      project.id,
      {
        scope_summary: scopeSummary,
        out_of_scope_notes: outOfScope,
        deliverables_json: deliverables,
      },
      changeReason.trim()
    );
    setEditing(false);
  };

  const activeDeliverables = editing
    ? deliverables
    : req?.deliverables_json ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left 2 Columns: Project Brief & Deliverables */}
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Project Brief &amp; Scope Boundaries</CardTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Single source of truth for agreed deliverables and exclusions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {permissions.canToggleArchive && (
                <Button
                  size="sm"
                  variant={project.is_archived ? 'outline' : 'secondary'}
                  onClick={() => toggleProjectArchive(project.id)}
                >
                  {project.is_archived ? (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      Unlock Archive
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Lock &amp; Archive
                    </>
                  )}
                </Button>
              )}
              {canEdit && !editing && (
                <Button size="sm" variant="outline" onClick={startEditing}>
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Scope
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Scope Summary
                  </label>
                  <textarea
                    rows={4}
                    value={scopeSummary}
                    onChange={(e) => setScopeSummary(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 p-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Out-of-Scope Boundaries
                  </label>
                  <textarea
                    rows={2}
                    value={outOfScope}
                    onChange={(e) => setOutOfScope(e.target.value)}
                    className="w-full rounded-md border border-zinc-200 p-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                  />
                </div>

                <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                  <label className="text-xs font-semibold text-amber-900">
                    Mandatory Scope Change Reason *
                  </label>
                  <Input
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="e.g. Client approved phase 2 analytics widget..."
                  />
                  {reasonError && (
                    <p className="text-[11px] text-red-600">{reasonError}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-3.5 w-3.5" />
                    Save &amp; Log Scope Change
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Scope Summary
                  </div>
                  <p className="text-sm text-zinc-800 leading-relaxed">
                    {req?.scope_summary || 'No scope summary recorded yet.'}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Out-of-Scope Boundaries
                  </div>
                  <p className="text-xs text-zinc-700">
                    {req?.out_of_scope_notes || 'None specified.'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Scope Change Log */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-zinc-500" />
            Scope Change Log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scopeLogs.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No scope revisions logged since intake.
            </p>
          ) : (
            scopeLogs.map((log) => {
              const actor = users.find((u) => u.id === log.user_id);
              return (
                <div
                  key={log.id}
                  className="border-l-2 border-zinc-200 pl-3 space-y-0.5"
                >
                  <div className="text-xs font-medium text-zinc-900">
                    {log.change_summary}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {actor?.name ?? 'System'} · {formatTimestamp(log.created_at)}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
