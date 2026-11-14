'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowRight,
  Clock,
  PlayCircle,
  RefreshCw,
  Send,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  getEmailReminderTemplate,
  getWhatsAppReminderTemplate,
} from '@/lib/reminder-templates';
import { formatDate } from '@/lib/utils';
import type { Project } from '@/types/agency';

export default function DraftsDealsPage() {
  const {
    accessibleProjects,
    meetings,
    proposals,
    contacts,
    reopenDraftProject,
    permissions,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'presales' | 'drafts'>('presales');
  const [reopenTarget, setReopenTarget] = useState<Project | null>(null);
  const [targetStage, setTargetStage] = useState<
    'Meeting Scheduled' | 'Proposal Review' | 'Intake' | 'In Execution'
  >('Meeting Scheduled');
  const [reopenNote, setReopenNote] = useState('');
  const [reminderProject, setReminderProject] = useState<Project | null>(null);
  const [reminderCopied, setReminderCopied] = useState<'email' | 'whatsapp' | null>(null);

  // Pre-Sales includes projects in 'Lead/Discovery', 'Meeting Scheduled', 'Proposal Drafted', 'Proposal Review'
  const preSalesProjects = accessibleProjects.filter(
    (p) =>
      p.status === 'Lead/Discovery' ||
      p.status === 'Meeting Scheduled' ||
      p.status === 'Proposal Drafted' ||
      p.status === 'Proposal Review'
  );

  // Drafts includes projects flagged as 'Draft / On Hold'
  const draftProjects = accessibleProjects.filter(
    (p) => p.status === 'Draft / On Hold'
  );

  const handleConfirmReopen = () => {
    if (!reopenTarget) return;
    reopenDraftProject(reopenTarget.id, targetStage, reopenNote);
    setReopenTarget(null);
  };

  const getPrimaryContact = (projectId: string) => {
    const list = contacts.filter((c) => c.project_id === projectId);
    return list.find((c) => c.is_primary) || list[0];
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 flex items-center gap-2">
            <Archive className="h-5 w-5 text-zinc-600" />
            Pre-Sales Pipeline &amp; On-Hold Drafts
          </h1>
          <p className="text-xs text-zinc-500">
            Never start from scratch: manage active discovery meetings &amp; proposals,
            or revive postponed deals right where you left off.
          </p>
        </div>
      </div>

      {/* Tabs: Pre-Sales FIRST, then On-Hold Drafts */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-px">
        <button
          onClick={() => setActiveTab('presales')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium cursor-pointer ${
            activeTab === 'presales'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <PlayCircle className="h-3.5 w-3.5 text-blue-600" />
          Pre-Sales &amp; Negotiations Pipeline ({preSalesProjects.length})
        </button>

        <button
          onClick={() => setActiveTab('drafts')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium cursor-pointer ${
            activeTab === 'drafts'
              ? 'border-purple-600 text-purple-700 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Archive className="h-3.5 w-3.5 text-purple-600" />
          On-Hold &amp; Denied Drafts ({draftProjects.length})
        </button>
      </div>

      {/* View 1: Active Pre-Sales Pipeline (FIRST) */}
      {activeTab === 'presales' && (
        <div className="space-y-4">
          {preSalesProjects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-xs text-zinc-500">
                No deals currently in pre-sales discovery. Use &ldquo;+ New Project&rdquo; to start one!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {preSalesProjects.map((project) => {
                const projectMeetings = meetings.filter((m) => m.project_id === project.id);
                const projectProposals = proposals.filter((p) => p.project_id === project.id);
                const projectContacts = contacts.filter((c) => c.project_id === project.id);

                return (
                  <Card key={project.id} className="border-blue-200 bg-blue-50/20 hover:border-blue-400 transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold text-zinc-900">
                          {project.title}
                        </CardTitle>
                        <Badge variant="info">
                          {project.status === 'Meeting Scheduled'
                            ? 'MEETING SCHEDULED'
                            : project.status === 'Proposal Review'
                            ? 'PROPOSAL IN REVIEW'
                            : 'LEAD / DISCOVERY'}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Client: <strong className="text-zinc-700">{project.client_name}</strong> · Type: {project.project_type}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-1 text-xs">
                      <div className="rounded-md bg-white p-2.5 border border-blue-100 space-y-1">
                        <span className="font-semibold text-blue-950">Current Status:</span>
                        <p className="text-zinc-600">
                          {projectMeetings.length > 0
                            ? `${projectMeetings.length} discovery meetings logged. Latest: "${projectMeetings[0].title}".`
                            : 'Discovery phase. Open workspace to schedule meeting.'}
                        </p>
                        {projectProposals.length > 0 && (
                          <p className="text-emerald-700 font-medium">
                            ✓ Proposal built: ${projectProposals[0].total_one_time_cost.toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                        <span>{projectContacts.length} Contacts</span>
                        <span>Target: {formatDate(project.target_end_date)}</span>
                      </div>

                      <div className="flex items-center justify-between border-t border-blue-100 pt-2.5">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          Open Pre-Sales Workspace <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View 2: Drafts & On-Hold (SECOND) */}
      {activeTab === 'drafts' && (
        <div className="space-y-4">
          {draftProjects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-xs text-zinc-500">
                No projects are currently in drafts or on-hold. Any deal denied
                or postponed during meetings or proposals will be safely
                archived here.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {draftProjects.map((project) => {
                const projectContacts = contacts.filter(
                  (c) => c.project_id === project.id
                );
                const projectMeetings = meetings.filter(
                  (m) => m.project_id === project.id
                );
                const projectProposals = proposals.filter(
                  (p) => p.project_id === project.id
                );

                return (
                  <Card key={project.id} className="relative border-zinc-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-semibold text-zinc-900">
                            {project.title}
                          </CardTitle>
                          <p className="text-xs text-zinc-500">
                            Client: {project.client_name} · Type:{' '}
                            {project.project_type}
                          </p>
                        </div>
                        <Badge variant="purple">DRAFT / ON-HOLD</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-1 text-xs">
                      {project.draft_reason && (
                        <div className="rounded-md border border-purple-200 bg-purple-50/50 p-2.5 text-purple-900">
                          <span className="font-semibold">Reason On-Hold:</span>{' '}
                          {project.draft_reason}
                        </div>
                      )}

                      {/* Contacts & Activity summary */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded bg-zinc-50 p-2 border border-zinc-100">
                          <div className="font-bold text-zinc-900">
                            {projectContacts.length}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Contacts Saved
                          </div>
                        </div>
                        <div className="rounded bg-zinc-50 p-2 border border-zinc-100">
                          <div className="font-bold text-zinc-900">
                            {projectMeetings.length}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Meetings Logged
                          </div>
                        </div>
                        <div className="rounded bg-zinc-50 p-2 border border-zinc-100">
                          <div className="font-bold text-zinc-900">
                            {projectProposals.length}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Proposals Built
                          </div>
                        </div>
                      </div>

                      {project.remainder_next_date && (
                        <div className="flex items-center justify-between text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-200">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            Next Reminder: {formatDate(project.remainder_next_date)}
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 text-[10px]"
                            onClick={() => setReminderProject(project)}
                          >
                            Send Reminder
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-blue-600 hover:underline flex items-center gap-1 text-xs font-medium"
                        >
                          Inspect Workspace <ArrowRight className="h-3 w-3" />
                        </Link>

                        {permissions.canCreateProject && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setReopenTarget(project);
                              setTargetStage(
                                project.draft_source_stage === 'proposal'
                                  ? 'Proposal Review'
                                  : 'Meeting Scheduled'
                              );
                              setReopenNote('');
                            }}
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Reopen &amp;
                            Resume Deal
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reopen Modal */}
      {reopenTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                Reopen &amp; Resume Deal: {reopenTarget.title}
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-zinc-600">
                Resume this deal exactly where it was stopped. Choose which
                stage to place the project back into:
              </p>

              <div className="space-y-1">
                <label className="font-medium text-zinc-700">
                  Target Pipeline Stage
                </label>
                <select
                  className="h-9 w-full rounded border border-zinc-200 bg-white px-2 text-xs"
                  value={targetStage}
                  onChange={(e) =>
                    setTargetStage(
                      e.target.value as
                        | 'Meeting Scheduled'
                        | 'Proposal Review'
                        | 'Intake'
                        | 'In Execution'
                    )
                  }
                >
                  <option value="Meeting Scheduled">
                    Meeting Scheduled (Client wants another call)
                  </option>
                  <option value="Proposal Review">
                    Proposal Review (Client ready to review proposal)
                  </option>
                  <option value="Intake">
                    Intake &amp; Scoping (Approved deal starting intake)
                  </option>
                  <option value="In Execution">
                    In Execution (Contract signed, begin delivery)
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-zinc-700">
                  Reopen Note (Context)
                </label>
                <Input
                  placeholder="e.g. Client secured Q1 budget and requested updated SOW"
                  value={reopenNote}
                  onChange={(e) => setReopenNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReopenTarget(null)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmReopen}>
                Reopen Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Templates Dialog */}
      {reminderProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                Client Remainder: {reminderProject.title}
              </h3>
              <Badge variant="outline">{reminderProject.client_name}</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded bg-zinc-50 p-3 border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-blue-600" /> Email
                    Template
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px]"
                    onClick={() => {
                      const t = getEmailReminderTemplate({
                        clientName: reminderProject.client_name,
                        projectName: reminderProject.title,
                        contactName:
                          getPrimaryContact(reminderProject.id)?.name ||
                          'Client Lead',
                        stage: 'draft',
                      });
                      navigator.clipboard.writeText(`${t.subject}\n\n${t.body}`);
                      setReminderCopied('email');
                      setTimeout(() => setReminderCopied(null), 1500);
                    }}
                  >
                    {reminderCopied === 'email' ? 'Copied!' : 'Copy Email'}
                  </Button>
                </div>
                <p className="text-zinc-600 whitespace-pre-line text-[11px]">
                  {
                    getEmailReminderTemplate({
                      clientName: reminderProject.client_name,
                      projectName: reminderProject.title,
                      contactName:
                        getPrimaryContact(reminderProject.id)?.name ||
                        'Client Lead',
                      stage: 'draft',
                    }).body
                  }
                </p>
              </div>

              <div className="rounded bg-zinc-50 p-3 border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                    WhatsApp Template
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px]"
                    onClick={() => {
                      const t = getWhatsAppReminderTemplate({
                        clientName: reminderProject.client_name,
                        projectName: reminderProject.title,
                        contactName:
                          getPrimaryContact(reminderProject.id)?.name ||
                          'Client Lead',
                        stage: 'draft',
                      });
                      navigator.clipboard.writeText(t);
                      setReminderCopied('whatsapp');
                      setTimeout(() => setReminderCopied(null), 1500);
                    }}
                  >
                    {reminderCopied === 'whatsapp' ? 'Copied!' : 'Copy WhatsApp'}
                  </Button>
                </div>
                <p className="text-zinc-600 text-[11px]">
                  {getWhatsAppReminderTemplate({
                    clientName: reminderProject.client_name,
                    projectName: reminderProject.title,
                    contactName:
                      getPrimaryContact(reminderProject.id)?.name ||
                      'Client Lead',
                    stage: 'draft',
                  })}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReminderProject(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
