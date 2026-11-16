'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckSquare, Clock, FolderKanban, User } from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTaskDelayInfo } from '@/lib/rbac';
import { formatDate } from '@/lib/utils';

export default function MyTasksPage() {
  const { accessibleTasks, accessibleProjects, currentUser, users, todayDate } =
    useAuth();

  // For members, default to 'assigned_to_me'. For admin/PM, default to 'all'.
  const [taskFilter, setTaskFilter] = useState<'assigned_to_me' | 'all'>(() => {
    return currentUser.role === 'member' ? 'assigned_to_me' : 'all';
  });

  const myAssignedTasks = useMemo(() => {
    return accessibleTasks.filter((t) => t.assignee_id === currentUser.id);
  }, [accessibleTasks, currentUser.id]);

  const displayedTasks = useMemo(() => {
    if (taskFilter === 'assigned_to_me') {
      return myAssignedTasks;
    }
    return accessibleTasks;
  }, [taskFilter, myAssignedTasks, accessibleTasks]);

  const getAssignee = (userId: string | null | undefined) => {
    if (!userId) return null;
    return users.find((u) => u.id === userId) || null;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-zinc-700" />
            My Tasks &amp; Workload
          </h1>
          <p className="text-xs text-zinc-500">
            Sprint deliverables and tasks for {currentUser.name} ({currentUser.role.toUpperCase()}).
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
          <button
            onClick={() => setTaskFilter('assigned_to_me')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              taskFilter === 'assigned_to_me'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>Assigned to Me</span>
            <Badge variant="info" className="text-[10px] px-1.5 py-0">
              {myAssignedTasks.length}
            </Badge>
          </button>
          <button
            onClick={() => setTaskFilter('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              taskFilter === 'all'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>All Team Tasks</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              ({accessibleTasks.length})
            </span>
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="py-3 border-b border-zinc-100">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>
              {taskFilter === 'assigned_to_me'
                ? `Directly Assigned to ${currentUser.name}`
                : 'All Project Sprints & Deliverables'}
            </span>
            <span className="text-xs font-normal text-zinc-500">
              {displayedTasks.length} task{displayedTasks.length === 1 ? '' : 's'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-zinc-100 p-0">
          {displayedTasks.length === 0 ? (
            <div className="py-12 text-center">
              <CheckSquare className="mx-auto h-8 w-8 text-zinc-300" />
              <h3 className="mt-2 text-sm font-medium text-zinc-900">
                {taskFilter === 'assigned_to_me'
                  ? 'No tasks currently assigned to you.'
                  : 'No tasks found.'}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                {taskFilter === 'assigned_to_me'
                  ? 'Switch to "All Team Tasks" above or select a project to pick up a ticket.'
                  : 'Tasks will appear once created on any project board.'}
              </p>
            </div>
          ) : (
            displayedTasks.map((task) => {
              const delay = getTaskDelayInfo(task, todayDate);
              const project = accessibleProjects.find(
                (p) => p.id === task.project_id
              );
              const assignee = getAssignee(task.assignee_id);

              return (
                <Link
                  key={task.id}
                  href={`/projects/${task.project_id}?tab=board`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-zinc-50/80 transition-colors gap-2"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 truncate hover:text-blue-600">
                        {task.title}
                      </span>
                      {task.priority === 'Critical' && (
                        <Badge variant="danger" className="text-[10px]">
                          CRITICAL
                        </Badge>
                      )}
                      {task.priority === 'High' && (
                        <Badge variant="warning" className="text-[10px]">
                          HIGH
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1 font-medium text-zinc-700">
                        <FolderKanban className="h-3 w-3 text-zinc-400" />
                        {project?.title || 'Unknown Project'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-zinc-400" />
                        Due {formatDate(task.due_date)}
                      </span>
                      {assignee && (
                        <span className="flex items-center gap-1 text-zinc-600">
                          <User className="h-3 w-3 text-zinc-400" />
                          {assignee.name} {assignee.id === currentUser.id && '(You)'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                    {delay.isDelayed && (
                      <Badge variant="danger" className="text-[10px] gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        DELAYED ({delay.daysOverdue}d)
                      </Badge>
                    )}
                    <Badge
                      variant={
                        task.status === 'Done'
                          ? 'success'
                          : task.status === 'In Progress'
                          ? 'info'
                          : task.status === 'Internal Review'
                          ? 'purple'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {task.status}
                    </Badge>
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
