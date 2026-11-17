'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  FolderKanban,
  Globe,
  Layers,
  Lock,
  Megaphone,
  Plus,
  ShieldAlert,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { NewProjectModal } from '@/components/projects/new-project-modal';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTaskDelayInfo } from '@/lib/rbac';
import { cn, formatDate } from '@/lib/utils';
import { getProjectSimpleStatus, type ProjectStatus, type ProjectType } from '@/types/agency';

const PROJECT_TYPES: Array<'All' | ProjectType> = [
  'All',
  'Website',
  'Web App',
  'Mobile App',
  'Digital Marketing',
];

const PROJECT_STATUSES: Array<'All' | ProjectStatus> = [
  'All',
  'Intake',
  'Scoping',
  'In Execution',
  'QA & Handover',
  'Completed/Archived',
  'Maintenance',
];

const TYPE_ICON: Record<ProjectType, React.ReactNode> = {
  Website: <Globe className="h-4 w-4 text-blue-600" />,
  'Web App': <Layers className="h-4 w-4 text-violet-600" />,
  'Mobile App': <Smartphone className="h-4 w-4 text-emerald-600" />,
  'Digital Marketing': <Megaphone className="h-4 w-4 text-amber-600" />,
};

function NewProjectUrlModal({
  manualOpen,
  onCloseManual,
}: {
  manualOpen: boolean;
  onCloseManual: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlOpen = searchParams.get('newProject') === '1';

  return (
    <NewProjectModal
      open={manualOpen || urlOpen}
      onClose={() => {
        onCloseManual();
        if (urlOpen) {
          router.replace('/');
        }
      }}
    />
  );
}

export default function CommandCenterPage() {
  const { currentUser, permissions, accessibleProjects, accessibleTasks, todayDate } =
    useAuth();
  const [typeFilter, setTypeFilter] = useState<'All' | ProjectType>('All');
  const [newModalOpen, setNewModalOpen] = useState(false);

  // Active projects only on command center; Inactive & Completed are in Drafts
  const activeProjectsList = useMemo(() => {
    return accessibleProjects.filter((p) => getProjectSimpleStatus(p) === 'Active');
  }, [accessibleProjects]);

  const draftsCount = useMemo(() => {
    return accessibleProjects.filter((p) => getProjectSimpleStatus(p) !== 'Active').length;
  }, [accessibleProjects]);

  const metrics = useMemo(() => {
    let dueToday = 0;
    let overdue = 0;
    for (const task of accessibleTasks) {
      const info = getTaskDelayInfo(task, todayDate);
      if (info.isDueToday) dueToday += 1;
      if (info.isDelayed) overdue += 1;
    }

    return {
      activeProjectsCount: activeProjectsList.length,
      draftsCount,
      dueToday,
      overdue,
    };
  }, [activeProjectsList.length, draftsCount, accessibleTasks, todayDate]);

  const filteredProjects = useMemo(() => {
    return activeProjectsList.filter((p) => {
      if (typeFilter !== 'All' && p.project_type !== typeFilter) return false;
      return true;
    });
  }, [activeProjectsList, typeFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
            {currentUser.role === 'client'
              ? `Welcome, ${currentUser.name}`
              : 'Agency Command Center'}
          </h1>
          <p className="text-xs text-zinc-500">
            {currentUser.role === 'client'
              ? 'Read-only client portal for inspecting project milestones and approved deliverables.'
              : 'Live operational health across active projects. Inactive & completed projects are kept in Drafts.'}
          </p>
        </div>
        {permissions.canCreateProject && (
          <Button size="sm" onClick={() => setNewModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        )}
      </div>

      <Suspense fallback={null}>
        <NewProjectUrlModal
          manualOpen={newModalOpen}
          onCloseManual={() => setNewModalOpen(false)}
        />
      </Suspense>

      {/* 3 Clean Metrics Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Metric 1: Active Projects */}
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-800">
              Active Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-950">
              {metrics.activeProjectsCount}
            </div>
            <p className="mt-0.5 text-[11px] text-emerald-700">
              Projects currently in active execution &amp; pre-sales
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Drafts (Inactive & Completed) */}
        <Link href="/drafts" className="block group">
          <Card className="h-full border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/50 transition-all cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900">
                Drafts (Inactive &amp; Completed)
              </CardTitle>
              <Wrench className="h-4 w-4 text-zinc-500 group-hover:text-zinc-800" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-zinc-900">
                {metrics.draftsCount}
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Stored separately outside to avoid confusion →
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Metric 3: Overdue / Delayed Tasks */}
        <Card
          className={cn(
            metrics.overdue > 0 ? 'border-red-200 bg-red-50/40' : 'border-zinc-200 bg-white'
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={cn(
                'text-xs font-semibold',
                metrics.overdue > 0 ? 'text-red-700' : 'text-zinc-500'
              )}
            >
              Task Deadlines
            </CardTitle>
            <AlertTriangle
              className={cn(
                'h-4 w-4',
                metrics.overdue > 0 ? 'text-red-600' : 'text-zinc-400'
              )}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold tracking-tight',
                metrics.overdue > 0 ? 'text-red-700' : 'text-zinc-900'
              )}
            >
              {metrics.overdue} Overdue
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {metrics.dueToday} task(s) due today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Directory */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              Active Projects Directory
            </h2>
            <Badge variant="outline">
              {filteredProjects.length} Active
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as 'All' | ProjectType)
              }
              className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 focus:outline-none"
              aria-label="Filter by project type"
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  Type: {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-xs text-zinc-600">
          <span>
            Showing <strong>{filteredProjects.length} Active Projects</strong>.
          </span>
          <Link
            href="/drafts"
            className="font-medium text-zinc-900 hover:underline flex items-center gap-1"
          >
            View Inactive &amp; Completed in Drafts ({metrics.draftsCount}) →
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block"
              >
                <Card className="h-full border-zinc-200 bg-white transition-all hover:border-zinc-400 hover:shadow-xs">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {TYPE_ICON[project.project_type]}
                        <span className="text-[11px] font-medium text-zinc-500">
                          {project.project_type}
                        </span>
                      </div>
                      <Badge variant="success">
                        ● Active
                      </Badge>
                    </div>
                    <CardTitle className="pt-2 flex items-center justify-between text-sm group-hover:text-zinc-700">
                      <span className="truncate">{project.title}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="text-zinc-500">
                      Client:{' '}
                      <span className="font-semibold text-zinc-800">
                        {project.client_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px] text-zinc-500">
                      <span>Target: {formatDate(project.target_end_date)}</span>
                      <span>Start: {formatDate(project.start_date)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
