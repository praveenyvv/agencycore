'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Edit2,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import type { Project, RenewalItem } from '@/types/agency';

interface TabRenewalsProps {
  project: Project;
}

function getDiffDays(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDiffLabel(diff: number): string {
  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} overdue`;
  if (diff === 0) return 'Due today';
  return `in ${diff} day${diff === 1 ? '' : 's'}`;
}

export function TabRenewals({ project }: TabRenewalsProps) {
  const {
    renewals,
    createRenewal,
    updateRenewal,
    markRenewalAsRenewed,
    deleteRenewal,
  } = useAuth();

  // Dialog states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RenewalItem | null>(null);

  const [isMarkRenewedOpen, setIsMarkRenewedOpen] = useState(false);
  const [markingItem, setMarkingItem] = useState<RenewalItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<RenewalItem | null>(null);

  // Form fields for Add/Edit
  const [title, setTitle] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [remindDays, setRemindDays] = useState('7');
  const [formError, setFormError] = useState('');

  // Form fields for Mark as Renewed
  const [nextRenewalDate, setNextRenewalDate] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');

  // Filter items for current project
  const projectRenewals = useMemo(() => {
    return renewals
      .filter((r) => r.project_id === project.id)
      .sort((a, b) => {
        if (a.renewed && !b.renewed) return 1;
        if (!a.renewed && b.renewed) return -1;
        return new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime();
      });
  }, [renewals, project.id]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const active = projectRenewals.filter((r) => !r.renewed);
    const renewed = projectRenewals.filter((r) => r.renewed);

    const dueThisWeek = active.filter((r) => {
      const diff = getDiffDays(r.renewal_date);
      return diff >= 0 && diff <= 7;
    });

    const dueThisMonth = active.filter((r) => {
      const diff = getDiffDays(r.renewal_date);
      return diff >= 0 && diff <= 30;
    });

    const overdue = active.filter((r) => {
      const diff = getDiffDays(r.renewal_date);
      return diff < 0 || diff === 0;
    });

    return {
      dueThisWeek: dueThisWeek.length,
      dueThisMonth: dueThisMonth.length,
      overdue: overdue.length,
      renewed: renewed.length,
    };
  }, [projectRenewals]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setVendor('');
    setAmount('');
    setRenewalDate(new Date().toISOString().split('T')[0]);
    setRemindDays('7');
    setFormError('');
    setIsAddEditOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item: RenewalItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setVendor(item.vendor || '');
    setAmount(item.amount ? String(item.amount) : '');
    setRenewalDate(item.renewal_date);
    setRemindDays(String(item.remind_days || 7));
    setFormError('');
    setIsAddEditOpen(true);
  };

  // Submit Add/Edit form
  const handleSaveRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!renewalDate) {
      setFormError('Renewal date is required');
      return;
    }

    const numAmount = parseFloat(amount) || 0;
    const numRemind = parseInt(remindDays, 10) || 7;

    if (editingItem) {
      updateRenewal({
        id: editingItem.id,
        title: title.trim(),
        vendor: vendor.trim() || undefined,
        amount: numAmount,
        renewal_date: renewalDate,
        remind_days: numRemind,
      });
    } else {
      createRenewal({
        project_id: project.id,
        title: title.trim(),
        vendor: vendor.trim() || undefined,
        amount: numAmount,
        renewal_date: renewalDate,
        remind_days: numRemind,
      });
    }

    setIsAddEditOpen(false);
  };

  // Open Mark Renewed modal
  const handleOpenMarkRenewed = (item: RenewalItem) => {
    setMarkingItem(item);
    setAmountPaid(item.amount ? String(item.amount) : '');
    setNotes('');

    try {
      const cur = new Date(item.renewal_date);
      cur.setFullYear(cur.getFullYear() + 1);
      setNextRenewalDate(cur.toISOString().split('T')[0]);
    } catch {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setNextRenewalDate(nextYear.toISOString().split('T')[0]);
    }

    setIsMarkRenewedOpen(true);
  };

  // Submit Mark Renewed
  const handleConfirmMarkRenewed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markingItem) return;
    if (!nextRenewalDate) return;

    markRenewalAsRenewed({
      id: markingItem.id,
      next_renewal_date: nextRenewalDate,
      amount_paid: parseFloat(amountPaid) || markingItem.amount,
      notes: notes.trim() || undefined,
    });

    setIsMarkRenewedOpen(false);
    setMarkingItem(null);
  };

  // Open Delete modal
  const handleOpenDelete = (item: RenewalItem) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (deletingItem) {
      deleteRenewal(deletingItem.id);
      setIsDeleteOpen(false);
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Row (Title 20px / 700 + Subtitle 13px + Primary Button) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#111827] tracking-tight">Renewals</h2>
          <p className="text-[13px] text-[#6b7280] mt-0.5">
            {project.title} · Track domains, hosting, SSL &amp; vendor service renewals
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="h-[36px] px-4 rounded-[8px] bg-[#4361ee] hover:bg-[#3451d1] text-white shadow-[0_2px_6px_rgba(67,97,238,0.25)] text-[13px] font-medium gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Renewal
        </Button>
      </div>

      {/* 4 Stat Cards: Matching Screenshot 1 precisely */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Due This Week */}
        <div className="rounded-[14px] p-5 bg-white border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[#fef3c7] text-[#d97706] flex items-center justify-center mb-3">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="text-[32px] font-bold text-[#111827] leading-none mb-1.5">{metrics.dueThisWeek}</div>
          <div className="text-[13px] text-[#6b7280]">Due This Week</div>
        </div>

        {/* Due This Month */}
        <div className="rounded-[14px] p-5 bg-white border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[#dbeafe] text-[#2563eb] flex items-center justify-center mb-3">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="text-[32px] font-bold text-[#111827] leading-none mb-1.5">{metrics.dueThisMonth}</div>
          <div className="text-[13px] text-[#6b7280]">Due This Month</div>
        </div>

        {/* Overdue */}
        <div className="rounded-[14px] p-5 bg-white border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[#fee2e2] text-[#ef4444] flex items-center justify-center mb-3">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-[32px] font-bold text-[#111827] leading-none mb-1.5">{metrics.overdue}</div>
          <div className="text-[13px] text-[#6b7280]">Overdue</div>
        </div>

        {/* Renewed */}
        <div className="rounded-[14px] p-5 bg-white border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[#d1fae5] text-[#10b981] flex items-center justify-center mb-3">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-[32px] font-bold text-[#111827] leading-none mb-1.5">{metrics.renewed}</div>
          <div className="text-[13px] text-[#6b7280]">Renewed</div>
        </div>
      </div>

      {/* Tinted Info Banner: Upcoming in 7 Days */}
      {metrics.dueThisWeek > 0 && (
        <div className="bg-gradient-to-r from-[#fff4e6] to-[#fffbeb] border border-[#fef3c7] rounded-[12px] p-3.5 flex items-center gap-3 text-[12px] text-[#92400e]">
          <Clock className="h-4 w-4 text-[#d97706] shrink-0" />
          <div className="font-medium">
            <span className="font-semibold">{metrics.dueThisWeek} renewal(s) due within the next 7 days.</span>{' '}
            Remember to send timely renewal reminders to the client!
          </div>
        </div>
      )}

      {/* Renewals Table: Header cells 11px uppercase 600 bg #fafafa, Body 13px padding 11px 12px */}
      <div className="rounded-[12px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#fafafa] text-[#6b7280] font-semibold text-[11px] uppercase tracking-[0.06em]">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4 text-right">Edit/Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] text-[#6b7280]">
              {projectRenewals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9ca3af]">
                    <CalendarCheck className="h-9 w-9 mx-auto mb-2 text-[#9ca3af]" />
                    <p className="font-semibold text-[15px] text-[#111827]">No renewals recorded yet</p>
                    <p className="text-[12px] text-[#6b7280] mt-1">Click &ldquo;+ Add Renewal&rdquo; above to track domain &amp; service renewals.</p>
                  </td>
                </tr>
              ) : (
                projectRenewals.map((r) => {
                  const isRenewed = !!r.renewed;
                  const diff = getDiffDays(r.renewal_date);

                  let statusLabel = 'Active';
                  let statusBadgeClass = 'bg-[#d1fae5] text-[#065f46]';
                  let rowBgClass = '';

                  if (isRenewed) {
                    statusLabel = 'Renewed';
                    statusBadgeClass = 'bg-[#ecfdf5] text-[#065f46]';
                    rowBgClass = 'bg-[#f9fefb] opacity-85';
                  } else if (diff < 0) {
                    statusLabel = 'Overdue';
                    statusBadgeClass = 'bg-[#fee2e2] text-[#991b1b]';
                    rowBgClass = 'bg-[#fff8f8]';
                  } else if (diff === 0) {
                    statusLabel = 'Due Today';
                    statusBadgeClass = 'bg-[#fee2e2] text-[#991b1b]';
                    rowBgClass = 'bg-[#fff8f8]';
                  } else if (diff <= (r.remind_days || 7)) {
                    statusLabel = 'Due Soon';
                    statusBadgeClass = 'bg-[#fef3c7] text-[#92400e]';
                    rowBgClass = 'bg-[#fffdf0]';
                  } else if (diff <= 30) {
                    statusLabel = 'Upcoming';
                    statusBadgeClass = 'bg-[#dbeafe] text-[#1d4ed8]';
                  }

                  return (
                    <tr key={r.id} className={`hover:bg-[#fafbff] transition-colors ${rowBgClass}`}>
                      {/* Title */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          {isRenewed ? (
                            <CheckCircle2 className="h-4 w-4 text-[#10b981] shrink-0" />
                          ) : diff < 0 || diff === 0 ? (
                            <AlertTriangle className="h-4 w-4 text-[#ef4444] shrink-0" />
                          ) : diff <= (r.remind_days || 7) ? (
                            <Clock className="h-4 w-4 text-[#f59e0b] shrink-0" />
                          ) : (
                            <Calendar className="h-4 w-4 text-[#4361ee] shrink-0" />
                          )}
                          <span className={`font-semibold ${isRenewed ? 'line-through text-[#9ca3af]' : 'text-[#111827]'}`}>
                            {r.title}
                          </span>
                        </div>
                        <div className="pl-6 text-[11px] text-[#9ca3af] mt-0.5">
                          {isRenewed ? (
                            <span>
                              ✅ Renewed on {formatDate(r.renewed_on)}
                              {r.renewed_notes ? ` · ${r.renewed_notes}` : ''}
                            </span>
                          ) : (
                            <span>
                              {getDiffLabel(diff)} · Remind {r.remind_days || 7} days before
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="py-3 px-4 text-[#6b7280]">
                        {r.vendor || '—'}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-[#6b7280] whitespace-nowrap">
                        {formatDate(r.renewal_date)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-bold text-[#111827] whitespace-nowrap">
                        ₹{Number(r.amount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[20px] text-[11.5px] font-medium ${statusBadgeClass}`}>
                          {statusLabel}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isRenewed ? (
                          <span className="inline-flex items-center gap-1 text-[#10b981] font-semibold text-[12px]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Done
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenMarkRenewed(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-semibold rounded-[8px] bg-[#ecfdf5] text-[#065f46] border border-[#bbf7d0] hover:bg-[#d1fae5] transition-colors cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Mark Renewed
                          </button>
                        )}
                      </td>

                      {/* Edit/Del Icon Buttons (30x30 white 1px border radius 7px) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            title="Edit renewal"
                            className="w-[30px] h-[30px] rounded-[7px] border border-[#e5e7eb] bg-white text-[#9ca3af] hover:border-[#4361ee] hover:text-[#4361ee] hover:bg-[rgba(67,97,238,0.08)] flex items-center justify-center transition-all cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(r)}
                            title="Delete renewal"
                            className="w-[30px] h-[30px] rounded-[7px] border border-[#e5e7eb] bg-white text-[#9ca3af] hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-[#fef2f2] flex items-center justify-center transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add / Edit Renewal (Radius 14px, Max-width 520px, Sticky header & footer) */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px] p-4 animate-fade-up">
          <div className="bg-white rounded-[14px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#e5e7eb] w-full max-w-[520px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] sticky top-0 bg-white z-10">
              <h3 className="font-bold text-[15px] text-[#111827]">
                {editingItem ? 'Edit Renewal' : 'Add Renewal'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="w-7 h-7 rounded-[6px] text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRenewal}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="text-[12px] text-[#ef4444] bg-[#fef2f2] border border-[#fca5a5] rounded-[8px] p-2.5">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1.5">
                    Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Domain – example.com"
                    className="text-[13px] h-[36px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1.5">
                      Vendor
                    </label>
                    <Input
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="e.g. GoDaddy"
                      className="text-[13px] h-[36px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1.5">
                      Amount (₹)
                    </label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1299"
                      className="text-[13px] h-[36px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1.5">
                      Renewal Date *
                    </label>
                    <Input
                      type="date"
                      value={renewalDate}
                      onChange={(e) => setRenewalDate(e.target.value)}
                      className="text-[13px] h-[36px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1.5">
                      Remind (days before)
                    </label>
                    <Input
                      type="number"
                      value={remindDays}
                      onChange={(e) => setRemindDays(e.target.value)}
                      placeholder="7"
                      className="text-[13px] h-[36px]"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-3.5 border-t border-[#e5e7eb] bg-[#fafafa] flex justify-end gap-2 sticky bottom-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddEditOpen(false)}
                  className="h-[36px] px-4 text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-[36px] px-5 rounded-[8px] bg-[#4361ee] hover:bg-[#3451d1] text-white text-[13px]"
                >
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Mark as Renewed (Matching Screenshot 3) */}
      {isMarkRenewedOpen && markingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px] p-4 animate-fade-up">
          <div className="bg-white rounded-[14px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#e5e7eb] w-full max-w-[520px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-[#10b981]" />
                <h3 className="font-bold text-[15px] text-[#111827]">Mark as Renewed</h3>
              </div>
              <button
                onClick={() => setIsMarkRenewedOpen(false)}
                className="w-7 h-7 rounded-[6px] text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmMarkRenewed}>
              <div className="p-6 space-y-4">
                {/* Top Summary Card (Soft Green) */}
                <div className="bg-[#ecfdf5] border border-[#bbf7d0] rounded-[10px] p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#10b981] text-white flex items-center justify-center shrink-0 font-bold text-[12px]">
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-[13px] text-[#111827]">{markingItem.title}</div>
                    <div className="text-[12px] text-[#6b7280] mt-0.5">
                      {markingItem.vendor || 'Vendor'} · ₹{Number(markingItem.amount || 0).toLocaleString('en-IN')} · Due {formatDate(markingItem.renewal_date)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1.5">
                    Next Renewal Date *
                  </label>
                  <Input
                    type="date"
                    value={nextRenewalDate}
                    onChange={(e) => setNextRenewalDate(e.target.value)}
                    className="text-[13px] h-[36px]"
                    required
                  />
                  <p className="text-[11px] text-[#6b7280] mt-1.5 flex items-center gap-1">
                    💡 A new renewal entry will be auto-created with this date.
                  </p>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1.5">
                    Amount Paid (₹)
                  </label>
                  <Input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="1299"
                    className="text-[13px] h-[36px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1.5">
                    Notes (optional)
                  </label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Renewed for 1 year via GoDaddy"
                    className="text-[13px] h-[36px]"
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-3.5 border-t border-[#e5e7eb] bg-[#fafafa] flex justify-end gap-2 sticky bottom-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMarkRenewedOpen(false)}
                  className="h-[36px] px-4 text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-[36px] px-5 rounded-[8px] bg-[#10b981] hover:bg-[#059669] text-white font-medium text-[13px] gap-1.5 shadow-[0_2px_6px_rgba(16,185,129,0.25)]"
                >
                  Confirm Renewed
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Confirm Delete (Matching Screenshot 4) */}
      {isDeleteOpen && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px] p-4 animate-fade-up">
          <div className="bg-white rounded-[14px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#e5e7eb] w-full max-w-[420px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
              <h3 className="font-bold text-[15px] text-[#111827]">Confirm Delete</h3>
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="w-7 h-7 rounded-[6px] text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[10px] bg-[#fef2f2] text-[#ef4444] flex items-center justify-center shrink-0 border border-[#fee2e2]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-[#111827]">Delete this item?</h4>
                  <p className="text-[12px] text-[#6b7280] mt-1">
                    Delete renewal &ldquo;{deletingItem.title}&rdquo;?
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteOpen(false)}
                  className="h-[34px] px-4 text-[12.5px]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="h-[34px] px-4 rounded-[8px] bg-white hover:bg-[#fef2f2] text-[#ef4444] border border-[#fecaca] font-medium text-[12.5px] transition-colors"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
