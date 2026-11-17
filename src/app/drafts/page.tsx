'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FolderArchive,
  PauseCircle,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cn, formatDate } from '@/lib/utils';
import { getProjectSimpleStatus, type Project, type ProjectStatus } from '@/types/agency';

export default function DraftsPage() {
  const { accessibleProjects, updateProjectStatus, deleteProject, permissions } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const activeProjects = useMemo(() => {
    return accessibleProjects.filter((p) => getProjectSimpleStatus(p) === 'Active');
  }, [accessibleProjects]);

  const inactiveProjects = useMemo(() => {
    return accessibleProjects.filter((p) => getProjectSimpleStatus(p) === 'Inactive');
  }, [accessibleProjects]);

  const completedProjects = useMemo(() => {
    return accessibleProjects.filter((p) => getProjectSimpleStatus(p) === 'Completed');
  }, [accessibleProjects]);

  const filteredProjects = useMemo(() => {
    return accessibleProjects.filter((p) => {
      const status = getProjectSimpleStatus(p);
      if (activeTab === 'active' && status !== 'Active') return false;
      if (activeTab === 'inactive' && status !== 'Inactive') return false;
      if (activeTab === 'completed' && status !== 'Completed') return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      const titleMatch = p.title.toLowerCase().includes(q);
      const clientMatch = p.client_name.toLowerCase().includes(q);
      const typeMatch = p.project_type.toLowerCase().includes(q);
      const reasonMatch = (p.draft_reason || '').toLowerCase().includes(q);
      return titleMatch || clientMatch || typeMatch || reasonMatch;
    });
  }, [accessibleProjects, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[#111827] flex items-center gap-2">
            <Archive className="h-5 w-5 text-[#4361ee]" />
            Projects &amp; Drafts Directory
          </h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">
            Overview of all agency projects: active engagements, inactive drafts, and completed archives.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#4361ee] hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* 2. Filter Tabs (Segmented Control) & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 bg-[#f3f4f6] p-[3px] rounded-[9px] w-fit flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all cursor-pointer',
              activeTab === 'active'
                ? 'bg-white text-[#4361ee] shadow-[0_1px_3px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-[#6b7280] hover:text-[#111827]'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>Active ({activeProjects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inactive')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all cursor-pointer',
              activeTab === 'inactive'
                ? 'bg-white text-[#4361ee] shadow-[0_1px_3px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-[#6b7280] hover:text-[#111827]'
            )}
          >
            <PauseCircle className="h-3.5 w-3.5 text-[#f59e0b]" />
            <span>Inactive ({inactiveProjects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all cursor-pointer',
              activeTab === 'completed'
                ? 'bg-white text-[#4361ee] shadow-[0_1px_3px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-[#6b7280] hover:text-[#111827]'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[#3b82f6]" />
            <span>Completed ({completedProjects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all cursor-pointer',
              activeTab === 'all'
                ? 'bg-white text-[#4361ee] shadow-[0_1px_3px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-[#6b7280] hover:text-[#111827]'
            )}
          >
            All ({accessibleProjects.length})
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#f5f6fa] border border-[#e5e7eb] rounded-[8px] px-3 py-1.5 w-full sm:w-[260px]">
          <Search className="h-3.5 w-3.5 text-[#9ca3af] shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drafts by title..."
            className="bg-transparent border-none text-[13px] text-[#111827] placeholder:text-[#9ca3af] outline-none w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#9ca3af] hover:text-[#111827]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-[12px] bg-white border border-[#e5e7eb] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <FolderArchive className="h-10 w-10 text-[#9ca3af] mx-auto mb-2" />
          <h3 className="text-[15px] font-bold text-[#111827]">
            {accessibleProjects.length === 0
              ? 'No projects available'
              : 'No projects match your filter'}
          </h3>
          <p className="mt-1 max-w-sm mx-auto text-[12px] text-[#6b7280]">
            {accessibleProjects.length === 0
              ? 'Create a project or adjust your filters to view projects.'
              : 'Try clearing your search query or switching tabs.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const simpleStatus = getProjectSimpleStatus(project);

            return (
              <div
                key={project.id}
                className="rounded-[12px] bg-white border border-[#e5e7eb] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header: Project Type + Interactive Status Dropdown + Delete */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">
                      {project.project_type}
                    </Badge>

                    <div className="flex items-center gap-1.5">
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
                            'h-6 rounded-[20px] border px-2.5 pr-6 text-[11px] font-semibold cursor-pointer transition-colors appearance-none focus:outline-none focus:ring-1 focus:ring-[#4361ee]',
                            simpleStatus === 'Active'
                              ? 'border-transparent bg-[#d1fae5] text-[#065f46]'
                              : simpleStatus === 'Inactive'
                              ? 'border-transparent bg-[#fef3c7] text-[#92400e]'
                              : 'border-transparent bg-[#dbeafe] text-[#1d4ed8]'
                          )}
                          aria-label="Project Status"
                        >
                          <option value="Active">● Active</option>
                          <option value="Inactive">● Inactive</option>
                          <option value="Completed">● Completed</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-[#6b7280]" />
                      </div>

                      {permissions.canCreateProject && (
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(project)}
                          title="Delete Project"
                          className="h-6 w-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Client */}
                  <div>
                    <h3 className="text-[15px] font-bold text-[#111827] line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-[12px] text-[#6b7280] mt-0.5">
                      Client: <strong className="text-[#111827]">{project.client_name}</strong>
                    </p>
                  </div>

                  {/* Note / Reason if any */}
                  {project.draft_reason && (
                    <div className="rounded-[8px] bg-[#f9fafb] p-2 border border-[#e5e7eb] text-[12px] text-[#6b7280]">
                      <span className="font-semibold text-[#111827]">Note: </span>
                      {project.draft_reason}
                    </div>
                  )}

                  {/* Metadata (Dates) */}
                  <div className="flex items-center justify-between text-[11px] text-[#9ca3af] pt-1 border-t border-[#e5e7eb]">
                    <span>Start: {formatDate(project.start_date)}</span>
                    <span>
                      {simpleStatus === 'Completed'
                        ? `Finished: ${formatDate(project.actual_end_date || project.updated_at)}`
                        : `Target: ${formatDate(project.target_end_date)}`}
                    </span>
                  </div>
                </div>

                {/* Actions: Make Active / Pause button + Open Workspace */}
                <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[#e5e7eb]">
                  {simpleStatus === 'Active' ? (
                    <button
                      type="button"
                      onClick={() => updateProjectStatus(project.id, 'Inactive')}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] border border-[#fef3c7] bg-[#fffbeb] text-[#92400e] text-[11.5px] font-semibold hover:bg-[#fef3c7] transition-colors cursor-pointer"
                    >
                      <PauseCircle className="h-3 w-3" />
                      Pause to Draft
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateProjectStatus(project.id, 'Active')}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] border border-[#bbf7d0] bg-[#ecfdf5] text-[#065f46] text-[11.5px] font-semibold hover:bg-[#d1fae5] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Make Active
                    </button>
                  )}

                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#4361ee] hover:underline"
                  >
                    Open Workspace <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <Modal
          isOpen={!!projectToDelete}
          onClose={() => setProjectToDelete(null)}
          title="Delete Project?"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-red-600">
              <div className="rounded-full bg-red-100 p-2 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Permanently delete &quot;{projectToDelete.title}&quot;?
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  This will remove this project and all of its associated records across tasks, meetings, proposals, credentials, renewals, and assets.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-xs text-red-700">
              <strong>Warning:</strong> This action is irreversible and cannot be undone.
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProjectToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  deleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Delete Project
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
