'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ModernDateTimePicker,
  getCurrentLocalDateTimeString,
} from '@/components/ui/date-time-picker';
import { generateProposalPdf } from '@/lib/proposal-pdf';
import {
  getEmailReminderTemplate,
  getWhatsAppReminderTemplate,
} from '@/lib/reminder-templates';
import { formatTimestamp } from '@/lib/utils';
import type {
  Project,
  ProjectProposal,
  ProposalOutcome,
  ProposalPricingItem,
} from '@/types/agency';

export function TabProposalBuilder({ project }: { project: Project }) {
  const {
    permissions,
    proposals,
    contacts,
    createProposal,
    updateProposal,
    deleteProposal,
    recordProposalOutcome,
  } = useAuth();

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingProposal, setEditingProposal] = useState<ProjectProposal | null>(null);

  // Form states for Create/Edit
  const [title, setTitle] = useState(
    `${project.title} — Technical Scope & Commercial Proposal`
  );
  const [solutionOverview, setSolutionOverview] = useState(
    'We propose an agile, full-stack architecture customized to solve the client core pain points with high security, zero downtime, and responsive modern UX.'
  );
  const [workflowSchedule, setWorkflowSchedule] = useState(
    'Phase 1 (Sprint 1-2): Architecture, UX prototypes & design tokens.\nPhase 2 (Sprint 3-4): Core engineering & API integrations.\nPhase 3 (Sprint 5-6): Rigorous QA, client review & production handover.'
  );
  const [expectedResults, setExpectedResults] = useState(
    '1. High-performing production system passing all speed benchmarks.\n2. Modular codebase with automated test coverage.\n3. Turnkey staff onboarding and documentation.'
  );
  const [longTermSupport, setLongTermSupport] = useState(
    '30-day post-launch warranty, automated encrypted backups, security patching, and dedicated SLA response time.'
  );
  const [nextReviewDate, setNextReviewDate] = useState('');

  // Pricing Table items
  const [pricingItems, setPricingItems] = useState<
    Array<{
      description: string;
      category: ProposalPricingItem['category'];
      cost: number;
      billing_cycle: 'one-time' | 'monthly' | 'yearly';
    }>
  >([
    {
      description: 'Full-Stack Architecture & Feature Implementation',
      category: 'Development',
      cost: 18000,
      billing_cycle: 'one-time',
    },
    {
      description: 'UI/UX Design Tokens, Wireframes & Component System',
      category: 'Design',
      cost: 6500,
      billing_cycle: 'one-time',
    },
    {
      description: 'Monthly Maintenance, Cloud Hosting & SLA Support Retainer',
      category: 'Subscription / Recurring',
      cost: 1500,
      billing_cycle: 'monthly',
    },
  ]);

  // Outcome modal state
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [outcomeAction, setOutcomeAction] = useState<ProposalOutcome | null>(null);
  const [outcomeDate, setOutcomeDate] = useState('');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [reminderCopied, setReminderCopied] = useState<'email' | 'whatsapp' | null>(null);

  const projectProposals = proposals
    .filter((p) => p.project_id === project.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const projectContacts = contacts.filter((c) => c.project_id === project.id);
  const primaryContact =
    projectContacts.find((c) => c.is_primary) || projectContacts[0];

  const handleAddPricingRow = () => {
    setPricingItems((prev) => [
      ...prev,
      {
        description: 'Custom Service Item',
        category: 'Custom',
        cost: 2000,
        billing_cycle: 'one-time',
      },
    ]);
  };

  const handleRemovePricingRow = (idx: number) => {
    setPricingItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateOrUpdateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || pricingItems.length === 0) return;

    if (editingProposal) {
      let oneTime = 0;
      let recurring = 0;
      const formattedItems: ProposalPricingItem[] = pricingItems.map((pi, idx) => {
        const costNum = Number(pi.cost) || 0;
        if (pi.billing_cycle === 'monthly' || pi.billing_cycle === 'yearly') {
          recurring += costNum;
        } else {
          oneTime += costNum;
        }
        return {
          id: `pi-${idx}-${Date.now()}`,
          description: pi.description,
          category: pi.category,
          cost: costNum,
          billing_cycle: pi.billing_cycle,
          is_recurring: pi.billing_cycle === 'monthly' || pi.billing_cycle === 'yearly',
        };
      });

      updateProposal(editingProposal.id, {
        title: title.trim(),
        solution_overview: solutionOverview.trim(),
        workflow_team_schedule: workflowSchedule.trim(),
        expected_deliverables_results: expectedResults.trim(),
        long_term_support_services: longTermSupport.trim(),
        pricing_items: formattedItems,
        total_one_time_cost: oneTime,
        total_recurring_cost: recurring,
        next_review_meeting_at: nextReviewDate || undefined,
      });

      setEditingProposal(null);
      setShowBuilder(false);
    } else {
      createProposal({
        project_id: project.id,
        title,
        solution_overview: solutionOverview,
        workflow_team_schedule: workflowSchedule,
        expected_deliverables_results: expectedResults,
        long_term_support_services: longTermSupport,
        pricing_items: pricingItems,
        next_review_meeting_at: nextReviewDate || undefined,
      });

      setShowBuilder(false);
    }
  };

  const startEditProposal = (prop: ProjectProposal) => {
    setEditingProposal(prop);
    setTitle(prop.title);
    setSolutionOverview(prop.solution_overview);
    setWorkflowSchedule(prop.workflow_team_schedule);
    setExpectedResults(prop.expected_deliverables_results);
    setLongTermSupport(prop.long_term_support_services);
    setNextReviewDate(prop.next_review_meeting_at || '');
    setPricingItems(
      prop.pricing_items.map((pi) => ({
        description: pi.description,
        category: pi.category,
        cost: pi.cost,
        billing_cycle: pi.billing_cycle || 'one-time',
      }))
    );
    setShowBuilder(true);
  };

  const handleOpenOutcome = (proposalId: string, action: ProposalOutcome) => {
    setActiveProposalId(proposalId);
    setOutcomeAction(action);
    setOutcomeDate(getCurrentLocalDateTimeString());
    setOutcomeNote('');
    setReminderCopied(null);
  };

  const handleConfirmOutcome = () => {
    if (!activeProposalId || !outcomeAction) return;

    recordProposalOutcome({
      proposal_id: activeProposalId,
      outcome: outcomeAction,
      outcome_at: outcomeDate || new Date().toISOString(),
      outcome_note: outcomeNote.trim(),
      reschedule_date: outcomeAction === 'rescheduled' ? outcomeDate : undefined,
      remainder_date: outcomeAction === 'remainder' ? outcomeDate : undefined,
    });

    setActiveProposalId(null);
    setOutcomeAction(null);
  };

  const emailTemplate = getEmailReminderTemplate({
    clientName: project.client_name,
    projectName: project.title,
    contactName: primaryContact?.name || 'Client Lead',
    stage: 'proposal',
  });

  const whatsAppTemplate = getWhatsAppReminderTemplate({
    clientName: project.client_name,
    projectName: project.title,
    contactName: primaryContact?.name || 'Client Lead',
    stage: 'proposal',
  });

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Proposals &amp; Commercial Scope Specification ({projectProposals.length})
          </h2>
          <p className="text-xs text-zinc-500">
            Draft customized solution documents, configure itemized pricing tables,
            generate one-click professional PDFs, and track client approvals.
          </p>
        </div>
        {permissions.canManageMeetingsAndProposals && (
          <Button
            size="sm"
            onClick={() => {
              setEditingProposal(null);
              setShowBuilder((v) => !v);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {showBuilder ? 'Close Form' : 'Draft New Proposal'}
          </Button>
        )}
      </div>

      {/* Proposal Builder Form (Create / Edit) */}
      {showBuilder && (
        <Card className="border-zinc-300 bg-zinc-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {editingProposal ? `Edit Proposal: ${editingProposal.title}` : 'Templated Word-Style Proposal Editor'}
              </CardTitle>
              <button
                type="button"
                className="text-zinc-400 hover:text-zinc-700"
                onClick={() => {
                  setEditingProposal(null);
                  setShowBuilder(false);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrUpdateProposal} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-700">
                    Proposal Title *
                  </label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <ModernDateTimePicker
                    label="Follow-Up Review Meeting (Optional)"
                    value={nextReviewDate}
                    onChange={(val) => setNextReviewDate(val)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  1. How We Tackle the Solution (Technical &amp; Creative Approach)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900"
                  value={solutionOverview}
                  onChange={(e) => setSolutionOverview(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  2. Workflow &amp; Team Schedule (Weekly / Monthly Milestones)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900"
                  value={workflowSchedule}
                  onChange={(e) => setWorkflowSchedule(e.target.value)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    3. Expected Results &amp; Final Deliverables
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900"
                    value={expectedResults}
                    onChange={(e) => setExpectedResults(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    4. Long-Term Support &amp; Maintenance Services
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900"
                    value={longTermSupport}
                    onChange={(e) => setLongTermSupport(e.target.value)}
                  />
                </div>
              </div>

              {/* Pricing Table Builder */}
              <div className="space-y-2 border-t border-zinc-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Commercial Pricing Table
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddPricingRow}
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {pricingItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-zinc-200"
                    >
                      <div className="col-span-5">
                        <Input
                          placeholder="Item Description"
                          value={item.description}
                          className="h-8 text-xs"
                          onChange={(e) => {
                            const val = e.target.value;
                            setPricingItems((prev) =>
                              prev.map((row, i) =>
                                i === idx ? { ...row, description: val } : row
                              )
                            );
                          }}
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          className="h-8 w-full rounded border border-zinc-200 bg-white px-2 text-xs"
                          value={item.category}
                          onChange={(e) => {
                            const val = e.target.value as ProposalPricingItem['category'];
                            setPricingItems((prev) =>
                              prev.map((row, i) =>
                                i === idx ? { ...row, category: val } : row
                              )
                            );
                          }}
                        >
                          <option value="Development">Development</option>
                          <option value="Design">Design</option>
                          <option value="Subscription / Recurring">Subscription</option>
                          <option value="Infrastructure">Infrastructure</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <select
                          className="h-8 w-full rounded border border-zinc-200 bg-white px-1 text-xs"
                          value={item.billing_cycle}
                          onChange={(e) => {
                            const val = e.target.value as 'one-time' | 'monthly' | 'yearly';
                            setPricingItems((prev) =>
                              prev.map((row, i) =>
                                i === idx ? { ...row, billing_cycle: val } : row
                              )
                            );
                          }}
                        >
                          <option value="one-time">One-Time</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="number"
                          placeholder="Cost"
                          value={item.cost}
                          className="h-8 text-xs"
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setPricingItems((prev) =>
                              prev.map((row, i) =>
                                i === idx ? { ...row, cost: val } : row
                              )
                            );
                          }}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          className="text-zinc-400 hover:text-red-600"
                          onClick={() => handleRemovePricingRow(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProposal(null);
                    setShowBuilder(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingProposal ? 'Update Proposal' : 'Save Proposal Specification'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Proposals List */}
      <div className="space-y-4">
        {projectProposals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-xs text-zinc-500">
              No formal proposals drafted for this project yet. Use the button
              above or approve a meeting to start drafting.
            </CardContent>
          </Card>
        ) : (
          projectProposals.map((prop) => (
            <Card key={prop.id} className="transition-all hover:border-zinc-300">
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-zinc-900">
                      {prop.title}
                    </h3>
                    <Badge
                      variant={
                        prop.status === 'approved'
                          ? 'success'
                          : prop.status === 'denied'
                          ? 'danger'
                          : prop.status === 'remainder'
                          ? 'purple'
                          : 'secondary'
                      }
                    >
                      {prop.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() =>
                        generateProposalPdf(project, prop, projectContacts)
                      }
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </Button>

                    {permissions.canManageMeetingsAndProposals && (
                      <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200">
                        <button
                          type="button"
                          className="text-zinc-500 hover:text-zinc-900 p-1"
                          title="Edit Proposal"
                          onClick={() => startEditProposal(prop)}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete Proposal"
                          onClick={() => {
                            if (confirm('Delete this proposal?')) {
                              deleteProposal(prop.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proposal Overview Text */}
                <div className="grid gap-3 text-xs md:grid-cols-2">
                  <div className="rounded-md border border-zinc-100 bg-zinc-50/50 p-3 space-y-1">
                    <span className="font-semibold text-zinc-800">
                      Proposed Solution &amp; Approach:
                    </span>
                    <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
                      {prop.solution_overview}
                    </p>
                  </div>

                  <div className="rounded-md border border-zinc-100 bg-zinc-50/50 p-3 space-y-1">
                    <span className="font-semibold text-zinc-800">
                      Workflow &amp; Delivery Milestones:
                    </span>
                    <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
                      {prop.workflow_team_schedule}
                    </p>
                  </div>
                </div>

                {/* Pricing Table Render */}
                <div className="overflow-x-auto rounded-lg border border-zinc-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                      <tr>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Billing</th>
                        <th className="py-2 px-3 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {prop.pricing_items.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/50">
                          <td className="py-2 px-3 font-medium text-zinc-900">
                            {item.description}
                          </td>
                          <td className="py-2 px-3 text-zinc-600">
                            <Badge variant="outline">{item.category}</Badge>
                          </td>
                          <td className="py-2 px-3 text-zinc-600 capitalize">
                            {item.billing_cycle || 'one-time'}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-zinc-900">
                            ${item.cost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-50/80 font-bold border-t border-zinc-200 text-xs">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-zinc-800">
                          Total One-Time: ${prop.total_one_time_cost.toLocaleString()} | Recurring: ${prop.total_recurring_cost.toLocaleString()}/mo
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700">
                          ${(prop.total_one_time_cost + prop.total_recurring_cost).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {prop.outcome_note && (
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-700">
                    <span className="font-semibold text-zinc-900">
                      Decision Note ({formatTimestamp(prop.outcome_at || '')}):
                    </span>{' '}
                    {prop.outcome_note}
                  </div>
                )}

                {/* Final Acceptance Buttons */}
                {permissions.canManageMeetingsAndProposals && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                    <span className="text-[11px] font-medium text-zinc-500">
                      Client Proposal Decision:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant={prop.status === 'approved' ? 'default' : 'outline'}
                        className="text-xs text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleOpenOutcome(prop.id, 'approved')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Approved (Start Active Project Execution)
                      </Button>

                      <Button
                        size="sm"
                        variant={prop.status === 'denied' ? 'default' : 'outline'}
                        className="text-xs text-red-700 hover:bg-red-50"
                        onClick={() => handleOpenOutcome(prop.id, 'denied')}
                      >
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                        Denied (Save to Drafts with Reason)
                      </Button>

                      <Button
                        size="sm"
                        variant={prop.status === 'remainder' ? 'default' : 'outline'}
                        className="text-xs text-violet-700 hover:bg-violet-50"
                        onClick={() => handleOpenOutcome(prop.id, 'remainder')}
                      >
                        <Clock className="h-3.5 w-3.5 text-violet-600" />
                        Remainder (Follow-up Templates)
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Proposal Outcome Modal */}
      {outcomeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                Confirm Proposal Outcome: {outcomeAction.toUpperCase()}
              </h3>
              <Badge variant="outline">{project.title}</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <ModernDateTimePicker
                  label={
                    outcomeAction === 'approved'
                      ? 'Contract Signing Date & Time'
                      : outcomeAction === 'remainder'
                      ? 'Scheduled Follow-Up Reminder Date'
                      : 'Decision Date'
                  }
                  required
                  value={outcomeDate}
                  onChange={(val) => setOutcomeDate(val)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-zinc-700">
                  {outcomeAction === 'approved'
                    ? 'Kickoff Note (Project will immediately unlock into full execution)'
                    : outcomeAction === 'denied'
                    ? 'Denial Reason Note (Saved in drafts for future revision)'
                    : 'Remainder Note'}
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900"
                  placeholder="Record note details..."
                  value={outcomeNote}
                  onChange={(e) => setOutcomeNote(e.target.value)}
                />
              </div>

              {outcomeAction === 'remainder' && (
                <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 space-y-2">
                  <span className="font-semibold text-violet-900">
                    Proposal Follow-up Reminders
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-[11px]"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${emailTemplate.subject}\n\n${emailTemplate.body}`
                        );
                        setReminderCopied('email');
                        setTimeout(() => setReminderCopied(null), 1500);
                      }}
                    >
                      <Send className="h-3 w-3" />
                      {reminderCopied === 'email' ? 'Copied!' : 'Copy Email'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-[11px]"
                      onClick={() => {
                        navigator.clipboard.writeText(whatsAppTemplate);
                        setReminderCopied('whatsapp');
                        setTimeout(() => setReminderCopied(null), 1500);
                      }}
                    >
                      <MessageSquare className="h-3 w-3" />
                      {reminderCopied === 'whatsapp' ? 'Copied!' : 'Copy WhatsApp'}
                    </Button>
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
                Confirm &amp; Route Deal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
