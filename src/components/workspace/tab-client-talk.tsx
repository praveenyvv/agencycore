'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Edit3,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ModernDateTimePicker,
  getCurrentLocalDateTimeString,
} from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { formatTimestamp } from '@/lib/utils';
import type { ClientTalkRecord, ClientTalkType, Project } from '@/types/agency';

const TALK_TYPE_CONFIG: Record<
  ClientTalkType,
  {
    icon: React.ComponentType<{ className?: string }>;
    borderColor: string;
    bgColor: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }
> = {
  Call: {
    icon: Phone,
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-50/80',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
  },
  WhatsApp: {
    icon: MessageCircle,
    borderColor: 'border-teal-500',
    bgColor: 'bg-teal-50/80',
    iconColor: 'text-teal-600',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-200',
  },
  Email: {
    icon: Mail,
    borderColor: 'border-indigo-500',
    bgColor: 'bg-indigo-50/80',
    iconColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
  },
  Meeting: {
    icon: Users,
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50/80',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
  },
};

function formatTalkDate(dtStr: string): string {
  if (!dtStr) return '';
  const date = new Date(dtStr);
  if (Number.isNaN(date.getTime())) return dtStr;

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} · ${hours}:${minutes} ${ampm}`;
}

export function TabClientTalk({ project }: { project: Project }) {
  const {
    clientTalks,
    addClientTalk,
    updateClientTalk,
    deleteClientTalk,
    users,
  } = useAuth();

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTalk, setEditingTalk] = useState<ClientTalkRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [talkType, setTalkType] = useState<ClientTalkType>('Call');
  const [talkDate, setTalkDate] = useState<string>(() => getCurrentLocalDateTimeString());
  const [talkNotes, setTalkNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const projectTalks = useMemo(() => {
    return clientTalks
      .filter((t) => t.project_id === project.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [clientTalks, project.id]);

  const filteredTalks = useMemo(() => {
    return projectTalks.filter((t) => {
      if (typeFilter && t.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNotes = t.notes.toLowerCase().includes(q);
        const matchesType = t.type.toLowerCase().includes(q);
        return matchesNotes || matchesType;
      }
      return true;
    });
  }, [projectTalks, typeFilter, searchQuery]);

  const openAddModal = () => {
    setEditingTalk(null);
    setTalkType('Call');
    setTalkDate(getCurrentLocalDateTimeString());
    setTalkNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (talk: ClientTalkRecord) => {
    setEditingTalk(talk);
    setTalkType(talk.type);
    setTalkDate(talk.date);
    setTalkNotes(talk.notes);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!talkNotes.trim()) {
      setFormError('Please enter notes on what was discussed.');
      return;
    }
    if (!talkDate) {
      setFormError('Date and time are required.');
      return;
    }

    if (editingTalk) {
      updateClientTalk(editingTalk.id, {
        type: talkType,
        date: talkDate,
        notes: talkNotes.trim(),
      });
    } else {
      addClientTalk({
        project_id: project.id,
        type: talkType,
        date: talkDate,
        notes: talkNotes.trim(),
      });
    }

    setIsModalOpen(false);
    setEditingTalk(null);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      deleteClientTalk(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const getCreator = (userId?: string) => {
    if (!userId) return null;
    return users.find((u) => u.id === userId) || null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
              Client Talk
            </h2>
            <Badge variant="secondary" className="text-xs">
              {projectTalks.length}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Log all ongoing calls, WhatsApp messages, emails, and syncs for{' '}
            <strong className="text-zinc-700">{project.title}</strong> ({project.client_name}).
          </p>
        </div>

        <Button
          onClick={openAddModal}
          size="sm"
          className="gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Talk
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/80">
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            <option value="">All Types</option>
            <option value="Call">Call</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
            <option value="Meeting">Meeting</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-8 text-xs bg-white h-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <span className="text-xs text-zinc-500 font-medium">
          {filteredTalks.length === projectTalks.length
            ? `${projectTalks.length} ${projectTalks.length === 1 ? 'record' : 'records'}`
            : `${filteredTalks.length} of ${projectTalks.length} records`}
        </span>
      </div>

      {/* Timeline Feed */}
      {filteredTalks.length === 0 ? (
        <Card className="border-dashed border-2 p-10 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-zinc-400" />
          <h3 className="mt-2 text-sm font-semibold text-zinc-900">
            {projectTalks.length === 0
              ? 'No client talk logged yet'
              : 'No records match your filter'}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            {projectTalks.length === 0
              ? 'Log your first call, message, email, or meeting note with the client to maintain complete communication history.'
              : 'Try clearing your search keyword or switching the type filter to "All Types".'}
          </p>
          {projectTalks.length === 0 && (
            <Button
              onClick={openAddModal}
              size="sm"
              className="mt-4 gap-1.5 bg-zinc-900 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add First Client Talk
            </Button>
          )}
        </Card>
      ) : (
        <div className="relative max-w-3xl space-y-0">
          {filteredTalks.map((talk, idx) => {
            const config = TALK_TYPE_CONFIG[talk.type] || TALK_TYPE_CONFIG.Call;
            const Icon = config.icon;
            const isLast = idx === filteredTalks.length - 1;
            const creator = getCreator(talk.created_by);

            return (
              <div key={talk.id} className="relative flex gap-4 pb-6 group">
                {/* Connecting Vertical Timeline Line */}
                {!isLast && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-zinc-200" />
                )}

                {/* Left Colored Icon Node */}
                <div
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white shadow-xs transition-transform group-hover:scale-105 ${config.borderColor} ${config.iconColor}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Timeline Card */}
                <div className="flex-1 rounded-xl border border-zinc-200/90 bg-white p-4 shadow-xs transition-all hover:border-zinc-300 hover:shadow-sm">
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
                      >
                        <Icon className="h-3 w-3" />
                        {talk.type}
                      </span>
                      <span className="text-xs text-zinc-500 font-medium">
                        {formatTalkDate(talk.date)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(talk)}
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                        title="Edit Talk"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(talk.id)}
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Talk"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Talk Notes */}
                  <div className="mt-3 text-xs sm:text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">
                    {talk.notes}
                  </div>

                  {/* Footer Attribution */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-50">
                    <span>
                      Logged by {creator ? creator.name : 'Team Member'}
                    </span>
                    <span>{formatTimestamp(talk.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit Client Talk */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                {editingTalk ? 'Edit Client Talk' : 'Add Client Talk'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Communication Type *
                  </label>
                  <select
                    value={talkType}
                    onChange={(e) => setTalkType(e.target.value as ClientTalkType)}
                    className="w-full rounded-md border border-zinc-200 bg-white p-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="Call">Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                  </select>
                </div>

                <div>
                  <ModernDateTimePicker
                    label="Date &amp; Time"
                    required
                    value={talkDate}
                    onChange={(val) => setTalkDate(val)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Discussion Notes *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="What was discussed? (e.g. client feedback, scope agreement, timeline confirmation...)"
                  value={talkNotes}
                  onChange={(e) => setTalkNotes(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 p-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
                />
              </div>

              {formError && (
                <div className="rounded-md bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  {editingTalk ? 'Save Changes' : 'Save Talk'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Protective Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-zinc-900">
                  Delete Client Talk?
                </h4>
                <p className="text-xs text-zinc-500">
                  Are you sure you want to delete this communication record? This
                  cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
