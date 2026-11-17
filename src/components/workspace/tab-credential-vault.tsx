'use client';

import React, { useState, useMemo } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Mail,
  Pencil,
  Plus,
  Search,
  Server,
  Share2,
  CreditCard,
  Cloud,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { maskSecret } from '@/lib/crypto-client';
import type { Project, ProjectCredential, CredentialCategory } from '@/types/agency';

const CATEGORIES: { label: CredentialCategory; icon: typeof KeyRound; bg: string; color: string; border: string; badgeClass: string }[] = [
  { label: 'Domain', icon: Globe, bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-200', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Hosting', icon: Server, bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-200', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Cloud', icon: Cloud, bg: 'bg-orange-50', color: 'text-orange-600', border: 'border-orange-200', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' },
  { label: 'Email', icon: Mail, bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-200', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Social Media', icon: Share2, bg: 'bg-cyan-50', color: 'text-cyan-600', border: 'border-cyan-200', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { label: 'Payment Gateway', icon: CreditCard, bg: 'bg-pink-50', color: 'text-pink-600', border: 'border-pink-200', badgeClass: 'bg-pink-50 text-pink-700 border-pink-200' },
  { label: 'Other', icon: KeyRound, bg: 'bg-zinc-100', color: 'text-zinc-600', border: 'border-zinc-200', badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
];

function getCategoryConfig(cat?: CredentialCategory | null) {
  return CATEGORIES.find((c) => c.label === cat) || CATEGORIES[6];
}

export function TabCredentialVault({ project }: { project: Project }) {
  const {
    permissions,
    credentials,
    addCredential,
    updateCredential,
    deleteCredential,
    revealCredential,
  } = useAuth();

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reveal / Loading / Copied states
  const [revealedMap, setRevealedMap] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedUserMap, setCopiedUserMap] = useState<Record<string, boolean>>({});
  const [copiedPassMap, setCopiedPassMap] = useState<Record<string, boolean>>({});

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<ProjectCredential | null>(null);
  const [deletingCred, setDeletingCred] = useState<ProjectCredential | null>(null);

  // Form Fields
  const [formService, setFormService] = useState('');
  const [formCategory, setFormCategory] = useState<CredentialCategory>('Hosting');
  const [formUsername, setFormUsername] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formShowSecret, setFormShowSecret] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Access Control Guard
  if (!permissions.canViewCredentials) {
    return (
      <Card className="border-red-200 bg-red-50/40">
        <CardContent className="pt-6 text-center space-y-2">
          <ShieldAlert className="mx-auto h-8 w-8 text-red-600" />
          <h3 className="text-sm font-semibold text-red-900">
            Encrypted Vault Restricted
          </h3>
          <p className="text-xs text-red-700">
            Client accounts do not have access to internal agency credentials or
            API keys.
          </p>
        </CardContent>
      </Card>
    );
  }

  const projectCreds = useMemo(
    () => credentials.filter((c) => c.project_id === project.id),
    [credentials, project.id]
  );

  const filteredCreds = useMemo(() => {
    return projectCreds.filter((c) => {
      const matchCat = !selectedCategory || c.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.service_name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        (c.login_url && c.login_url.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [projectCreds, selectedCategory, searchQuery]);

  const handleRevealToggle = async (credId: string) => {
    if (revealedMap[credId]) {
      setRevealedMap((prev) => {
        const next = { ...prev };
        delete next[credId];
        return next;
      });
      return;
    }

    setLoadingId(credId);
    try {
      const plaintext = await revealCredential(project.id, credId);
      setRevealedMap((prev) => ({ ...prev, [credId]: plaintext }));
    } finally {
      setLoadingId(null);
    }
  };

  const handleCopyUsername = async (credId: string, val: string) => {
    await navigator.clipboard.writeText(val);
    setCopiedUserMap((prev) => ({ ...prev, [credId]: true }));
    setTimeout(() => {
      setCopiedUserMap((prev) => ({ ...prev, [credId]: false }));
    }, 1600);
  };

  const handleCopyPassword = async (credId: string) => {
    let secret = revealedMap[credId];
    if (!secret) {
      setLoadingId(credId);
      try {
        secret = await revealCredential(project.id, credId);
        setRevealedMap((prev) => ({ ...prev, [credId]: secret }));
      } finally {
        setLoadingId(null);
      }
    }
    if (secret) {
      await navigator.clipboard.writeText(secret);
      setCopiedPassMap((prev) => ({ ...prev, [credId]: true }));
      setTimeout(() => {
        setCopiedPassMap((prev) => ({ ...prev, [credId]: false }));
      }, 1600);
    }
  };

  const openAddModal = () => {
    setFormService('');
    setFormCategory('Hosting');
    setFormUsername('');
    setFormSecret('');
    setFormShowSecret(false);
    setFormUrl('');
    setFormNotes('');
    setIsAddOpen(true);
  };

  const openEditModal = (cred: ProjectCredential) => {
    setEditingCred(cred);
    setFormService(cred.service_name);
    setFormCategory(cred.category || 'Other');
    setFormUsername(cred.username);
    setFormSecret(''); // Empty by default; leave blank to keep
    setFormShowSecret(false);
    setFormUrl(cred.login_url || '');
    setFormNotes(cred.notes || '');
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formService.trim() || !formUsername.trim() || !formSecret.trim()) return;

    setIsSubmitting(true);
    try {
      await addCredential({
        project_id: project.id,
        service_name: formService.trim(),
        category: formCategory,
        username: formUsername.trim(),
        plaintext_secret: formSecret,
        login_url: formUrl.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      setIsAddOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCred || !formService.trim() || !formUsername.trim()) return;

    setIsSubmitting(true);
    try {
      await updateCredential({
        project_id: project.id,
        credential_id: editingCred.id,
        service_name: formService.trim(),
        category: formCategory,
        username: formUsername.trim(),
        plaintext_secret: formSecret.trim() ? formSecret : undefined,
        login_url: formUrl.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      setEditingCred(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingCred) return;
    deleteCredential(project.id, deletingCred.id);
    setDeletingCred(null);
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200/80 pb-3">
        <div>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Lock className="h-4 w-4 text-zinc-900" />
            Credentials Vault
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            AES-256-GCM Encrypted Storage · Audit trail logged on every reveal
          </p>
        </div>

        {permissions.canManageCredentials && !project.is_archived && (
          <Button
            size="sm"
            onClick={openAddModal}
            className="cursor-pointer gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Credential
          </Button>
        )}
      </div>

      {/* ── Security Trust Architecture Banner ── */}
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/60 p-3.5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-zinc-900 flex items-center gap-2">
              <span>Zero-Knowledge AES-256-GCM Encryption</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Military Grade
              </span>
            </div>
            <p className="text-zinc-600 leading-relaxed text-[11.5px]">
              Passwords and API tokens are never saved in plaintext. Each entry is encrypted with a unique 96-bit initialization vector (IV) and 128-bit authentication tag. Every single Reveal is immutably logged with actor identity, timestamp, and audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-9 w-full sm:w-48 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.label} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search credentials by service, username, URL..."
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          />
        </div>
      </div>

      {/* ── Credentials List (PMS Card Structure) ── */}
      {filteredCreds.length === 0 ? (
        <Card className="border-dashed border-zinc-200 bg-zinc-50/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <KeyRound className="h-10 w-10 text-zinc-300 mb-2 stroke-[1.5]" />
            <h3 className="text-xs font-semibold text-zinc-700">No credentials found</h3>
            <p className="text-[11px] text-zinc-400 max-w-sm mt-0.5">
              {projectCreds.length === 0
                ? 'Store your project servers, domains, databases, and third-party API credentials securely.'
                : 'No credentials match your search or category filter.'}
            </p>
            {permissions.canManageCredentials && !project.is_archived && projectCreds.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={openAddModal}
                className="mt-3 cursor-pointer text-xs"
              >
                <Plus className="h-3 w-3 mr-1" /> Add First Credential
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredCreds.map((cred) => {
            const revealed = revealedMap[cred.id];
            const cfg = getCategoryConfig(cred.category);
            const Icon = cfg.icon;
            const isRevealing = loadingId === cred.id;
            const userCopied = copiedUserMap[cred.id];
            const passCopied = copiedPassMap[cred.id];

            return (
              <div
                key={cred.id}
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-xs transition hover:border-zinc-300 hover:shadow-sm"
              >
                {/* Left: Icon + Info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cfg.bg} ${cfg.color} ${cfg.border} shadow-2xs`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-zinc-900 truncate">
                        {cred.service_name}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${cfg.badgeClass}`}
                      >
                        {cred.category || 'Other'}
                      </span>
                      {cred.login_url && (
                        <a
                          href={cred.login_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-blue-600 transition"
                          title={cred.login_url}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 truncate">
                      <span className="font-mono text-zinc-700 font-medium">
                        {cred.username}
                      </span>
                      {cred.notes && (
                        <>
                          <span className="text-zinc-300">·</span>
                          <span className="truncate text-zinc-400" title={cred.notes}>
                            {cred.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center: Secret Box */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 min-w-[170px] justify-between">
                  <div className="font-mono text-xs">
                    {revealed ? (
                      <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {revealed}
                      </span>
                    ) : (
                      <span className="text-zinc-400 tracking-widest text-sm">
                        {maskSecret(10)}
                      </span>
                    )}
                  </div>
                  {revealed && (
                    <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
                      Decrypted
                    </span>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0 self-end md:self-center">
                  {/* Reveal / Hide Toggle */}
                  <button
                    onClick={() => handleRevealToggle(cred.id)}
                    disabled={isRevealing}
                    title={revealed ? 'Hide secret' : 'Reveal secret (logged to audit)'}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition cursor-pointer disabled:opacity-50"
                  >
                    {revealed ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Copy Username */}
                  <button
                    onClick={() => handleCopyUsername(cred.id, cred.username)}
                    title="Copy Username"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition cursor-pointer"
                  >
                    {userCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <span className="text-[10px] font-bold">@</span>
                    )}
                  </button>

                  {/* Copy Password */}
                  <button
                    onClick={() => handleCopyPassword(cred.id)}
                    disabled={isRevealing}
                    title="Copy Password"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition cursor-pointer disabled:opacity-50"
                  >
                    {passCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Edit */}
                  {permissions.canManageCredentials && !project.is_archived && (
                    <button
                      onClick={() => openEditModal(cred)}
                      title="Edit Credential"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Delete */}
                  {permissions.canManageCredentials && !project.is_archived && (
                    <button
                      onClick={() => setDeletingCred(cred)}
                      title="Delete Credential"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:border-red-300 hover:text-red-600 hover:bg-red-50/50 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Add Credential ── */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Credential"
        icon={
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <KeyRound className="h-4 w-4" />
          </div>
        }
        maxWidth="max-w-[500px]"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-cred-form"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#4361ee] hover:bg-[#3451d1] text-white"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              {isSubmitting ? 'Encrypting...' : 'Encrypt & Save'}
            </Button>
          </>
        }
      >
        <form id="add-cred-form" onSubmit={handleSaveAdd} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">
              Service / Platform Name *
            </label>
            <Input
              required
              placeholder="e.g. AWS Production, Hostinger cPanel, Stripe API"
              value={formService}
              onChange={(e) => setFormService(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Category *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as CredentialCategory)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#4361ee]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Username / Email *
              </label>
              <Input
                required
                placeholder="admin@agency.com"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 flex items-center justify-between">
              <span>Password / API Token *</span>
              <span className="text-[10px] text-zinc-400 font-mono">Encrypted with AES-256</span>
            </label>
            <div className="relative">
              <Input
                required
                type={formShowSecret ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={formSecret}
                onChange={(e) => setFormSecret(e.target.value)}
                className="h-9 pr-8 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setFormShowSecret(!formShowSecret)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                {formShowSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">
              Login URL (Optional)
            </label>
            <Input
              type="url"
              placeholder="https://console.aws.amazon.com"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">
              Notes (Optional)
            </label>
            <Input
              placeholder="2FA codes in 1Password vault, VPN required..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* ── Modal: Edit Credential ── */}
      <Modal
        isOpen={!!editingCred}
        onClose={() => setEditingCred(null)}
        title="Edit Credential"
        icon={
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Pencil className="h-4 w-4" />
          </div>
        }
        maxWidth="max-w-[500px]"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingCred(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-cred-form"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#4361ee] hover:bg-[#3451d1] text-white"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              {isSubmitting ? 'Saving...' : 'Update Credential'}
            </Button>
          </>
        }
      >
        <form id="edit-cred-form" onSubmit={handleSaveEdit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">
              Service / Platform Name *
            </label>
            <Input
              required
              value={formService}
              onChange={(e) => setFormService(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Category *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as CredentialCategory)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#4361ee]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Username / Email *
              </label>
              <Input
                required
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 flex items-center justify-between">
              <span>Rotate Password (Optional)</span>
              <span className="text-[10px] text-zinc-400">Leave blank to keep current</span>
            </label>
            <div className="relative">
              <Input
                type={formShowSecret ? 'text' : 'password'}
                placeholder="Enter new password to rotate..."
                value={formSecret}
                onChange={(e) => setFormSecret(e.target.value)}
                className="h-9 pr-8 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setFormShowSecret(!formShowSecret)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                {formShowSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">
              Login URL (Optional)
            </label>
            <Input
              type="url"
              placeholder="https://console.aws.amazon.com"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">
              Notes (Optional)
            </label>
            <Input
              placeholder="Additional access notes..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* ── Modal: Delete Confirmation ── */}
      <Modal
        isOpen={!!deletingCred}
        onClose={() => setDeletingCred(null)}
        title="Confirm Delete"
        maxWidth="max-w-[420px]"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingCred(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 border border-red-100 text-red-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Delete Credential?
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-zinc-700">
                "{deletingCred?.service_name}"
              </span>
              ? This deletion will be permanently recorded in the audit trail.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
