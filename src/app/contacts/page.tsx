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
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
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
  const [linkModalContact, setLinkModalContact] =
    useState<ProjectContact | null>(null);
  const [selectedProjectIdToLink, setSelectedProjectIdToLink] = useState('');

  // Form states
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formProjectId, setFormProjectId] = useState<string>('');

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
    setEditContact(null);
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
    setIsCreateOpen(false);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRole.trim() || !formEmail.trim()) return;

    if (countWords(formNotes) > 20) {
      alert('Notes must be 20 words or less.');
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

  const getProject = useCallback(
    (projId: string | null | undefined) => {
      if (!projId) return null;
      return accessibleProjects.find((p) => p.id === projId) || null;
    },
    [accessibleProjects]
  );

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (activeTab === 'standalone' && c.project_id) return false;
      if (activeTab === 'linked' && !c.project_id) return false;

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
    <div className="space-y-6">
      {/* 1. Page Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[#111827]">
            Business Contacts &amp; Leads Directory
          </h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">
            Manage prospect stakeholders, potential clients, and business contacts before or after project kickoffs.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="h-[36px] px-4 rounded-[8px] bg-[#4361ee] hover:bg-[#3451d1] text-white shadow-[0_2px_6px_rgba(67,97,238,0.25)] text-[13px] font-medium gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Business Contact
        </Button>
      </div>

      {/* 2. 4 Stat Cards: radius 14px, padding 18px 16px, pastel tinted backgrounds */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contacts (Purple #eef0fd) */}
        <div className="rounded-[14px] p-[18px_16px] bg-[#eef0fd] flex items-start justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
          <div>
            <div className="text-[13px] font-semibold text-[#4361ee]">Total Contacts</div>
            <div className="text-[32px] font-bold text-[#111827] leading-none my-1.5">{totalContacts}</div>
            <div className="text-[12px] text-[#6b7280]">All leads &amp; clients</div>
          </div>
          <div className="w-[46px] h-[46px] rounded-[12px] bg-[rgba(67,97,238,0.13)] text-[#4361ee] flex items-center justify-center shrink-0">
            <Contact className="h-5 w-5" />
          </div>
        </div>

        {/* Standalone Leads (Orange #fff4e6) */}
        <div className="rounded-[14px] p-[18px_16px] bg-[#fff4e6] flex items-start justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
          <div>
            <div className="text-[13px] font-semibold text-[#c2410c]">Standalone Leads</div>
            <div className="text-[32px] font-bold text-[#111827] leading-none my-1.5">{standaloneCount}</div>
            <div className="text-[12px] text-[#6b7280]">Pre-project pipeline</div>
          </div>
          <div className="w-[46px] h-[46px] rounded-[12px] bg-[rgba(245,158,11,0.15)] text-[#d97706] flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        {/* Project-Linked (Green #edfcf3) */}
        <div className="rounded-[14px] p-[18px_16px] bg-[#edfcf3] flex items-start justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
          <div>
            <div className="text-[13px] font-semibold text-[#059669]">Project-Linked</div>
            <div className="text-[32px] font-bold text-[#111827] leading-none my-1.5">{linkedCount}</div>
            <div className="text-[12px] text-[#6b7280]">Active workspaces</div>
          </div>
          <div className="w-[46px] h-[46px] rounded-[12px] bg-[rgba(16,185,129,0.15)] text-[#10b981] flex items-center justify-center shrink-0">
            <FolderKanban className="h-5 w-5" />
          </div>
        </div>

        {/* Organizations (Blue #eef4ff) */}
        <div className="rounded-[14px] p-[18px_16px] bg-[#eef4ff] flex items-start justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
          <div>
            <div className="text-[13px] font-semibold text-[#1d4ed8]">Organizations</div>
            <div className="text-[32px] font-bold text-[#111827] leading-none my-1.5">{uniqueCompanies}</div>
            <div className="text-[12px] text-[#6b7280]">Distinct client brands</div>
          </div>
          <div className="w-[46px] h-[46px] rounded-[12px] bg-[rgba(37,99,235,0.12)] text-[#2563eb] flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs (Segmented Control) & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-[#f3f4f6] p-[3px] rounded-[9px] w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-[#4361ee] shadow-[0_1px_3px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            All Contacts ({totalContacts})
          </button>
          <button
            onClick={() => setActiveTab('standalone')}
            className={`px-3.5 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'standalone'
                ? 'bg-white text-[#4361ee] shadow-[0_1px_3px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            <span>Standalone Leads</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-[10px] bg-[#fef3c7] text-[#92400e] font-bold">
              {standaloneCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('linked')}
            className={`px-3.5 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'linked'
                ? 'bg-white text-[#4361ee] shadow-[0_1px_3px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-[#6b7280] hover:text-[#111827]'
            }`}
          >
            <span>Linked to Projects</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-[10px] bg-[#dbeafe] text-[#1d4ed8] font-bold">
              {linkedCount}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2 bg-[#f5f6fa] border border-[#e5e7eb] rounded-[8px] px-3 py-1.5 w-full sm:w-[260px]">
          <Search className="h-3.5 w-3.5 text-[#9ca3af] shrink-0" />
          <input
            type="text"
            placeholder="Search name, company, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-[13px] text-[#111827] placeholder:text-[#9ca3af] outline-none w-full"
          />
        </div>
      </div>

      {/* 4. Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <div className="rounded-[12px] bg-white border border-[#e5e7eb] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <Contact className="h-10 w-10 text-[#9ca3af] mx-auto mb-2" />
          <h3 className="text-[15px] font-bold text-[#111827]">No business contacts found</h3>
          <p className="text-[12px] text-[#6b7280] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No contacts match "${searchQuery}". Try clearing the search.`
              : 'Add your first stakeholder or prospective client to start organizing leads.'}
          </p>
          <Button onClick={openCreateModal} className="mt-4 h-[34px] px-4 text-[12.5px]">
            <Plus className="h-4 w-4" /> Add Contact
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => {
            const project = getProject(contact.project_id);
            const notesWordCount = countWords(contact.notes || '');

            return (
              <div
                key={contact.id}
                className="rounded-[12px] bg-white border border-[#e5e7eb] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-[#e5e7eb] pb-3 mb-3">
                    <div>
                      <h3 className="font-bold text-[15px] text-[#111827] leading-snug">
                        {contact.name}
                      </h3>
                      <p className="text-[12px] font-medium text-[#4361ee] mt-0.5">
                        {contact.role}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(contact)}
                        className="w-[28px] h-[28px] rounded-[7px] border border-[#e5e7eb] bg-white text-[#9ca3af] hover:border-[#4361ee] hover:text-[#4361ee] hover:bg-[rgba(67,97,238,0.08)] flex items-center justify-center transition-all cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(contact.id)}
                        className="w-[28px] h-[28px] rounded-[7px] border border-[#e5e7eb] bg-white text-[#9ca3af] hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-[#fef2f2] flex items-center justify-center transition-all cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-[12.5px] text-[#6b7280]">
                    {/* Organization / Company */}
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-[#9ca3af] shrink-0" />
                      <span className="font-medium text-[#111827] truncate">
                        {contact.company_name || project?.client_name || 'Independent / Individual'}
                      </span>
                    </div>

                    {/* Associated Project */}
                    {project ? (
                      <div className="flex items-center justify-between text-[12px] bg-[#f5f6fa] p-2 rounded-[7px] border border-[#e5e7eb]">
                        <div className="flex items-center gap-1.5 truncate">
                          <FolderKanban className="h-3.5 w-3.5 text-[#4361ee] shrink-0" />
                          <span className="truncate font-semibold text-[#111827]">
                            {project.title}
                          </span>
                        </div>
                        <Link
                          href={`/projects/${project.id}?tab=contacts`}
                          className="text-[11px] text-[#4361ee] hover:underline flex items-center gap-0.5 shrink-0 ml-1 font-semibold"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[12px] bg-[#fffbeb] p-2 rounded-[7px] border border-[#fef3c7]">
                        <span className="text-[11px] text-[#92400e] font-medium">
                          Unassigned Lead
                        </span>
                        <button
                          onClick={() => {
                            setLinkModalContact(contact);
                            setSelectedProjectIdToLink('');
                          }}
                          className="h-6 text-[11px] px-2 rounded-[6px] border border-[#f59e0b] text-[#92400e] bg-white hover:bg-[#fef3c7] font-semibold cursor-pointer"
                        >
                          Link Project
                        </button>
                      </div>
                    )}

                    {/* Contact details */}
                    <div className="space-y-1 pt-1 text-[12px]">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-[#9ca3af] shrink-0" />
                        <a href={`mailto:${contact.email}`} className="truncate hover:text-[#4361ee] hover:underline">
                          {contact.email}
                        </a>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="h-3.5 w-3.5 text-[#9ca3af] shrink-0" />
                          <a href={`tel:${contact.phone}`} className="truncate hover:text-[#4361ee] hover:underline">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {contact.notes && (
                      <div className="rounded-[7px] bg-[#f9fafb] border border-[#e5e7eb] p-2 text-[12px] text-[#6b7280] space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-[#9ca3af]">
                          <span>Notes</span>
                          <span className="font-mono">{notesWordCount}/20 words</span>
                        </div>
                        <p className="line-clamp-2 leading-relaxed text-[#111827]">
                          {contact.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Contact */}
      <Modal
        isOpen={isCreateOpen || !!editContact}
        onClose={() => {
          setIsCreateOpen(false);
          setEditContact(null);
          resetForm();
        }}
        title={editContact ? 'Edit Business Contact' : 'New Business Contact'}
        maxWidth="max-w-[520px]"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditContact(null);
                resetForm();
              }}
              className="h-[36px] px-4 text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="contact-form"
              disabled={countWords(formNotes) > 20}
              className="h-[36px] px-5 rounded-[8px] bg-[#4361ee] hover:bg-[#3451d1] text-white text-[13px]"
            >
              {editContact ? 'Save Changes' : 'Create Contact'}
            </Button>
          </>
        }
      >
        <form id="contact-form" onSubmit={handleSaveContact} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                Full Name *
              </label>
              <Input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="text-[13px] h-[36px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                Role / Title *
              </label>
              <Input
                required
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                placeholder="e.g. Head of Product"
                className="text-[13px] h-[36px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
              Company / Organization
            </label>
            <Input
              value={formCompany}
              onChange={(e) => setFormCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="text-[13px] h-[36px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                Email Address *
              </label>
              <Input
                required
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="jane@company.com"
                className="text-[13px] h-[36px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                Phone (Optional)
              </label>
              <Input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="text-[13px] h-[36px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
              Link to Project (Optional)
            </label>
            <select
              value={formProjectId}
              onChange={(e) => setFormProjectId(e.target.value)}
              className="w-full rounded-[8px] border border-[#e5e7eb] bg-white p-2 text-[12.5px] text-[#111827] focus:border-[#4361ee] focus:outline-none"
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

          <div>
            <div className="flex items-center justify-between text-[12px] font-medium text-[#6b7280] mb-1">
              <label>Notes (Max 20 words)</label>
              <span
                className={`font-mono text-[10px] ${
                  countWords(formNotes) > 20
                    ? 'text-[#ef4444] font-bold'
                    : 'text-[#9ca3af]'
                }`}
              >
                {countWords(formNotes)}/20 words
              </span>
            </div>
            <textarea
              rows={2}
              className={`w-full rounded-[8px] border p-2 text-[12.5px] text-[#111827] focus:outline-none focus:border-[#4361ee] ${
                countWords(formNotes) > 20
                  ? 'border-[#fca5a5] bg-[#fef2f2]'
                  : 'border-[#e5e7eb]'
              }`}
              placeholder="Key background context..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Link Contact to Project */}
      <Modal
        isOpen={!!linkModalContact}
        onClose={() => setLinkModalContact(null)}
        title="Link Contact to Project"
        maxWidth="max-w-[420px]"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLinkModalContact(null)}
              className="h-[36px] px-4 text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedProjectIdToLink}
              onClick={handleLinkToProject}
              className="h-[36px] px-5 rounded-[8px] bg-[#4361ee] hover:bg-[#3451d1] text-white text-[13px]"
            >
              Confirm Link
            </Button>
          </>
        }
      >
        {linkModalContact && (
          <div className="space-y-3.5 text-[12.5px]">
            <p className="text-[#6b7280]">
              Assign <strong>{linkModalContact.name}</strong> ({linkModalContact.role}) to an active project workspace.
            </p>

            <div>
              <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                Select Target Project
              </label>
              <select
                value={selectedProjectIdToLink}
                onChange={(e) => setSelectedProjectIdToLink(e.target.value)}
                className="w-full rounded-[8px] border border-[#e5e7eb] bg-white p-2 text-[12.5px] text-[#111827] focus:border-[#4361ee] focus:outline-none"
              >
                <option value="">-- Choose Project --</option>
                {accessibleProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.client_name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Delete"
        maxWidth="max-w-[400px]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="h-[34px] px-4 text-[12.5px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="h-[34px] px-4 rounded-[8px] bg-[#fef2f2] hover:bg-[#fee2e2] text-[#ef4444] border border-[#fca5a5] font-semibold text-[12.5px]"
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-[#fef2f2] text-[#ef4444] flex items-center justify-center shrink-0 border border-[#fca5a5]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[15px] font-bold text-[#111827]">
              Delete Contact?
            </h3>
            <p className="text-[12px] text-[#6b7280]">
              Are you sure you want to delete this contact? This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
