'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckSquare } from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTaskDelayInfo } from '@/lib/rbac';
import { formatDate } from '@/lib/utils';

export default function MyTasksPage() {
  const { accessibleTasks, accessibleProjects, currentUser, todayDate } = useAuth();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          My Tasks
        </h1>
        <p className="text-xs text-zinc-500">
          Tasks visible to {currentUser.name} across accessible projects.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned &amp; Tracked Tasks ({accessibleTasks.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-zinc-100">
          {accessibleTasks.map((task) => {
            const delay = getTaskDelayInfo(task, todayDate);
            const project = accessibleProjects.find(
              (p) => p.id === task.project_id
            );
            return (
              <Link
                key={task.id}
                href={`/projects/${task.project_id}`}
                className="flex items-center justify-between py-3 hover:bg-zinc-50 px-2 rounded transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-900 truncate">
                    {task.title}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {project?.title} · Due {formatDate(task.due_date)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {delay.isDelayed && (
                    <Badge variant="danger">
                      <AlertTriangle className="h-3 w-3" />
                      DELAYED ({delay.daysOverdue}d)
                    </Badge>
                  )}
                  <Badge variant="secondary">{task.status}</Badge>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
