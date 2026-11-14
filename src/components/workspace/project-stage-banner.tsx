'use client';

import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileSpreadsheet,
  FolderArchive,
  FolderKanban,
  Kanban,
  Lock,
  PauseCircle,
  PlayCircle,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Project, ProjectContact, ProjectMeeting, ProjectProposal } from '@/types/agency';

export type LifecyclePhase = 'presales_discovery' | 'presales_proposal' | 'active_delivery' | 'on_hold' | 'archived';

export function getProjectLifecycleDetails(
  project: Project,
  meetings: ProjectMeeting[] = [],
  proposals: ProjectProposal[] = [],
  contacts: ProjectContact[] = []
) {
  const projectMeetings = meetings.filter((m) => m.project_id === project.id);
  const projectProposals = proposals.filter((p) => p.project_id === project.id);
  const projectContacts = contacts.filter((c) => c.project_id === project.id);

  const latestMeeting = projectMeetings[0];
  const latestProposal = projectProposals[0];
  const primaryContact = projectContacts.find((c) => c.is_primary) || projectContacts[0];

  if (project.is_archived) {
    return {
      phase: 'archived' as LifecyclePhase,
      stepNumber: 5,
      stepTitle: 'Completed & Locked Archive',
      badgeLabel: 'ARCHIVED SNAPSHOT',
      badgeVariant: 'secondary' as const,
      colorTheme: 'zinc',
      headline: 'Project delivery finalized. Historical read-only snapshot.',
      nextAction: 'View immutable audit log or unlock if scope is being extended.',
      recommendTab: 'audit',
    };
  }

  if (project.status === 'Draft / On Hold') {
    return {
      phase: 'on_hold' as LifecyclePhase,
      stepNumber: 0,
      stepTitle: 'Deal On-Hold / Draft',
      badgeLabel: 'ON-HOLD / DRAFT',
      badgeVariant: 'purple' as const,
      colorTheme: 'purple',
      headline: project.draft_reason || 'Deal postponed or client awaiting follow-up.',
      nextAction: project.remainder_next_date
        ? `Scheduled Reminder: ${project.remainder_next_date}. Send Email/WhatsApp follow-up or reopen.`
        : 'Review denial notes or reopen deal from Drafts when client resumes.',
      recommendTab: project.draft_source_stage === 'proposal' ? 'proposals' : 'meetings',
    };
  }

  if (project.status === 'Lead/Discovery' || project.status === 'Meeting Scheduled') {
    const hasMeeting = projectMeetings.length > 0;
    return {
      phase: 'presales_discovery' as LifecyclePhase,
      stepNumber: 1,
      stepTitle: 'Stage 1: Pre-Sales Discovery Meeting',
      badgeLabel: hasMeeting ? 'MEETING SCHEDULED' : 'LEAD / NEEDS CALL',
      badgeVariant: 'info' as const,
      colorTheme: 'blue',
      headline: hasMeeting
        ? `Meeting: "${latestMeeting?.title}" scheduled for ${new Date(latestMeeting.scheduled_at).toLocaleDateString()}`
        : 'Lead registered. Initial discovery call needs to be scheduled.',
      nextAction: hasMeeting
        ? 'Conduct meeting, log pain points & solutions, then click [Approved], [Denied], [Reschedule], or [Remainder].'
        : 'Open the "Meetings & Discovery" tab to schedule your call with client stakeholders.',
      recommendTab: 'meetings',
    };
  }

  if (project.status === 'Proposal Drafted' || project.status === 'Proposal Review') {
    const hasProposal = projectProposals.length > 0;
    return {
      phase: 'presales_proposal' as LifecyclePhase,
      stepNumber: 2,
      stepTitle: 'Stage 2: Proposal Drafting & Review',
      badgeLabel: 'PROPOSAL IN REVIEW',
      badgeVariant: 'warning' as const,
      colorTheme: 'amber',
      headline: hasProposal
        ? `Proposal: "${latestProposal?.title}" ($${latestProposal.total_one_time_cost.toLocaleString()})`
        : 'Discovery approved! Ready to draft commercial proposal & itemized pricing table.',
      nextAction: hasProposal
        ? 'Download PDF for client, schedule proposal review call, then click [Approved] to start project or [Denied] to send to drafts.'
        : 'Open "Proposals" tab, fill the word-style template & pricing table, then generate PDF.',
      recommendTab: 'proposals',
    };
  }

  if (project.status === 'Intake' || project.status === 'Scoping') {
    return {
      phase: 'active_delivery' as LifecyclePhase,
      stepNumber: 3,
      stepTitle: 'Stage 3: Approved Deal — Intake & Scoping',
      badgeLabel: 'PROPOSAL APPROVED · INTAKE',
      badgeVariant: 'success' as const,
      colorTheme: 'emerald',
      headline: 'Proposal accepted by client! Deal won. Finalizing requirements and deliverables.',
      nextAction: 'Review deliverables in "Overview & Scope", upload signed SOW in "Documents", and break down tasks in "Task Board".',
      recommendTab: 'overview',
    };
  }

  if (project.status === 'In Execution' || project.status === 'QA & Handover') {
    return {
      phase: 'active_delivery' as LifecyclePhase,
      stepNumber: 4,
      stepTitle: 'Stage 4: Active Project Execution',
      badgeLabel: project.status === 'QA & Handover' ? 'QA & HANDOVER' : 'ACTIVE IN EXECUTION',
      badgeVariant: 'success' as const,
      colorTheme: 'emerald',
      headline: 'Project is in active development sprints. Tasks, deadlines & deliverables are live.',
      nextAction: 'Track team sprint progress on the "Task Board" and review overdue task alerts.',
      recommendTab: 'board',
    };
  }

  // Maintenance
  return {
    phase: 'active_delivery' as LifecyclePhase,
    stepNumber: 5,
    stepTitle: 'Post-Delivery Maintenance Retainer',
    badgeLabel: 'MAINTENANCE RETAINER',
    badgeVariant: 'success' as const,
    colorTheme: 'emerald',
    headline: 'Delivered project operating under active SLA support retainer.',
    nextAction: 'Monitor retainer requests and bug warranties.',
    recommendTab: 'overview',
  };
}

