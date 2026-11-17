'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ChevronDown,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  FolderKanban,
  History,
  Kanban,
  KeyRound,
  Lock,
  MessageCircle,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { TabAssetRepository } from '@/components/workspace/tab-asset-repository';
import { TabAuditTimeline } from '@/components/workspace/tab-audit-timeline';
import { TabClientTalk } from '@/components/workspace/tab-client-talk';
import { TabContactsManager } from '@/components/workspace/tab-contacts-manager';
import { TabCredentialVault } from '@/components/workspace/tab-credential-vault';
import { TabDocuments } from '@/components/workspace/tab-documents';
import { TabExecutionBoard } from '@/components/workspace/tab-execution-board';
import { TabMeetingsPreSales } from '@/components/workspace/tab-meetings-presales';
import { TabOverviewScope } from '@/components/workspace/tab-overview-scope';
import { TabProposalBuilder } from '@/components/workspace/tab-proposal-builder';
import { TabRenewals } from '@/components/workspace/tab-renewals';
import { TabTeamContributions } from '@/components/workspace/tab-team-contributions';
import { cn, formatDate } from '@/lib/utils';
import { getProjectSimpleStatus, type ProjectStatus } from '@/types/agency';

type WorkspaceTab =
  | 'overview'
  | 'contacts'
  | 'meetings'
  | 'talks'
  | 'proposals'
  | 'documents'
  | 'assets'
  | 'vault'
  | 'renewals'
  | 'board'
  | 'contributions'
  | 'audit';

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { accessibleProjects, currentUser, permissions, renewals, updateProjectStatus, deleteProject } = useAuth();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const project = accessibleProjects.find((p) => p.id === params.id);

  const handleDelete = () => {
    if (!project) return;
    deleteProject(project.id);
    setShowDeleteModal(false);
    router.push('/drafts');
  };

  const projectUpcomingRenewals = useMemo(() => {
    if (!project) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return renewals.filter((r) => {
      if (r.project_id !== project.id || r.renewed) return false;
      const target = new Date(r.renewal_date);
      target.setHours(0, 0, 0, 0);
      const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 7;
    }).length;
  }, [renewals, project]);

  const tabs = useMemo(() => {
    const isClient = currentUser.role === 'client';

    const allTabs: Array<{
      id: WorkspaceTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      visible: boolean;
      badge?: string;
    }> = [
      {
        id: 'overview',
        label: 'Overview & Scope',
        icon: FileText,
        visible: true,
      },
      {
        id: 'contacts',
        label: 'Contacts',
        icon: Users,
        visible: true,
      },
      {
        id: 'meetings',
        label: 'Meetings',
        icon: MessageSquare,
        visible: !isClient,
      },
      {
        id: 'talks',
        label: 'Client Talk',
        icon: MessageCircle,
        visible: !isClient,
      },
      {
        id: 'proposals',
        label: 'Proposals',
        icon: FileSpreadsheet,
        visible: !isClient,
      },
      {
        id: 'assets',
        label: 'Asset Repository',
        icon: FolderArchive,
        visible: true,
      },
      {
        id: 'vault',
        label: 'Credential Vault',
        icon: KeyRound,
        visible: permissions.canViewCredentials,
      },
      {
        id: 'renewals',
        label: 'Renewals',
        icon: RotateCcw,
        visible: !isClient,
        badge: projectUpcomingRenewals > 0 ? String(projectUpcomingRenewals) : undefined,
      },
      {
        id: 'board',
        label: isClient ? 'Approved Deliverables' : 'Task Board',
        icon: Kanban,
        visible: true,
      },
    ];
    return allTabs.filter((t) => t.visible);
  }, [permissions.canViewCredentials, currentUser.role, projectUpcomingRenewals]);

  if (!project) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="pt-6 space-y-2">
            <ShieldAlert className="mx-auto h-8 w-8 text-red-600" />
            <h2 className="text-sm font-semibold text-red-900">
              Project Not Found or Access Denied
            </h2>
            <p className="text-xs text-red-700">
              You do not have permission to view this project under your current
              RBAC role.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resolvedTab = tabs.some((t) => t.id === activeTab)
    ? activeTab
    : 'overview';

  const simpleStatus = getProjectSimpleStatus(project);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Project Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <FolderKanban className="h-4 w-4 text-zinc-500" />
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              {project.title}
            </h1>
            <Badge variant="outline">{project.project_type}</Badge>
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
                  'h-6 rounded-full border px-2.5 pr-6 text-xs font-semibold cursor-pointer transition-colors appearance-none focus:outline-none focus:ring-1 focus:ring-zinc-900',
                  simpleStatus === 'Active'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : simpleStatus === 'Inactive'
                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
                )}
                aria-label="Project Status"
              >
                <option value="Active">● Active</option>
                <option value="Inactive">● Inactive</option>
                <option value="Completed">● Completed</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-zinc-500" />
            </div>
            {project.is_archived && simpleStatus !== 'Completed' && (
              <Badge variant="secondary">
                <Lock className="h-3 w-3" /> Read-Only Archive
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Client: <strong className="text-zinc-700">{project.client_name}</strong>{' '}
            · Start: {formatDate(project.start_date)} · Target Delivery:{' '}
            {formatDate(project.target_end_date)}
            {project.draft_reason && (
              <span className="ml-2 text-violet-700 font-medium">
                (Draft Note: {project.draft_reason})
              </span>
            )}
          </p>
        </div>

        {permissions.canCreateProject && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors cursor-pointer text-xs font-medium self-start sm:self-auto shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Project
          </Button>
        )}
      </div>

      {/* Navigation Tab Bar (Segmented Control Pill Container) */}
      <div className="flex items-center gap-1 overflow-x-auto bg-[#f3f4f6] p-[3px] rounded-[9px] w-fit max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = resolvedTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all cursor-pointer',
                isActive
                  ? 'bg-white text-[#4361ee] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'text-[#6b7280] hover:text-[#111827] hover:bg-white/60'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 rounded-[10px] bg-[#ef4444] text-white px-1.5 py-0.2 text-[10px] font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div>
        {resolvedTab === 'overview' && <TabOverviewScope project={project} />}
        {resolvedTab === 'contacts' && <TabContactsManager project={project} />}
        {resolvedTab === 'meetings' && <TabMeetingsPreSales project={project} />}
        {resolvedTab === 'talks' && <TabClientTalk project={project} />}
        {resolvedTab === 'proposals' && <TabProposalBuilder project={project} />}
        {resolvedTab === 'documents' && <TabDocuments project={project} />}
        {resolvedTab === 'assets' && <TabAssetRepository project={project} />}
        {resolvedTab === 'vault' && <TabCredentialVault project={project} />}
        {resolvedTab === 'renewals' && <TabRenewals project={project} />}
        {resolvedTab === 'board' && <TabExecutionBoard project={project} />}
      </div>

      {/* Delete Project Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
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
                  Permanently delete &quot;{project.title}&quot;?
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  This will permanently delete this project and all of its associated records, including tasks, meetings, client talks, proposals, credentials, renewals, and asset links.
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
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
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
