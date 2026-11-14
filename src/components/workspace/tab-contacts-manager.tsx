'use client';

import React, { useState } from 'react';
import {
  Mail,
  MoreVertical,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Project } from '@/types/agency';

export function TabContactsManager({ project }: { project: Project }) {
  const { contacts, addContact, updateContact, deleteContact, permissions } =
    useAuth();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [canAccessPortal, setCanAccessPortal] = useState(true);

  const projectContacts = contacts.filter((c) => c.project_id === project.id);

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
      is_primary: isPrimary || projectContacts.length === 0,
      can_access_portal: canAccessPortal,
    });

    setName('');
    setRole('');
    setEmail('');
    setPhone('');
    setNotes('');
    setIsPrimary(false);
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-600" />
            Client Stakeholders &amp; Contact Directory ({projectContacts.length})
          </h2>
          <p className="text-xs text-zinc-500">
            A single project often involves multiple decision makers (Executive,
            Technical, Creative, Billing). Manage their credentials and portal
            access here.
          </p>
        </div>
        {permissions.canManageMeetingsAndProposals && (
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            <Plus className="h-3.5 w-3.5" /> Add Contact
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
                <label className="text-xs font-medium text-zinc-700">
                  Notes &amp; Communication Preferences
                </label>
                <Input
                  placeholder="e.g. Prefers WhatsApp quick syncs; reviews contracts on Thursdays"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-3">
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      className="rounded border-zinc-300"
                    />
                    Mark as Primary Contact
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canAccessPortal}
                      onChange={(e) => setCanAccessPortal(e.target.checked)}
                      className="rounded border-zinc-300"
                    />
                    Grant Client Portal Access
                  </label>
                </div>

                <div className="flex gap-2">
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
              </div>
            </form>
          </CardContent>
        </Card>
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
                  <div className="flex flex-col items-end gap-1">
                    {contact.is_primary && (
                      <Badge variant="default" className="text-[10px]">
                        Primary Lead
                      </Badge>
                    )}
                    {contact.can_access_portal && (
                      <Badge variant="success" className="text-[10px]">
                        <ShieldCheck className="h-2.5 w-2.5" /> Portal Active
                      </Badge>
                    )}
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
                    <p className="text-[11px] text-zinc-500 italic pt-1">
                      {contact.notes}
                    </p>
                  )}
                </div>

                {permissions.canManageMeetingsAndProposals && (
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px]">
                    <button
                      type="button"
                      className="text-zinc-500 hover:text-zinc-900 cursor-pointer"
                      onClick={() =>
                        updateContact(contact.id, {
                          is_primary: !contact.is_primary,
                        })
                      }
                    >
                      {contact.is_primary ? 'Unset Primary' : 'Set as Primary'}
                    </button>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      onClick={() => deleteContact(contact.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
