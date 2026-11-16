'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  Contact,
  Edit3,
  ExternalLink,
  FolderKanban,
  Mail,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatTimestamp } from '@/lib/utils';
import type { ProjectContact } from '@/types/agency';

function countWords(str: string): number {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export default function BusinessContactsPage() {
  const {
    contacts,
    addContact,
    updateContact,
    deleteContact,
    accessibleProjects,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'standalone' | 'linked'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editContact, setEditContact] = useState<ProjectContact | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [linkModalContact, setLinkModalContact] = useState<ProjectContact | null>(
    null
  );

  // Form states for Create / Edit
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formProjectId, setFormProjectId] = useState<string>('');

  // Link Modal state
  const [selectedProjectIdToLink, setSelectedProjectIdToLink] =
    useState<string>('');

  // Reset form
  const resetForm = () => {
    setFormName('');
    setFormRole('');
    setFormCompany('');
    setFormEmail('');
    setFormPhone('');
    setFormNotes('');
    setFormProjectId('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (c: ProjectContact) => {
    setEditContact(c);
    setFormName(c.name);
    setFormRole(c.role);
    setFormCompany(c.company_name || '');
    setFormEmail(c.email);
    setFormPhone(c.phone || '');
    setFormNotes(c.notes || '');
    setFormProjectId(c.project_id || '');
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRole.trim() || !formEmail.trim()) return;

    if (countWords(formNotes) > 20) {
      alert('Notes cannot exceed 20 words.');
      return;
    }

    if (editContact) {
      updateContact(editContact.id, {
        name: formName.trim(),
        role: formRole.trim(),
        company_name: formCompany.trim() || null,
        email: formEmail.trim(),
        phone: formPhone.trim() || null,
        notes: formNotes.trim() || null,
        project_id: formProjectId || null,
      });
      setEditContact(null);
    } else {
      addContact({
        name: formName.trim(),
        role: formRole.trim(),
        company_name: formCompany.trim() || null,
        email: formEmail.trim(),
        phone: formPhone.trim() || null,
        notes: formNotes.trim() || null,
        project_id: formProjectId || null,
      });
      setIsCreateOpen(false);
    }
    resetForm();
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      deleteContact(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleLinkToProject = () => {
    if (!linkModalContact || !selectedProjectIdToLink) return;
    updateContact(linkModalContact.id, {
      project_id: selectedProjectIdToLink,
    });
    setLinkModalContact(null);
    setSelectedProjectIdToLink('');
  };

  // Quick helper to find project title
  const getProject = useCallback(
    (projId: string | null | undefined) => {
      if (!projId) return null;
      return accessibleProjects.find((p) => p.id === projId) || null;
    },
    [accessibleProjects]
  );

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Tab filter
      if (activeTab === 'standalone' && c.project_id) return false;
      if (activeTab === 'linked' && !c.project_id) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesRole = c.role.toLowerCase().includes(q);
        const matchesCompany = (c.company_name || '').toLowerCase().includes(q);
        const matchesEmail = c.email.toLowerCase().includes(q);
        const matchesNotes = (c.notes || '').toLowerCase().includes(q);
        const proj = getProject(c.project_id);
        const matchesProject = proj ? proj.title.toLowerCase().includes(q) : false;
        return (
          matchesName ||
          matchesRole ||
          matchesCompany ||
          matchesEmail ||
          matchesNotes ||
          matchesProject
        );
      }
      return true;
    });
  }, [contacts, activeTab, searchQuery, getProject]);

  // Metrics
  const totalContacts = contacts.length;
  const standaloneCount = contacts.filter((c) => !c.project_id).length;
  const linkedCount = contacts.filter((c) => !!c.project_id).length;
  const uniqueCompanies = new Set(
    contacts
      .map((c) => {
        if (c.company_name) return c.company_name;
        const proj = getProject(c.project_id);
        return proj?.client_name || '';
      })
      .filter(Boolean)
  ).size;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm">
              <Contact className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                Business Contacts &amp; Leads Directory
              </h1>
              <p className="text-xs text-zinc-500">
                Manage prospect stakeholders, potential clients, and business
                contacts before or after project kickoffs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={openCreateModal}
            className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Business Contact
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-zinc-200/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">
                Total Contacts
              </span>
              <Contact className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-950">
              {totalContacts}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Across all leads &amp; active contracts
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 shadow-xs bg-amber-50/40 border-amber-200/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-900">
                Standalone Leads
              </span>
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-950">
              {standaloneCount}
            </div>
            <div className="text-[11px] text-amber-700/80 mt-0.5">
              Not linked to any project yet
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 shadow-xs bg-blue-50/40 border-blue-200/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-900">
                Project-Linked
              </span>
              <FolderKanban className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-950">
              {linkedCount}
            </div>
            <div className="text-[11px] text-blue-700/80 mt-0.5">
              Assigned to active workspaces
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">
                Organizations
              </span>
              <Building2 className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-950">
              {uniqueCompanies}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Distinct client &amp; partner brands
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/80">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            All Contacts ({totalContacts})
          </button>
          <button
            onClick={() => setActiveTab('standalone')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'standalone'
                ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <span>Standalone Leads</span>
            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
              {standaloneCount}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('linked')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'linked'
                ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <span>Linked to Projects</span>
            <Badge variant="info" className="text-[10px] px-1.5 py-0">
              {linkedCount}
            </Badge>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts, company, role..."
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

      {/* Contact Cards Grid */}
      {filteredContacts.length === 0 ? (
        <Card className="border-dashed border-2 p-10 text-center">
          <Contact className="mx-auto h-8 w-8 text-zinc-400" />
          <h3 className="mt-2 text-sm font-semibold text-zinc-900">
            No contacts found
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try modifying your search keywords or clear the filter.'
              : 'Add your first standalone lead or business contact to stay organized before project inception.'}
          </p>
          <Button
            onClick={openCreateModal}
            size="sm"
            className="mt-4 gap-1.5 bg-zinc-900 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Contact
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => {
            const project = getProject(contact.project_id);
            const notesWordCount = countWords(contact.notes || '');

            return (
              <Card
                key={contact.id}
                className="flex flex-col justify-between border-zinc-200/90 hover:border-zinc-300 transition-all shadow-xs hover:shadow-sm bg-white"
              >
                <div>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 font-semibold text-xs">
                          {contact.name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-zinc-950 truncate">
                            {contact.name}
                          </h3>
                          <p className="text-xs text-zinc-500 truncate">
                            {contact.role}
                          </p>
                        </div>
                      </div>

                      {/* Status badge: Linked vs Standalone */}
                      {project ? (
                        <Badge
                          variant="info"
                          className="text-[10px] shrink-0 font-normal"
                        >
                          Project Lead
                        </Badge>
                      ) : (
                        <Badge
                          variant="warning"
                          className="text-[10px] shrink-0 font-normal"
                        >
                          Standalone Lead
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3">
                    {/* Organization / Company */}
                    <div className="flex items-center gap-2 text-xs text-zinc-700">
                      <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="font-medium truncate">
                        {contact.company_name ||
                          project?.client_name ||
                          'Independent / Individual'}
                      </span>
                    </div>

                    {/* Associated Project */}
                    {project ? (
                      <div className="flex items-center justify-between text-xs bg-zinc-50 p-2 rounded border border-zinc-200/80">
                        <div className="flex items-center gap-2 truncate">
                          <FolderKanban className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="truncate font-medium text-zinc-800">
                            {project.title}
                          </span>
                        </div>
                        <Link
                          href={`/projects/${project.id}?tab=contacts`}
                          className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 shrink-0 ml-1 font-medium"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs bg-amber-50/60 p-2 rounded border border-amber-200/70">
                        <span className="text-[11px] text-amber-800">
                          Unassigned (Pre-Project Lead)
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLinkModalContact(contact);
                            setSelectedProjectIdToLink('');
                          }}
                          className="h-6 text-[10px] px-2 py-0 border-amber-300 text-amber-900 bg-white hover:bg-amber-100/50"
                        >
                          Link Project
                        </Button>
                      </div>
                    )}

                    {/* Communication details */}
                    <div className="space-y-1.5 text-xs text-zinc-600 pt-1">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="truncate hover:text-blue-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <a
                            href={`tel:${contact.phone}`}
                            className="truncate hover:text-blue-600 hover:underline"
                          >
                            {contact.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Notes (word-limited) */}
                    {contact.notes && (
                      <div className="rounded bg-zinc-50 border border-zinc-100 p-2 text-xs text-zinc-600 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Notes</span>
                          <span className="font-mono">
                            {notesWordCount}/20 words
                          </span>
                        </div>
                        <p className="line-clamp-2 leading-relaxed text-zinc-700">
                          {contact.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Footer with Edit & Delete */}
                <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2.5 bg-zinc-50/50 rounded-b-lg">
                  <span className="text-[10px] text-zinc-400">
                    Added {formatTimestamp(contact.created_at)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(contact)}
                      className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60"
                      title="Edit Contact"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(contact.id)}
                      className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      title="Delete Contact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Contact */}
      {(isCreateOpen || !!editContact) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-sm font-semibold text-zinc-900">
                {editContact ? 'Edit Business Contact' : 'New Business Contact'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditContact(null);
                  resetForm();
                }}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Full Name *
                  </label>
                  <Input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Role / Title *
                  </label>
                  <Input
                    required
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="e.g. Head of Product"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Company / Organization Name
                </label>
                <Input
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="e.g. Acme Corp (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Email Address *
                  </label>
                  <Input
                    required
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="jane@company.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Phone (Optional)
                  </label>
                  <Input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Link to Project (Optional)
                </label>
                <select
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 bg-white p-2 text-xs text-zinc-900"
                >
                  <option value="">
                    Leave Unassigned (Standalone Lead / Prospect)
                  </option>
                  {accessibleProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.client_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-700">
                  <label>Notes (Max 20 words)</label>
                  <span
                    className={`font-mono text-[10px] ${
                      countWords(formNotes) > 20
                        ? 'text-rose-600 font-bold'
                        : 'text-zinc-400'
                    }`}
                  >
                    {countWords(formNotes)}/20 words
                  </span>
                </div>
                <textarea
                  rows={2}
                  className={`w-full rounded-md border p-2 text-xs text-zinc-900 ${
                    countWords(formNotes) > 20
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-zinc-200'
                  }`}
                  placeholder="Key background context..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
                {countWords(formNotes) > 20 && (
                  <p className="text-[10px] text-rose-600 font-medium">
                    Word limit exceeded! Please keep notes under 20 words.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditContact(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={countWords(formNotes) > 20}
                  className="bg-zinc-900 text-white"
                >
                  {editContact ? 'Save Changes' : 'Create Contact'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Link Contact to Project */}
      {linkModalContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-sm font-semibold text-zinc-900">
                Link Contact to Project
              </h2>
              <button
                onClick={() => setLinkModalContact(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-zinc-600">
                Assign <strong>{linkModalContact.name}</strong> (
                {linkModalContact.role}
                {linkModalContact.company_name
                  ? ` at ${linkModalContact.company_name}`
                  : ''}
                ) to an active project workspace.
              </p>

              <div className="space-y-1">
                <label className="font-medium text-zinc-700">
                  Select Target Project
                </label>
                <select
                  value={selectedProjectIdToLink}
                  onChange={(e) => setSelectedProjectIdToLink(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 bg-white p-2 text-xs text-zinc-900"
                >
                  <option value="">-- Choose Project --</option>
                  {accessibleProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.client_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkModalContact(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedProjectIdToLink}
                  onClick={handleLinkToProject}
                  className="bg-zinc-900 text-white"
                >
                  Confirm Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Protective Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Delete Contact?
                </h3>
                <p className="text-xs text-zinc-500">
                  Are you sure you want to delete this contact? This action
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
                Yes, Delete Contact
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
