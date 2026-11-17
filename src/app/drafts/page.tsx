'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FolderArchive,
  Layers,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn, formatDate } from '@/lib/utils';
import { getProjectSimpleStatus, type ProjectStatus, type SimpleProjectStatus } from '@/types/agency';

export default function DraftsPage() {
  const { accessibleProjects, updateProjectStatus } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'inactive' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drafts contains Inactive and Completed projects (kept separate from active projects to avoid confusion)
  const draftsProjects = useMemo(() => {
    return accessibleProjects.filter((p) => {
      const status = getProjectSimpleStatus(p);
      return status === 'Inactive' || status === 'Completed';
    });
  }, [accessibleProjects]);

  const inactiveProjects = useMemo(() => {
    return draftsProjects.filter((p) => getProjectSimpleStatus(p) === 'Inactive');
  }, [draftsProjects]);

  const completedProjects = useMemo(() => {
    return draftsProjects.filter((p) => getProjectSimpleStatus(p) === 'Completed');
  }, [draftsProjects]);

  const filteredProjects = useMemo(() => {
    return draftsProjects.filter((p) => {
      const status = getProjectSimpleStatus(p);
      if (activeTab === 'inactive' && status !== 'Inactive') return false;
      if (activeTab === 'completed' && status !== 'Completed') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = p.title.toLowerCase().includes(q);
      const clientMatch = p.client_name.toLowerCase().includes(q);
      const typeMatch = p.project_type.toLowerCase().includes(q);
      const reasonMatch = (p.draft_reason || '').toLowerCase().includes(q);
      return titleMatch || clientMatch || typeMatch || reasonMatch;
    });
  }, [draftsProjects, activeTab, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 flex items-center gap-2">
            <Archive className="h-5 w-5 text-zinc-600" />
            Drafts
          </h1>
          <p className="text-xs text-zinc-500">
            Inactive and completed projects stored safely outside your active projects to avoid confusion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
          >
            ← Back to Active Projects
          </Link>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-3">
        {/* Tab Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            )}
          >
            All Drafts ({draftsProjects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inactive')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'inactive'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            )}
          >
            <PauseCircle className="h-3 w-3" />
            Inactive ({inactiveProjects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            Completed ({completedProjects.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drafts by title or client..."
            className="h-8 pl-8 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-3">
              <FolderArchive className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800">
              {draftsProjects.length === 0
                ? 'No projects in Drafts'
                : 'No projects match your filter'}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">
              {draftsProjects.length === 0
                ? 'When a project is marked as Inactive or Completed from its workspace, it will appear here so your active workspace stays focused.'
                : 'Try clearing your search query or switching tabs.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const simpleStatus = getProjectSimpleStatus(project);

            return (
              <Card
                key={project.id}
                className={cn(
                  'flex flex-col justify-between border transition-all hover:border-zinc-300 hover:shadow-xs',
                  simpleStatus === 'Inactive'
                    ? 'border-amber-200/80 bg-amber-50/20'
                    : 'border-blue-200/80 bg-blue-50/20'
                )}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header: Project Type + Interactive Status Dropdown */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[11px]">
                      {project.project_type}
                    </Badge>

                    {/* Status Dropdown */}
                    <div className="relative inline-flex items-center">
                      <select
                        value={simpleStatus}
                        onChange={(e) =>
                          updateProjectStatus(
                            project.id,
                            e.target.value as ProjectStatus
                          )
                        }
                        className={cn(
                          'h-6 rounded-full border px-2.5 pr-6 text-[11px] font-semibold cursor-pointer transition-colors appearance-none focus:outline-none focus:ring-1 focus:ring-zinc-900',
                          simpleStatus === 'Inactive'
                            ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
                        )}
                        aria-label="Project Status"
                      >
                        <option value="Active">● Active (Move out)</option>
                        <option value="Inactive">● Inactive</option>
                        <option value="Completed">● Completed</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-zinc-500" />
                    </div>
                  </div>

                  {/* Title & Client */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Client: <strong className="text-zinc-700">{project.client_name}</strong>
                    </p>
                  </div>

                  {/* Note / Reason if any */}
                  {project.draft_reason && (
                    <div className="rounded-md bg-white p-2 border border-zinc-200 text-xs text-zinc-600">
                      <span className="font-medium text-zinc-700">Note: </span>
                      {project.draft_reason}
                    </div>
                  )}

                  {/* Metadata (Dates) */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100">
                    <span>Start: {formatDate(project.start_date)}</span>
                    <span>
                      {simpleStatus === 'Completed'
                        ? `Finished: ${formatDate(project.actual_end_date || project.updated_at)}`
                        : `Target: ${formatDate(project.target_end_date)}`}
                    </span>
                  </div>

                  {/* Actions: Make Active button + Open Workspace */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => updateProjectStatus(project.id, 'Active')}
                      className="h-7 text-xs flex items-center gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Make Active
                    </Button>

                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-zinc-800 hover:text-black hover:underline"
                    >
                      Open Workspace <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
