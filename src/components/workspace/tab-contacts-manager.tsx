'use client';

import React, { useState } from 'react';
import {
  Edit3,
  Mail,
  Phone,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Project, ProjectContact } from '@/types/agency';

export function TabContactsManager({ project }: { project: Project }) {
  const { contacts, addContact, updateContact, deleteContact, permissions } =
    useAuth();

  const [showAdd, setShowAdd] = useState(false);
  const [editingContact, setEditingContact] = useState<ProjectContact | null>(null);

  // Add form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Edit form fields
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const projectContacts = contacts.filter((c) => c.project_id === project.id);

  const countWords = (str: string) => {
    return str.trim() ? str.trim().split(/\s+/).length : 0;
  };

  const handleNotesChange = (val: string, isEdit: boolean) => {
    const words = val.trim() ? val.trim().split(/\s+/) : [];
    if (words.length > 20) {
      const truncated = words.slice(0, 20).join(' ');
      if (isEdit) setEditNotes(truncated);
      else setNotes(truncated);
    } else {
      if (isEdit) setEditNotes(val);
      else setNotes(val);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addContact({
      project_id: project.id,
      name,
      role: role.trim() || 'Stakeholder',
      email,
      phone,
      notes,
      is_primary: projectContacts.length === 0,
      can_access_portal: true,
    });

    setName('');
    setRole('');
    setEmail('');
    setPhone('');
    setNotes('');
    setShowAdd(false);
  };

  const startEdit = (c: ProjectContact) => {
    setEditingContact(c);
    setEditName(c.name);
    setEditRole(c.role);
    setEditEmail(c.email);
    setEditPhone(c.phone || '');
    setEditNotes(c.notes || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !editName.trim() || !editEmail.trim()) return;

    updateContact(editingContact.id, {
      name: editName.trim(),
      role: editRole.trim() || 'Stakeholder',
      email: editEmail.trim(),
      phone: editPhone.trim() || null,
      notes: editNotes.trim() || null,
    });

    setEditingContact(null);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-600" />
            Client Stakeholders &amp; Contacts ({projectContacts.length})
          </h2>
          <p className="text-xs text-zinc-500">
            Keep track of all client contacts for this project. Notes are restricted to max 20 words.
          </p>
        </div>
        {permissions.canManageMeetingsAndProposals && (
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            <Plus className="h-3.5 w-3.5" /> {showAdd ? 'Close' : 'Add Contact'}
          </Button>
        )}
      </div>

      {/* Add Contact Card */}
      {showAdd && (
        <Card className="border-zinc-300 bg-zinc-50/70">
          <CardHeader>
            <CardTitle className="text-sm">Register New Stakeholder Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Full Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Role / Job Title *
                  </label>
                  <Input
                    required
                    placeholder="e.g. VP of Engineering"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Email Address *
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="sarah@client.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Phone / WhatsApp
                  </label>
                  <Input
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700">
                    Notes (Max 20 words)
                  </label>
                  <span className="text-[11px] text-zinc-500">
                    {countWords(notes)}/20 words
                  </span>
                </div>
                <Input
                  placeholder="e.g. Lead reviewer for weekly architecture demos"
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value, false)}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-200 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Contact
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                Edit Contact: {editingContact.name}
              </h3>
              <button
                type="button"
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                onClick={() => setEditingContact(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Full Name *</label>
                  <Input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Role / Job Title *</label>
                  <Input
                    required
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Email Address *</label>
                  <Input
                    required
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Phone / WhatsApp</label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700">Notes (Max 20 words)</label>
                  <span className="text-[11px] text-zinc-500">{countWords(editNotes)}/20 words</span>
                </div>
                <Input
                  value={editNotes}
                  onChange={(e) => handleNotesChange(e.target.value, true)}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingContact(null)}
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

      {/* Contacts Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projectContacts.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-xs text-zinc-500">
              No contacts recorded for this project yet. Add primary stakeholders
              to link discovery meetings and proposal sign-offs.
            </CardContent>
          </Card>
        ) : (
          projectContacts.map((contact) => (
            <Card key={contact.id} className="relative transition-all hover:border-zinc-300">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      {contact.name}
                    </h3>
                    <p className="text-xs text-zinc-500">{contact.role}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-600 border-t border-zinc-100 pt-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-blue-600 hover:underline truncate"
                    >
                      {contact.email}
                    </a>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.notes && (
                    <p className="text-[11px] text-zinc-600 italic pt-1">
                      {contact.notes}
                    </p>
                  )}
                </div>

                {permissions.canManageMeetingsAndProposals && (
                  <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-2 text-[11px]">
                    <button
                      type="button"
                      className="text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                      onClick={() => startEdit(contact)}
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      onClick={() => deleteContact(contact.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
