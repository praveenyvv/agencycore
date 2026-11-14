'use client';

import React, { useMemo, useState } from 'react';
import { History, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTimestamp } from '@/lib/utils';
import { ROLE_LABELS, type ActivityLog, type Project } from '@/types/agency';

type EntityFilter = 'all' | ActivityLog['entity_type'];

export function TabAuditTimeline({ project }: { project: Project }) {
  const { currentUser, activityLogs, users } = useAuth();
  const [filter, setFilter] = useState<EntityFilter>('all');

  const logs = useMemo(() => {
    return activityLogs.filter((l) => {
      if (l.project_id !== project.id) return false;
      if (currentUser.role === 'client') {
        return (
          l.action_type === 'CLIENT_SIGN_OFF' ||
          l.action_type === 'PROJECT_ARCHIVED' ||
          l.action_type === 'ASSET_APPROVED'
        );
      }
      if (filter !== 'all' && l.entity_type !== filter) return false;
      return true;
    });
  }, [activityLogs, project.id, currentUser.role, filter]);

  return (
    <div className="space-y-4">
      {project.is_archived && (
        <div className="flex items-center gap-2.5 rounded-lg border border-zinc-300 bg-zinc-900 px-4 py-3 text-xs text-zinc-100">
          <Lock className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-semibold">
              Immutable Read-Only Archive Active:
            </span>{' '}
            All tasks, requirements, assets, and credentials are permanently
            locked to preserve the exact historical snapshot of delivery.
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-zinc-700" />
              Immutable Audit Timeline ({logs.length})
            </CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">
              Append-only ledger of scope changes, task transitions, file
              uploads, credential reveals, and client sign-offs.
            </p>
          </div>

          {currentUser.role !== 'client' && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as EntityFilter)}
              className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800"
            >
              <option value="all">All Events</option>
              <option value="project">Project &amp; Archive</option>
              <option value="requirement">Scope &amp; Sign-off</option>
              <option value="task">Tasks &amp; Deliverables</option>
              <option value="asset">Asset Repository</option>
              <option value="credential">Credential Vault</option>
            </select>
          )}
        </CardHeader>

        <CardContent>
          {logs.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-500">
              No audit events recorded for this filter.
            </p>
          ) : (
            <div className="relative space-y-4 border-l border-zinc-200 ml-2 pl-5">
              {logs.map((log) => {
                const actor = users.find((u) => u.id === log.user_id);
                return (
                  <div key={log.id} className="relative space-y-1">
                    <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-zinc-900" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.action_type}
                      </Badge>
                      <span className="text-xs font-semibold text-zinc-900">
                        {actor?.name ?? 'System'}
                      </span>
                      {actor && (
                        <span className="text-[10px] text-zinc-400">
                          ({ROLE_LABELS[actor.role]})
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400 ml-auto">
                        {formatTimestamp(log.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700">{log.change_summary}</p>
                    {Object.keys(log.metadata_json).length > 0 && (
                      <div className="inline-flex items-center gap-1.5 rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        {JSON.stringify(log.metadata_json)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
