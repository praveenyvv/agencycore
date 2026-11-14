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
import type { ProjectStatus, ProjectType } from '@/types/agency';

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
  const [pipelineSection, setPipelineSection] = useState<'all' | 'presales' | 'active' | 'drafts'>('all');
  const [typeFilter, setTypeFilter] = useState<'All' | ProjectType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | ProjectStatus>(
    'All'
  );
  const [newModalOpen, setNewModalOpen] = useState(false);

  const metrics = useMemo(() => {
    const preSalesCount = accessibleProjects.filter(
      (p) =>
        p.status === 'Lead/Discovery' ||
        p.status === 'Meeting Scheduled' ||
        p.status === 'Proposal Drafted' ||
        p.status === 'Proposal Review'
    ).length;

    const activeProjects = accessibleProjects.filter(
      (p) =>
        !p.is_archived &&
        p.status !== 'Completed/Archived' &&
        p.status !== 'Draft / On Hold' &&
        p.status !== 'Lead/Discovery' &&
        p.status !== 'Meeting Scheduled' &&
        p.status !== 'Proposal Drafted' &&
        p.status !== 'Proposal Review'
    ).length;

    const onHoldDraftsCount = accessibleProjects.filter(
      (p) => p.status === 'Draft / On Hold'
    ).length;

    let dueToday = 0;
    let overdue = 0;
    for (const task of accessibleTasks) {
      const info = getTaskDelayInfo(task, todayDate);
      if (info.isDueToday) dueToday += 1;
      if (info.isDelayed) overdue += 1;
    }

    return { preSalesCount, activeProjects, onHoldDraftsCount, dueToday, overdue };
  }, [accessibleProjects, accessibleTasks, todayDate]);

  const filteredProjects = useMemo(() => {
    return accessibleProjects.filter((p) => {
      // Pipeline section filter
      if (pipelineSection === 'presales') {
        const isPre =
          p.status === 'Lead/Discovery' ||
          p.status === 'Meeting Scheduled' ||
          p.status === 'Proposal Drafted' ||
          p.status === 'Proposal Review';
        if (!isPre) return false;
      } else if (pipelineSection === 'active') {
        const isAct =
          p.status === 'Intake' ||
          p.status === 'Scoping' ||
          p.status === 'In Execution' ||
          p.status === 'QA & Handover' ||
          p.status === 'Maintenance';
        if (!isAct) return false;
      } else if (pipelineSection === 'drafts') {
        if (p.status !== 'Draft / On Hold') return false;
      }

      if (typeFilter !== 'All' && p.project_type !== typeFilter) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      return true;
    });
  }, [accessibleProjects, pipelineSection, typeFilter, statusFilter]);

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
              : 'Live operational health across active retainers, delivery pipelines, and task deadlines.'}
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

      {/* 4 Crystal-Clear Stage Metrics Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Pre-Sales Pipeline */}
        <Card
          onClick={() => setPipelineSection(pipelineSection === 'presales' ? 'all' : 'presales')}
          className={`cursor-pointer transition-all hover:border-blue-400 ${
            pipelineSection === 'presales' ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500' : ''
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-blue-700">
              1. Pre-Sales &amp; Discovery
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-blue-900">
              {metrics.preSalesCount}
            </div>
            <p className="mt-0.5 text-[11px] text-blue-700/80">
              Meetings &amp; Proposals in negotiation
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Active Working Projects */}
        <Card
          onClick={() => setPipelineSection(pipelineSection === 'active' ? 'all' : 'active')}
          className={`cursor-pointer transition-all hover:border-emerald-400 ${
            pipelineSection === 'active' ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500' : ''
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-700">
              2. Confirmed &amp; In Execution
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-900">
              {metrics.activeProjects}
            </div>
            <p className="mt-0.5 text-[11px] text-emerald-700/80">
              Approved projects actively being delivered
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Overdue / Delayed Tasks */}
        {permissions.canViewInternalDelays ? (
          <Card
            className={cn(
              metrics.overdue > 0 && 'border-red-200 bg-red-50/40'
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle
                className={cn(
                  'text-xs font-semibold',
                  metrics.overdue > 0 ? 'text-red-700' : 'text-zinc-500'
                )}
              >
                Overdue Sprints
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
                {metrics.overdue}
              </div>
              <p className="mt-0.5 text-[11px] text-red-600/80">
                Auto-flagged past hard deadline
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500">
                Portal Access
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">Client</div>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Internal delays &amp; credentials hidden
              </p>
            </CardContent>
          </Card>
        )}

        {/* Metric 4: Drafts & On-Hold */}
        <Card
          onClick={() => setPipelineSection(pipelineSection === 'drafts' ? 'all' : 'drafts')}
          className={`cursor-pointer transition-all hover:border-purple-400 ${
            pipelineSection === 'drafts' ? 'border-purple-500 bg-purple-50/40 ring-1 ring-purple-500' : ''
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-purple-700">
              3. On-Hold &amp; Drafts
            </CardTitle>
            <Wrench className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-purple-900">
              {metrics.onHoldDraftsCount}
            </div>
            <p className="mt-0.5 text-[11px] text-purple-700/80">
              Postponed / reminders / never lost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Pipeline Overview */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              Agency Project Directory &amp; Pipeline
            </h2>
            <Badge variant="outline">
              {pipelineSection === 'all'
                ? `All Projects (${filteredProjects.length})`
                : pipelineSection === 'presales'
                ? `Pre-Sales Discovery (${filteredProjects.length})`
                : pipelineSection === 'active'
                ? `Confirmed Active (${filteredProjects.length})`
                : `Drafts / On-Hold (${filteredProjects.length})`}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Filter Pill Buttons */}
            <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPipelineSection('all')}
                className={`rounded px-2.5 py-1 font-medium cursor-pointer ${
                  pipelineSection === 'all'
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPipelineSection('presales')}
                className={`rounded px-2.5 py-1 font-medium cursor-pointer ${
                  pipelineSection === 'presales'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                Pre-Sales (Meetings/Proposals)
              </button>
              <button
                type="button"
                onClick={() => setPipelineSection('active')}
                className={`rounded px-2.5 py-1 font-medium cursor-pointer ${
                  pipelineSection === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Active Execution
              </button>
              <button
                type="button"
                onClick={() => setPipelineSection('drafts')}
                className={`rounded px-2.5 py-1 font-medium cursor-pointer ${
                  pipelineSection === 'drafts'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                Drafts &amp; On-Hold
              </button>
            </div>

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

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const isPreSale =
              project.status === 'Lead/Discovery' ||
              project.status === 'Meeting Scheduled' ||
              project.status === 'Proposal Drafted' ||
              project.status === 'Proposal Review';

            const isOnHold = project.status === 'Draft / On Hold';

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block"
              >
                <Card
                  className={`h-full transition-all hover:border-zinc-400 hover:shadow-xs ${
                    isPreSale
                      ? 'border-blue-200 bg-blue-50/15'
                      : isOnHold
                      ? 'border-purple-200 bg-purple-50/20'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {TYPE_ICON[project.project_type]}
                        <span className="text-[11px] font-medium text-zinc-500">
                          {project.project_type}
                        </span>
                      </div>
                      <Badge
                        variant={
                          isPreSale
                            ? 'info'
                            : isOnHold
                            ? 'purple'
                            : project.status === 'In Execution'
                            ? 'success'
                            : project.status === 'QA & Handover'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {isPreSale
                          ? `PRE-SALES: ${project.status}`
                          : isOnHold
                          ? 'ON-HOLD / DRAFT'
                          : `ACTIVE: ${project.status}`}
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

                    {/* Pre-Sales vs Active Clarity Indicator */}
                    <div
                      className={`rounded px-2 py-1 text-[11px] font-medium ${
                        isPreSale
                          ? 'bg-blue-100/70 text-blue-900'
                          : isOnHold
                          ? 'bg-purple-100/70 text-purple-900'
                          : 'bg-emerald-100/70 text-emerald-900'
                      }`}
                    >
                      {isPreSale
                        ? '⚡ In Meetings / Proposal Phase'
                        : isOnHold
                        ? `⏸ On Hold: ${project.draft_reason || 'Awaiting response'}`
                        : '🚀 Confirmed Deal In Delivery'}
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px] text-zinc-500">
                      <span>Target: {formatDate(project.target_end_date)}</span>
                      {project.is_archived && (
                        <span className="inline-flex items-center gap-1 text-zinc-600 font-medium">
                          <Lock className="h-3 w-3" /> Archived
                        </span>
                      )}
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
