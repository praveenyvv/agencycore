'use client';

import React, { useMemo } from 'react';
import { CheckCircle2, ExternalLink, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTaskDelayInfo } from '@/lib/rbac';
import { formatTimestamp } from '@/lib/utils';
import type { Project } from '@/types/agency';

export function TabTeamContributions({ project }: { project: Project }) {
  const { accessibleTasks, users, todayDate, activityLogs } = useAuth();

  const projectTasks = useMemo(
    () => accessibleTasks.filter((t) => t.project_id === project.id),
    [accessibleTasks, project.id]
  );

  const memberStats = useMemo(() => {
    const staff = users.filter((u) => u.role !== 'client');
    return staff
      .map((member) => {
        const assigned = projectTasks.filter((t) => t.assignee_id === member.id);
        const completed = assigned.filter((t) => t.status === 'Done');
        const onTimeCompleted = completed.filter(
          (t) => !getTaskDelayInfo(t, todayDate).isDelayed
        );
        const currentlyDelayed = assigned.filter(
          (t) => t.status !== 'Done' && getTaskDelayInfo(t, todayDate).isDelayed
        );
        const onTimeRate =
          completed.length > 0
            ? Math.round((onTimeCompleted.length / completed.length) * 100)
            : 100;

        return {
          member,
          assignedCount: assigned.length,
          completedCount: completed.length,
          currentlyDelayedCount: currentlyDelayed.length,
          onTimeRate,
        };
      })
      .filter((s) => s.assignedCount > 0);
  }, [users, projectTasks, todayDate]);

  const deliverableFeed = useMemo(() => {
    return projectTasks
      .filter((t) => t.deliverable_url)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [projectTasks]);

  const recentMemberLogs = useMemo(() => {
    return activityLogs
      .filter((l) => l.project_id === project.id)
      .slice(0, 8);
  }, [activityLogs, project.id]);

  return (
    <div className="space-y-4">
      {/* Per-Member Breakdown */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {memberStats.length === 0 ? (
          <Card className="md:col-span-3">
            <CardContent className="py-8 text-center text-xs text-zinc-500">
              No tasks assigned to team members on this project yet.
            </CardContent>
          </Card>
        ) : (
          memberStats.map((stat) => (
            <Card key={stat.member.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{stat.member.name}</CardTitle>
                    <p className="text-[11px] text-zinc-500">
                      {stat.member.title}
                    </p>
                  </div>
                  <Badge
                    variant={
                      stat.onTimeRate >= 85
                        ? 'success'
                        : stat.onTimeRate >= 60
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    <TrendingUp className="h-3 w-3" />
                    {stat.onTimeRate}% On-Time
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="rounded-md bg-zinc-50 p-2">
                  <div className="text-base font-bold text-zinc-900">
                    {stat.assignedCount}
                  </div>
                  <div className="text-[10px] text-zinc-500">Assigned</div>
                </div>
                <div className="rounded-md bg-emerald-50/70 p-2">
                  <div className="text-base font-bold text-emerald-700">
                    {stat.completedCount}
                  </div>
                  <div className="text-[10px] text-emerald-700">Completed</div>
                </div>
                <div className="rounded-md bg-red-50/70 p-2">
                  <div className="text-base font-bold text-red-700">
                    {stat.currentlyDelayedCount}
                  </div>
                  <div className="text-[10px] text-red-700">Overdue</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Deliverable & PR Feed + Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Submitted Deliverables &amp; Code/Campaign Links
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-100">
            {deliverableFeed.length === 0 ? (
              <p className="py-4 text-xs text-zinc-500">
                No deliverable URLs submitted yet.
              </p>
            ) : (
              deliverableFeed.map((task) => {
                const actor = users.find((u) => u.id === task.assignee_id);
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-900 truncate">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {actor?.name ?? 'Team Member'} ·{' '}
                        {formatTimestamp(task.updated_at)}
                      </div>
                    </div>
                    <a
                      href={task.deliverable_url!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-zinc-50 shrink-0"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-500" />
              Recent Member Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentMemberLogs.map((log) => {
              const actor = users.find((u) => u.id === log.user_id);
              return (
                <div
                  key={log.id}
                  className="text-xs border-l-2 border-zinc-200 pl-3"
                >
                  <span className="font-medium text-zinc-900">
                    {actor?.name ?? 'System'}:
                  </span>{' '}
                  <span className="text-zinc-600">{log.change_summary}</span>
                  <div className="text-[10px] text-zinc-400">
                    {formatTimestamp(log.created_at)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
