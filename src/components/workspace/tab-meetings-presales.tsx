'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  XCircle,
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
import { formatTimestamp } from '@/lib/utils';
import type { MeetingOutcome, Project } from '@/types/agency';

export function TabMeetingsPreSales({ project }: { project: Project }) {
  const {
    currentUser,
    permissions,
    meetings,
    contacts,
    createMeeting,
    recordMeetingOutcome,
  } = useAuth();

  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [solutionNotes, setSolutionNotes] = useState('');
  const [goals, setGoals] = useState('');
  const [notes, setNotes] = useState('');

  // Outcome Modal State
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [outcomeAction, setOutcomeAction] = useState<MeetingOutcome | null>(null);
  const [outcomeDate, setOutcomeDate] = useState('');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [reminderContactId, setReminderContactId] = useState('');
  const [reminderCopied, setReminderCopied] = useState<'email' | 'whatsapp' | null>(null);

  const projectMeetings = meetings
    .filter((m) => m.project_id === project.id)
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));

  const projectContacts = contacts.filter((c) => c.project_id === project.id);
  const primaryContact =
    projectContacts.find((c) => c.is_primary) || projectContacts[0];

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) return;

    createMeeting({
      project_id: project.id,
      title,
      scheduled_at: scheduledAt,
      pain_points: painPoints,
      solution_notes: solutionNotes,
      expectations_goals: goals,
      general_notes: notes,
    });

    setTitle('');
    setScheduledAt('');
    setPainPoints('');
    setSolutionNotes('');
    setGoals('');
    setNotes('');
    setShowNewMeeting(false);
  };

  const handleOpenOutcome = (meetingId: string, action: MeetingOutcome) => {
    setActiveMeetingId(meetingId);
    setOutcomeAction(action);
    setOutcomeDate(new Date().toISOString().slice(0, 16));
    setOutcomeNote('');
    setReminderContactId(primaryContact?.id || '');
    setReminderCopied(null);
  };

  const handleConfirmOutcome = () => {
    if (!activeMeetingId || !outcomeAction) return;

    recordMeetingOutcome({
      meeting_id: activeMeetingId,
      outcome: outcomeAction,
      outcome_at: outcomeDate || new Date().toISOString(),
      outcome_note: outcomeNote.trim(),
      reschedule_date: outcomeAction === 'rescheduled' ? outcomeDate : undefined,
      remainder_date: outcomeAction === 'remainder' ? outcomeDate : undefined,
    });

    setActiveMeetingId(null);
    setOutcomeAction(null);
  };

  const selectedReminderContact =
    projectContacts.find((c) => c.id === reminderContactId) || primaryContact;

  const emailTemplate = getEmailReminderTemplate({
    clientName: project.client_name,
    projectName: project.title,
    contactName: selectedReminderContact?.name || 'Client Lead',
    stage: 'meeting',
  });

  const whatsAppTemplate = getWhatsAppReminderTemplate({
    clientName: project.client_name,
    projectName: project.title,
    contactName: selectedReminderContact?.name || 'Client Lead',
    stage: 'meeting',
  });

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Meetings, Discovery &amp; Deal Progression
          </h2>
          <p className="text-xs text-zinc-500">
            Record pain points, capture live solutions, schedule meetings, and
            transition approved deals to proposals or drafts.
          </p>
        </div>
        {permissions.canManageMeetingsAndProposals && (
          <Button size="sm" onClick={() => setShowNewMeeting((v) => !v)}>
            <Plus className="h-3.5 w-3.5" /> Schedule / Log Meeting
          </Button>
        )}
      </div>

      {/* New Meeting Form */}
      {showNewMeeting && (
        <Card className="border-blue-200 bg-blue-50/20">
          <CardHeader>
            <CardTitle className="text-sm">
              Schedule or Record Client Discovery Meeting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMeeting} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Meeting Title *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Discovery & Technical Needs Analysis"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Meeting Date &amp; Time *
                  </label>
                  <Input
                    required
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Client Pain Points Heard
                  </label>
                  <textarea
                    rows={2}
                    placeholder="What problems, friction, or legacy issues is the client facing?"
                    className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900 placeholder:text-zinc-400"
                    value={painPoints}
                    onChange={(e) => setPainPoints(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Solutions &amp; Architectural Approach Given
                  </label>
                  <textarea
                    rows={2}
                    placeholder="What did we propose as the optimal tech stack, roadmap, or strategy?"
                    className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900 placeholder:text-zinc-400"
                    value={solutionNotes}
                    onChange={(e) => setSolutionNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Client Goals &amp; Success Metrics
                  </label>
                  <Input
                    placeholder="e.g. 30% increase in checkout conversion, sub-1s latency"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    General Meeting Notes
                  </label>
                  <Input
                    placeholder="Key questions asked, stakeholders present, immediate next steps"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewMeeting(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Meeting Notes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Meetings List */}
      <div className="space-y-3">
        {projectMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-xs text-zinc-500">
              No discovery or scoping meetings logged for this project yet.
            </CardContent>
          </Card>
        ) : (
          projectMeetings.map((meeting) => (
            <Card key={meeting.id} className="transition-all hover:border-zinc-300">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-500" />
                    <h3 className="text-sm font-semibold text-zinc-900">
                      {meeting.title}
                    </h3>
                    <Badge
                      variant={
                        meeting.outcome === 'approved'
                          ? 'success'
                          : meeting.outcome === 'denied'
                          ? 'danger'
                          : meeting.outcome === 'rescheduled'
                          ? 'warning'
                          : meeting.outcome === 'remainder'
                          ? 'purple'
                          : 'secondary'
                      }
                    >
                      {meeting.outcome.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-500">
                    Scheduled: {formatTimestamp(meeting.scheduled_at)}
                  </div>
                </div>

                {/* Notes Grid */}
                <div className="grid gap-3 text-xs md:grid-cols-3">
                  {meeting.pain_points && (
                    <div className="rounded-md bg-red-50/60 p-2.5">
                      <div className="font-semibold text-red-900 pb-0.5">
                        Client Pain Points:
                      </div>
                      <p className="text-red-800 leading-relaxed">
                        {meeting.pain_points}
                      </p>
                    </div>
                  )}

                  {meeting.solution_notes && (
                    <div className="rounded-md bg-emerald-50/60 p-2.5">
                      <div className="font-semibold text-emerald-900 pb-0.5">
                        Solutions &amp; Strategy:
                      </div>
                      <p className="text-emerald-800 leading-relaxed">
                        {meeting.solution_notes}
                      </p>
                    </div>
                  )}

                  {meeting.expectations_goals && (
                    <div className="rounded-md bg-blue-50/60 p-2.5">
                      <div className="font-semibold text-blue-900 pb-0.5">
                        Targets &amp; Goals:
                      </div>
                      <p className="text-blue-800 leading-relaxed">
                        {meeting.expectations_goals}
                      </p>
                    </div>
                  )}
                </div>

                {meeting.general_notes && (
                  <p className="text-xs text-zinc-600 italic">
                    Notes: {meeting.general_notes}
                  </p>
                )}

                {/* Outcome Display or Action Buttons */}
                {meeting.outcome_note && (
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-700">
                    <span className="font-semibold text-zinc-900">
                      Outcome Note ({formatTimestamp(meeting.outcome_at || '')}):
                    </span>{' '}
                    {meeting.outcome_note}
                  </div>
                )}

                {/* Step 2 Buttons (Approved, Denied, Rescheduled, Remainder) */}
                {permissions.canManageMeetingsAndProposals && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2.5">
                    <span className="text-[11px] font-medium text-zinc-500">
                      Record Next Step / Deal Progression:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant={meeting.outcome === 'approved' ? 'default' : 'outline'}
                        className="text-xs text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleOpenOutcome(meeting.id, 'approved')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Approved (Advance to Proposal)
                      </Button>

                      <Button
                        size="sm"
                        variant={meeting.outcome === 'denied' ? 'default' : 'outline'}
                        className="text-xs text-red-700 hover:bg-red-50"
                        onClick={() => handleOpenOutcome(meeting.id, 'denied')}
                      >
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                        Denied (Save to Drafts)
                      </Button>

                      <Button
                        size="sm"
                        variant={meeting.outcome === 'rescheduled' ? 'default' : 'outline'}
                        className="text-xs text-amber-700 hover:bg-amber-50"
                        onClick={() => handleOpenOutcome(meeting.id, 'rescheduled')}
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                        Reschedule
                      </Button>

                      <Button
                        size="sm"
                        variant={meeting.outcome === 'remainder' ? 'default' : 'outline'}
                        className="text-xs text-violet-700 hover:bg-violet-50"
                        onClick={() => handleOpenOutcome(meeting.id, 'remainder')}
                      >
                        <Clock className="h-3.5 w-3.5 text-violet-600" />
                        Remainder (Follow-Up)
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Outcome Confirmation Modal */}
      {outcomeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                Record Outcome: {outcomeAction.toUpperCase()}
              </h3>
              <Badge variant="outline">{project.title}</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-zinc-700">
                  {outcomeAction === 'rescheduled'
                    ? 'New Rescheduled Meeting Date & Time *'
                    : outcomeAction === 'remainder'
                    ? 'Target Follow-up Reminder Date *'
                    : 'Decision Date & Time'}
                </label>
                <Input
                  type="datetime-local"
                  value={outcomeDate}
                  onChange={(e) => setOutcomeDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-zinc-700">
                  {outcomeAction === 'approved'
                    ? 'Acceptance Note (What agreed terms moved this to proposals?)'
                    : outcomeAction === 'denied'
                    ? 'Reason for Denial (Helps identify mistakes & future improvements) *'
                    : outcomeAction === 'rescheduled'
                    ? 'Reschedule Reason & Prep Notes for Next Session'
                    : 'Remainder Context & Notes'}
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900"
                  placeholder="Record detailed notes here..."
                  value={outcomeNote}
                  onChange={(e) => setOutcomeNote(e.target.value)}
                />
              </div>

              {/* Remainder Template Helper (Email + WhatsApp) */}
              {outcomeAction === 'remainder' && (
                <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-violet-900">
                      Automated Client Remainder Templates
                    </span>
                    {projectContacts.length > 0 && (
                      <select
                        className="rounded border border-violet-200 bg-white px-2 py-1 text-[11px]"
                        value={reminderContactId}
                        onChange={(e) => setReminderContactId(e.target.value)}
                      >
                        {projectContacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.role})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="rounded bg-white p-2 border border-violet-100">
                      <div className="flex items-center justify-between pb-1">
                        <span className="font-medium text-zinc-800 flex items-center gap-1">
                          <Send className="h-3 w-3 text-blue-600" /> Email Follow-up
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 text-[10px]"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${emailTemplate.subject}\n\n${emailTemplate.body}`
                            );
                            setReminderCopied('email');
                            setTimeout(() => setReminderCopied(null), 1500);
                          }}
                        >
                          {reminderCopied === 'email' ? 'Copied!' : 'Copy Email'}
                        </Button>
                      </div>
                      <p className="text-[11px] text-zinc-600 whitespace-pre-line line-clamp-3">
                        {emailTemplate.body}
                      </p>
                    </div>

                    <div className="rounded bg-white p-2 border border-violet-100">
                      <div className="flex items-center justify-between pb-1">
                        <span className="font-medium text-zinc-800 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-emerald-600" /> WhatsApp Template
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 text-[10px]"
                          onClick={() => {
                            navigator.clipboard.writeText(whatsAppTemplate);
                            setReminderCopied('whatsapp');
                            setTimeout(() => setReminderCopied(null), 1500);
                          }}
                        >
                          {reminderCopied === 'whatsapp' ? 'Copied!' : 'Copy WhatsApp'}
                        </Button>
                      </div>
                      <p className="text-[11px] text-zinc-600 line-clamp-2">
                        {whatsAppTemplate}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOutcomeAction(null)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmOutcome}>
                Save Outcome &amp; Route Deal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
