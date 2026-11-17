'use client';

import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  ImageIcon,
  Link2,
  Palette,
  Plus,
  Search,
  Trash2,
  Video as VideoIcon,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cn, formatTimestamp } from '@/lib/utils';
import type { AssetDocType, Project, ProjectAsset } from '@/types/agency';

const DOC_TYPES: AssetDocType[] = [
  'Image',
  'Document',
  'Design / Figma',
  'Video',
  'Spreadsheet',
  'Other',
];

const DOC_TYPE_META: Record<
  AssetDocType,
  {
    icon: React.ComponentType<{ className?: string }>;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    iconColor: string;
  }
> = {
  Image: {
    icon: ImageIcon,
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    iconColor: 'text-purple-600',
  },
  Document: {
    icon: FileText,
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    iconColor: 'text-blue-600',
  },
  'Design / Figma': {
    icon: Palette,
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    iconColor: 'text-amber-600',
  },
  Video: {
    icon: VideoIcon,
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    iconColor: 'text-rose-600',
  },
  Spreadsheet: {
    icon: FileSpreadsheet,
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  Other: {
    icon: Link2,
    badgeBg: 'bg-zinc-100',
    badgeText: 'text-zinc-700',
    badgeBorder: 'border-zinc-200',
    iconColor: 'text-zinc-600',
  },
};

export function TabAssetRepository({ project }: { project: Project }) {
  const { assets, users, addAsset, updateAsset, deleteAsset } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | AssetDocType>('All');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ProjectAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<ProjectAsset | null>(null);

  // Form Fields (Exactly 4: Name, DocType, Drive Link, Notes)
  const [formData, setFormData] = useState<{
    name: string;
    doc_type: AssetDocType;
    drive_link: string;
    notes: string;
  }>({
    name: '',
    doc_type: 'Document',
    drive_link: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const projectAssets = useMemo(() => {
    return assets.filter((a) => a.project_id === project.id);
  }, [assets, project.id]);

  const filteredAssets = useMemo(() => {
    return projectAssets.filter((a) => {
      if (selectedType !== 'All' && a.doc_type !== selectedType) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const nameMatch = (a.name || a.file_name || '').toLowerCase().includes(q);
      const notesMatch = (a.notes || '').toLowerCase().includes(q);
      const linkMatch = (a.drive_link || a.file_url || '').toLowerCase().includes(q);
      return nameMatch || notesMatch || linkMatch;
    });
  }, [projectAssets, selectedType, searchQuery]);

  const openAddModal = () => {
    setFormData({
      name: '',
      doc_type: 'Document',
      drive_link: '',
      notes: '',
    });
    setFormError('');
    setIsAddOpen(true);
  };

  const openEditModal = (asset: ProjectAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name || asset.file_name || '',
      doc_type: asset.doc_type || 'Document',
      drive_link: asset.drive_link || asset.file_url || '',
      notes: asset.notes || '',
    });
    setFormError('');
  };

  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Please enter the name of the document/asset.');
      return;
    }
    if (!formData.drive_link.trim()) {
      setFormError('Please provide the Drive or cloud link.');
      return;
    }

    const cleanedUrl = normalizeUrl(formData.drive_link);
    addAsset({
      project_id: project.id,
      name: formData.name.trim(),
      doc_type: formData.doc_type,
      drive_link: cleanedUrl,
      notes: formData.notes.trim() || undefined,
    });

    setIsAddOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    if (!formData.name.trim()) {
      setFormError('Please enter the name of the document/asset.');
      return;
    }
    if (!formData.drive_link.trim()) {
      setFormError('Please provide the Drive or cloud link.');
      return;
    }

    const cleanedUrl = normalizeUrl(formData.drive_link);
    updateAsset({
      asset_id: editingAsset.id,
      name: formData.name.trim(),
      doc_type: formData.doc_type,
      drive_link: cleanedUrl,
      notes: formData.notes.trim() || undefined,
    });

    setEditingAsset(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingAsset) return;
    deleteAsset(deletingAsset.id);
    setDeletingAsset(null);
  };

  const handleCopyLink = async (asset: ProjectAsset) => {
    const link = asset.drive_link || asset.file_url || '';
    if (!link) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <FolderArchive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Asset Repository
              </h2>
              <p className="text-xs text-zinc-500">
                Centralized cloud links for Google Drive, Figma, Dropbox &amp; SOWs. Zero storage limits, instant 1-click access.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-zinc-900 text-xs font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            Add Asset Link
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Type Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedType('All')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
              selectedType === 'All'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            )}
          >
            All ({projectAssets.length})
          </button>
          {DOC_TYPES.map((type) => {
            const count = projectAssets.filter((a) => a.doc_type === type).length;
            const meta = DOC_TYPE_META[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                  selectedType === type
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                )}
              >
                <meta.icon className="h-3 w-3" />
                <span>{type}</span>
                <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets or notes..."
            className="h-8 pl-8 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Assets List */}
      {filteredAssets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-3">
              <FolderArchive className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800">
              {projectAssets.length === 0
                ? 'No asset links added yet'
                : 'No assets match your search or filter'}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">
              {projectAssets.length === 0
                ? 'Save Google Drive links, Figma designs, spreadsheets, or documents here with 1-click copy and quick access.'
                : 'Try clearing your search query or selecting "All" to view all assets.'}
            </p>
            {projectAssets.length === 0 && (
              <Button
                type="button"
                onClick={openAddModal}
                className="mt-4 flex items-center gap-1.5 bg-zinc-900 text-xs font-medium text-white hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Add First Asset Link
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => {
            const meta = DOC_TYPE_META[asset.doc_type || 'Document'] || DOC_TYPE_META.Other;
            const Icon = meta.icon;
            const uploader = users.find((u) => u.id === asset.uploaded_by);
            const isCopied = copiedId === asset.id;
            const cleanUrl = normalizeUrl(asset.drive_link || asset.file_url || '');

            return (
              <Card
                key={asset.id}
                className="group relative flex flex-col justify-between overflow-hidden border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-xs"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header: DocType badge + Edit/Delete action buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                        meta.badgeBg,
                        meta.badgeText,
                        meta.badgeBorder
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {asset.doc_type || 'Document'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(asset)}
                        title="Edit asset details"
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingAsset(asset)}
                        title="Delete asset link"
                        className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Notes */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {asset.name || asset.file_name}
                    </h3>
                    {asset.notes ? (
                      <p className="mt-1 text-xs text-zinc-600 line-clamp-2">
                        {asset.notes}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-400 italic">
                        No additional notes
                      </p>
                    )}
                  </div>

                  {/* Drive Link Box: Minimal attractive link blue */}
                  <a
                    href={cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-[rgba(67,97,238,0.06)] hover:bg-[rgba(67,97,238,0.12)] px-2.5 py-1.5 border border-[rgba(67,97,238,0.18)] text-[#4361ee] transition-colors group/link"
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-[#4361ee]" />
                    <span className="truncate text-[11.5px] font-medium font-mono text-[#4361ee] group-hover/link:underline">
                      {cleanUrl}
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0 ml-auto text-[#4361ee] opacity-70 group-hover/link:opacity-100" />
                  </a>

                  {/* Metadata (Uploader & Date) */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100">
                    <span>By {uploader?.name || 'Admin'}</span>
                    <span>{formatTimestamp(asset.created_at)}</span>
                  </div>

                  {/* Action Bar: 1-Click Copy & 1-Click Open */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(asset)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 text-xs h-8 transition-colors',
                        isCopied
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'hover:bg-zinc-100'
                      )}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-semibold text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </Button>

                    <a
                      href={cleanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#4361ee] px-3 text-xs font-medium text-white hover:bg-[#3451d1] shadow-sm h-8 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Open Link</span>
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ADD ASSET MODAL */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Asset Link"
        icon={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(67,97,238,0.1)] text-[#4361ee]">
            <Plus className="h-4 w-4" />
          </div>
        }
        maxWidth="max-w-[500px]"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-asset-form"
              className="h-8 bg-[#4361ee] hover:bg-[#3451d1] text-xs text-white"
            >
              Save Asset Link
            </Button>
          </>
        }
      >
        <form id="add-asset-form" onSubmit={handleSaveAdd} className="space-y-4">
          {formError && (
            <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {formError}
            </div>
          )}

          {/* 1. Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Name of Document / Asset <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Master Figma Design System, Brand Guidelines PDF"
              className="h-9 text-xs"
              required
            />
          </div>

          {/* 2. DocType */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              DocType <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.doc_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  doc_type: e.target.value as AssetDocType,
                })
              }
              className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
            >
              {DOC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Drive Link */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Drive / Cloud Link <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.drive_link}
              onChange={(e) =>
                setFormData({ ...formData, drive_link: e.target.value })
              }
              placeholder="https://drive.google.com/drive/folders/... or Figma URL"
              className="h-9 text-xs font-mono"
              required
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              Google Drive, Figma, Dropbox, OneDrive, or Notion links.
            </p>
          </div>

          {/* 4. Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="e.g. Contains high-res vector logos, font files, and dark mode variations. Anyone with link has view permission."
              className="w-full rounded-md border border-zinc-300 p-2 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
            />
          </div>
        </form>
      </Modal>

      {/* EDIT ASSET MODAL */}
      <Modal
        isOpen={!!editingAsset}
        onClose={() => setEditingAsset(null)}
        title="Edit Asset Link"
        icon={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(67,97,238,0.1)] text-[#4361ee]">
            <Edit3 className="h-4 w-4" />
          </div>
        }
        maxWidth="max-w-[500px]"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingAsset(null)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-asset-form"
              className="h-8 bg-[#4361ee] hover:bg-[#3451d1] text-xs text-white"
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form id="edit-asset-form" onSubmit={handleSaveEdit} className="space-y-4">
          {formError && (
            <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {formError}
            </div>
          )}

          {/* 1. Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Name of Document / Asset <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Master Figma Design System"
              className="h-9 text-xs"
              required
            />
          </div>

          {/* 2. DocType */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              DocType <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.doc_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  doc_type: e.target.value as AssetDocType,
                })
              }
              className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
            >
              {DOC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Drive Link */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Drive / Cloud Link <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.drive_link}
              onChange={(e) =>
                setFormData({ ...formData, drive_link: e.target.value })
              }
              placeholder="https://drive.google.com/..."
              className="h-9 text-xs font-mono"
              required
            />
          </div>

          {/* 4. Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="Notes about access or version info..."
              className="w-full rounded-md border border-zinc-300 p-2 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
            />
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION POPUP MODAL */}
      <Modal
        isOpen={!!deletingAsset}
        onClose={() => setDeletingAsset(null)}
        title="Confirm Delete"
        maxWidth="max-w-[420px]"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingAsset(null)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmDelete}
              className="h-8 bg-red-600 text-xs text-white hover:bg-red-700"
            >
              Yes, Delete
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 border border-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Delete Asset Link?
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Are you sure you want to remove <span className="font-semibold text-zinc-900">&ldquo;{deletingAsset?.name || deletingAsset?.file_name}&rdquo;</span> from this project&apos;s asset repository?
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