export function ProjectStageBanner({
  project,
  meetings = [],
  proposals = [],
  contacts = [],
  onNavigateTab,
}: {
  project: Project;
  meetings?: ProjectMeeting[];
  proposals?: ProjectProposal[];
  contacts?: ProjectContact[];
  onNavigateTab?: (tab: string) => void;
}) {
  const info = getProjectLifecycleDetails(project, meetings, proposals, contacts);

  const steps = [
    { num: 1, label: '1. Discovery Meeting', active: info.stepNumber === 1, done: info.stepNumber > 1 && info.phase !== 'on_hold' },
    { num: 2, label: '2. Proposal & Pricing', active: info.stepNumber === 2, done: info.stepNumber > 2 && info.phase !== 'on_hold' },
    { num: 3, label: '3. Scope & SOW', active: info.stepNumber === 3, done: info.stepNumber > 3 && info.phase !== 'on_hold' },
    { num: 4, label: '4. Active Execution', active: info.stepNumber === 4, done: info.stepNumber > 4 && info.phase !== 'on_hold' },
  ];

  return (
    <div
      className={`rounded-xl border p-4 text-xs transition-all ${
        info.phase === 'presales_discovery'
          ? 'border-blue-200 bg-blue-50/50 text-blue-950'
          : info.phase === 'presales_proposal'
          ? 'border-amber-200 bg-amber-50/50 text-amber-950'
          : info.phase === 'on_hold'
          ? 'border-purple-200 bg-purple-50/50 text-purple-950'
          : info.phase === 'archived'
          ? 'border-zinc-300 bg-zinc-100/70 text-zinc-900'
          : 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
      }`}
    >
      {/* Top Bar: Visual Step Track */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-black/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[11px] opacity-75">
            WHERE ARE WE RIGHT NOW:
          </span>
          <Badge variant={info.badgeVariant} className="font-bold tracking-wide">
            {info.stepTitle}
          </Badge>
        </div>

        {/* 4-Step Visual Tracker */}
        {info.phase !== 'on_hold' && info.phase !== 'archived' && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {steps.map((step, idx) => (
              <React.Fragment key={step.num}>
                {idx > 0 && <span className="text-zinc-300">→</span>}
                <span
                  className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${
                    step.active
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : step.done
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'text-zinc-400 bg-black/5'
                  }`}
                >
                  {step.done ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : null}
                  {step.label}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {info.phase === 'on_hold' && (
          <div className="flex items-center gap-1.5 text-purple-800 font-semibold text-[11px]">
            <PauseCircle className="h-4 w-4 text-purple-600" />
            Project is in Drafts / On-Hold Status
          </div>
        )}
      </div>

      {/* Bottom Summary: Exactly what happened and what to do next */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3">
        <div className="space-y-1 max-w-3xl">
          <div className="font-semibold text-zinc-900 text-sm">
            {info.headline}
          </div>
          <div className="text-zinc-600 text-xs">
            <span className="font-medium text-zinc-900">Next Action Required: </span>
            {info.nextAction}
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab(info.recommendTab)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 shadow-2xs transition-colors cursor-pointer"
          >
            Go to {info.recommendTab.toUpperCase()} Tab →
          </button>
        )}
      </div>
    </div>
  );
}
