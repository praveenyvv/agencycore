'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { maskSecret } from '@/lib/crypto-client';
import { formatTimestamp } from '@/lib/utils';
import type { Project } from '@/types/agency';

const credentialSchema = z.object({
  service_name: z.string().min(2, 'Service name is required'),
  login_url: z.string().optional(),
  username: z.string().min(1, 'Username or email is required'),
  plaintext_secret: z.string().min(1, 'Password or API key is required'),
  notes: z.string().optional(),
});

type CredentialFormValues = z.infer<typeof credentialSchema>;

export function TabCredentialVault({ project }: { project: Project }) {
  const {
    permissions,
    credentials,
    users,
    addCredential,
    revealCredential,
  } = useAuth();

  const [revealedMap, setRevealedMap] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CredentialFormValues>({
    resolver: zodResolver(credentialSchema),
  });

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

  const projectCreds = credentials.filter((c) => c.project_id === project.id);

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

  const handleCopy = async (credId: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(credId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const onAddSubmit = async (values: CredentialFormValues) => {
    await addCredential({
      project_id: project.id,
      service_name: values.service_name,
      login_url: values.login_url,
      username: values.username,
      plaintext_secret: values.plaintext_secret,
      notes: values.notes,
    });
    reset();
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-zinc-700" />
              AES-256-GCM Encrypted Credential Vault
            </CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">
              Secrets are encrypted at rest. Every Reveal action writes an
              immutable entry to the Audit Log.
            </p>
          </div>
          {permissions.canManageCredentials && !project.is_archived && (
            <Button
              size="sm"
              onClick={() => setShowAddForm((prev) => !prev)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Credential
            </Button>
          )}
        </CardHeader>

        {showAddForm && (
          <CardContent className="border-t border-zinc-100 bg-zinc-50/70 pt-4">
            <form
              onSubmit={handleSubmit(onAddSubmit)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Platform / Service Name *
                </label>
                <Input
                  placeholder="e.g. AWS Production, Vercel, WordPress"
                  {...register('service_name')}
                />
                {errors.service_name && (
                  <p className="text-[11px] text-red-600">
                    {errors.service_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Login URL
                </label>
                <Input
                  placeholder="https://console.aws.amazon.com"
                  {...register('login_url')}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Username / Email *
                </label>
                <Input
                  placeholder="devops@auroralabs.co"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-[11px] text-red-600">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Password / API Key *
                </label>
                <Input
                  type="password"
                  placeholder="Will be encrypted with AES-256-GCM"
                  {...register('plaintext_secret')}
                />
                {errors.plaintext_secret && (
                  <p className="text-[11px] text-red-600">
                    {errors.plaintext_secret.message}
                  </p>
                )}
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-zinc-700">
                  Notes
                </label>
                <Input
                  placeholder="2FA backup codes stored in 1Password..."
                  {...register('notes')}
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Encrypt &amp; Save
                </Button>
              </div>
            </form>
          </CardContent>
        )}

        <CardContent className="pt-2">
          {projectCreds.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-500">
              No credentials stored in this project vault yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 text-[11px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="py-2.5 pr-4 font-medium">Service</th>
                    <th className="py-2.5 pr-4 font-medium">Username</th>
                    <th className="py-2.5 pr-4 font-medium">Secret</th>
                    <th className="py-2.5 pr-4 font-medium">Notes</th>
                    <th className="py-2.5 pr-4 font-medium">Updated</th>
                    <th className="py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {projectCreds.map((cred) => {
                    const revealed = revealedMap[cred.id];
                    const updater = users.find((u) => u.id === cred.updated_by);
                    return (
                      <tr key={cred.id} className="hover:bg-zinc-50/60">
                        <td className="py-3 pr-4 font-medium text-zinc-900">
                          <div className="flex items-center gap-1.5">
                            <span>{cred.service_name}</span>
                            {cred.login_url && (
                              <a
                                href={cred.login_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-400 hover:text-zinc-800"
                                title={cred.login_url}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-zinc-700">
                          {cred.username}
                        </td>
                        <td className="py-3 pr-4 font-mono">
                          {revealed ? (
                            <Badge variant="warning" className="font-mono">
                              {revealed}
                            </Badge>
                          ) : (
                            <span className="text-zinc-400 tracking-widest">
                              {maskSecret(12)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-zinc-500 max-w-xs truncate">
                          {cred.notes || '—'}
                        </td>
                        <td className="py-3 pr-4 text-[11px] text-zinc-500">
                          {updater?.name ?? 'Staff'} ·{' '}
                          {formatTimestamp(cred.updated_at)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loadingId === cred.id}
                              onClick={() => handleRevealToggle(cred.id)}
                            >
                              {revealed ? (
                                <>
                                  <EyeOff className="h-3 w-3" /> Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3" /> Reveal
                                </>
                              )}
                            </Button>
                            {revealed && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleCopy(cred.id, revealed)}
                              >
                                <Copy className="h-3 w-3" />
                                {copiedId === cred.id ? 'Copied' : 'Copy'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
