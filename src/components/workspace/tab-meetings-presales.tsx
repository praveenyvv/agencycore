'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ModernDateTimePicker,
  getCurrentLocalDateTimeString,
} from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import {
  getEmailReminderTemplate,
  getWhatsAppReminderTemplate,
} from '@/lib/reminder-templates';
import { formatTimestamp } from '@/lib/utils';
import type { MeetingOutcome, Project, ProjectMeeting } from '@/types/agency';

export function TabMeetingsPreSales({ project }: { project: Project }) {
  const {
    permissions,
    meetings,
    contacts,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    recordMeetingOutcome,
  } = useAuth();

  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [meetingMode, setMeetingMode] = useState<'presales' | 'general'>('presales');
  const [editingMeeting, setEditingMeeting] = useState<ProjectMeeting | null>(null);

  // Add form fields
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState(() => getCurrentLocalDateTimeString());
  const [painPoints, setPainPoints] = useState('');
  const [solutionNotes, setSolutionNotes] = useState('');
  const [goals, setGoals] = useState('');
  const [notes, setNotes] = useState('');

  // Edit form fields
  const [editTitle, setEditTitle] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editPainPoints, setEditPainPoints] = useState('');
  const [editSolutionNotes, setEditSolutionNotes] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Outcome Modal State
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [outcomeAction, setOutcomeAction] = useState<MeetingOutcome | null>(null);
  const [outcomeDate, setOutcomeDate] = useState('');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [isChangingDecision, setIsChangingDecision] = useState(false);
  const [reminderContactId, setReminderContactId] = useState('');
  const [reminderCopied, setReminderCopied] = useState<'email' | 'whatsapp' | null>(null);

  const projectMeetings = meetings
    .filter((m) => m.project_id === project.id)
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));

  // Determine if project has an already approved meeting
  const hasApprovedDiscovery = projectMeetings.some(
    (m) => !m.is_general_session && m.outcome === 'approved'
  );

  const projectContacts = contacts.filter((c) => c.project_id === project.id);
  const primaryContact =
    projectContacts.find((c) => c.is_primary) || projectContacts[0];

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    const finalScheduledAt = scheduledAt || getCurrentLocalDateTimeString();
    if (!title.trim() || !finalScheduledAt) return;

    const isGeneral = hasApprovedDiscovery || meetingMode === 'general';

    createMeeting({
      project_id: project.id,
      title,
      scheduled_at: finalScheduledAt,
      is_general_session: isGeneral,
      pain_points: isGeneral ? undefined : painPoints,
      solution_notes: isGeneral ? undefined : solutionNotes,
      expectations_goals: isGeneral ? undefined : goals,
      general_notes: notes,
    });

    setTitle('');
    setScheduledAt(getCurrentLocalDateTimeString());
    setPainPoints('');
    setSolutionNotes('');
    setGoals('');
    setNotes('');
    setShowNewMeeting(false);
  };

  const startEdit = (m: ProjectMeeting) => {
    setEditingMeeting(m);
    setEditTitle(m.title);
    setEditScheduledAt(m.scheduled_at ? m.scheduled_at.slice(0, 16) : '');
    setEditPainPoints(m.pain_points || '');
    setEditSolutionNotes(m.solution_notes || '');
    setEditGoals(m.expectations_goals || '');
    setEditNotes(m.general_notes || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting || !editTitle.trim()) return;

    updateMeeting(editingMeeting.id, {
      title: editTitle.trim(),
      scheduled_at: editScheduledAt,
      pain_points: editPainPoints.trim(),
      solution_notes: editSolutionNotes.trim(),
      expectations_goals: editGoals.trim(),
      general_notes: editNotes.trim(),
    });

    setEditingMeeting(null);
  };

  const handleOpenOutcome = (
    meetingId: string,
    action: MeetingOutcome,
    isChange = false
  ) => {
    setActiveMeetingId(meetingId);
    setOutcomeAction(action);
    setOutcomeDate(getCurrentLocalDateTimeString());
    setOutcomeNote('');
    setIsChangingDecision(isChange);
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
      is_edit: isChangingDecision,
      reschedule_date: outcomeAction === 'rescheduled' ? outcomeDate : undefined,
      remainder_date: outcomeAction === 'remainder' ? outcomeDate : undefined,
    });

    setActiveMeetingId(null);
    setOutcomeAction(null);
    setIsChangingDecision(false);
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
            Meetings &amp; Discussion Records ({projectMeetings.length})
          </h2>
          <p className="text-xs text-zinc-500">
            {hasApprovedDiscovery
              ? 'Discovery approved! Any subsequent sessions logged here are general insight / review meetings without traditional approval gates.'
              : 'Initial Discovery stage: record client pain points, solutions, and choose deal progression (Approved, Denied, Rescheduled, Remainder).'}
          </p>
        </div>
        {permissions.canManageMeetingsAndProposals && (
          <Button
            size="sm"
            onClick={() => {
              setMeetingMode(hasApprovedDiscovery ? 'general' : 'presales');
              setScheduledAt(getCurrentLocalDateTimeString());
              setShowNewMeeting((v) => !v);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {showNewMeeting
              ? 'Close'
              : hasApprovedDiscovery
              ? 'Log General Insight Meeting'
              : 'Schedule / Log Discovery Meeting'}
          </Button>
        )}
      </div>

      {/* New Meeting Form */}
      {showNewMeeting && (
        <Card className="border-blue-200 bg-blue-50/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>
                {hasApprovedDiscovery
                  ? 'Log General Insight / Progress Review Meeting'
                  : 'Schedule or Record Client Discovery Meeting'}
              </span>
              <Badge variant={hasApprovedDiscovery ? 'secondary' : 'info'}>
                {hasApprovedDiscovery ? 'GENERAL SESSION' : 'DISCOVERY SESSION'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Meeting Title *
                  </label>
                  <Input
                    required
                    placeholder={
                      hasApprovedDiscovery
                        ? 'e.g. Weekly Architecture Review & Insights'
                        : 'e.g. Discovery & Technical Needs Analysis'
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Modern Date Time Picker */}
                <ModernDateTimePicker
                  label="Meeting Date & Time"
                  required
                  value={scheduledAt}
                  onChange={(val) => setScheduledAt(val)}
                />
              </div>

              {!hasApprovedDiscovery ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        Client Pain Points Heard
                      </label>
                      <textarea
                        rows={2}
                        placeholder="What problems, friction, or legacy issues is the client facing?"
                        className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900 placeholder:text-zinc-400 bg-white"
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
                        className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900 placeholder:text-zinc-400 bg-white"
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
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Discussion Summary &amp; Information Exchange Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Document insights, client feedback on current deliverables, scope clarifications, and notes from this sync..."
                    className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900 placeholder:text-zinc-400 bg-white"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewMeeting(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Meeting
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Meeting Modal */}
      {editingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                Edit Meeting: {editingMeeting.title}
              </h3>
              <button
                type="button"
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                onClick={() => setEditingMeeting(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Meeting Title *</label>
                <Input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <ModernDateTimePicker
                label="Meeting Date & Time"
                required
                value={editScheduledAt}
                onChange={(val) => setEditScheduledAt(val)}
              />

              {!editingMeeting.is_general_session ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Pain Points</label>
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900"
                      value={editPainPoints}
                      onChange={(e) => setEditPainPoints(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Solution Approach</label>
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900"
                      value={editSolutionNotes}
                      onChange={(e) => setEditSolutionNotes(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">Goals</label>
                      <Input
                        value={editGoals}
                        onChange={(e) => setEditGoals(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">Notes</label>
                      <Input
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Session Notes</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMeeting(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meetings List */}
      <div className="space-y-3">
        {projectMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-xs text-zinc-500">
              No meetings logged for this project yet.
            </CardContent>
          </Card>
        ) : (
          projectMeetings.map((meeting) => {
            const isGeneral = Boolean(meeting.is_general_session);
            const hasDecidedOutcome = meeting.outcome !== 'scheduled';

            return (
              <Card key={meeting.id} className="transition-all hover:border-zinc-300">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <h3 className="text-sm font-semibold text-zinc-900">
                        {meeting.title}
                      </h3>
                      {isGeneral ? (
                        <Badge variant="secondary">GENERAL INSIGHT SESSION</Badge>
                      ) : (
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
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 font-mono">
                        {formatTimestamp(meeting.scheduled_at)}
                      </span>
                      {permissions.canManageMeetingsAndProposals && (
                        <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200">
                          <button
                            type="button"
                            className="text-zinc-500 hover:text-zinc-900 cursor-pointer p-1"
                            title="Edit Meeting"
                            onClick={() => startEdit(meeting)}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                            title="Delete Meeting"
                            onClick={() => {
                              if (confirm('Delete this meeting and its records?')) {
                                deleteMeeting(meeting.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Discovery Meeting Details Grid */}
                  {!isGeneral ? (
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
                  ) : null}

                  {meeting.general_notes && (
                    <p className="text-xs text-zinc-700 bg-zinc-50/80 p-2.5 rounded-md border border-zinc-100">
                      <span className="font-semibold text-zinc-900">Notes: </span>
                      {meeting.general_notes}
                    </p>
                  )}

                  {/* Outcome Note & Edited By Tracker Indicator */}
                  {meeting.outcome_note && (
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-700 space-y-1">
                      <div>
                        <span className="font-semibold text-zinc-900">
                          Recorded Decision:
                        </span>{' '}
                        {meeting.outcome_note}
                      </div>
                      {meeting.decision_edited_by && (
                        <div className="text-[11px] text-amber-700 font-medium">
                          ⚠ Decision modified by {meeting.decision_edited_by} on{' '}
                          {formatTimestamp(meeting.decision_edited_at || '')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Traditional 4 Options: ONLY shown on initial Discovery sessions if not yet approved */}
                  {!isGeneral && permissions.canManageMeetingsAndProposals && (
                    <div className="border-t border-zinc-100 pt-2.5">
                      {hasDecidedOutcome ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-zinc-500 font-medium">Outcome Selected:</span>
                          <span className="font-bold text-zinc-800 flex items-center gap-1.5 capitalize">
                            {meeting.outcome === 'approved' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                            {meeting.outcome === 'denied' && <XCircle className="h-4 w-4 text-red-600" />}
                            {meeting.outcome === 'rescheduled' && <RefreshCw className="h-4 w-4 text-amber-600" />}
                            {meeting.outcome === 'remainder' && <Clock className="h-4 w-4 text-violet-600" />}
                            {meeting.outcome}
                          </span>
                          <button
                            type="button"
                            className="text-[11px] text-blue-600 hover:underline ml-2 cursor-pointer font-medium"
                            onClick={() => handleOpenOutcome(meeting.id, meeting.outcome, true)}
                          >
                            (Change Decision)
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-zinc-500">
                            Select Next Step for this Meeting:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleOpenOutcome(meeting.id, 'approved')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Approved (Advance to Proposal)
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-red-700 hover:bg-red-50"
                              onClick={() => handleOpenOutcome(meeting.id, 'denied')}
                            >
                              <XCircle className="h-3.5 w-3.5 text-red-600" />
                              Denied (Save to Drafts)
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-amber-700 hover:bg-amber-50"
                              onClick={() => handleOpenOutcome(meeting.id, 'rescheduled')}
                            >
                              <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                              Reschedule
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-violet-700 hover:bg-violet-50"
                              onClick={() => handleOpenOutcome(meeting.id, 'remainder')}
                            >
                              <Clock className="h-3.5 w-3.5 text-violet-600" />
                              Remainder (Follow-Up)
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Outcome Confirmation Modal */}
      {outcomeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                {isChangingDecision ? 'Change Decision: ' : 'Record Outcome: '}
                {outcomeAction.toUpperCase()}
              </h3>
              <Badge variant="outline">{project.title}</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <ModernDateTimePicker
                label={
                  outcomeAction === 'rescheduled'
                    ? 'New Rescheduled Meeting Date & Time'
                    : outcomeAction === 'remainder'
                    ? 'Target Follow-up Reminder Date'
                    : 'Decision Date & Time'
                }
                required
                value={outcomeDate}
                onChange={(val) => setOutcomeDate(val)}
              />

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
                onClick={() => {
                  setOutcomeAction(null);
                  setIsChangingDecision(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmOutcome}>
                {isChangingDecision ? 'Update Decision' : 'Save Outcome & Route Deal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
