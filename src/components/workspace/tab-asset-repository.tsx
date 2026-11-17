'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Folder,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ASSET_FOLDERS } from '@/lib/initial-data';
import { cn, formatBytes, formatTimestamp } from '@/lib/utils';
import type { AssetFolderCategory, Project } from '@/types/agency';

export function TabAssetRepository({ project }: { project: Project }) {
  const {
    currentUser,
    permissions,
    assets,
    users,
    uploadAsset,
    toggleAssetApproval,
  } = useAuth();

  const [selectedFolder, setSelectedFolder] = useState<
    'All' | AssetFolderCategory
  >('All');
  const [uploadFolder, setUploadFolder] = useState<AssetFolderCategory>(
    'Brand Assets & Logos'
  );
  const [versionTag, setVersionTag] = useState('v1.0');
  const [dragActive, setDragActive] = useState(false);

  const canUpload = permissions.canUploadAssets && !project.is_archived;

  const projectAssets = useMemo(() => {
    return assets.filter((a) => {
      if (a.project_id !== project.id) return false;
      if (selectedFolder !== 'All' && a.folder_category !== selectedFolder) {
        return false;
      }
      return true;
    });
  }, [assets, project.id, selectedFolder]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || !canUpload) return;
    Array.from(fileList).forEach((file) => {
      uploadAsset({
        project_id: project.id,
        folder_category: uploadFolder,
        file_name: file.name,
        file_size: file.size || 245_000,
        version_tag: versionTag.trim() || 'v1.0',
      });
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {/* Folder Sidebar */}
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle>Asset Folders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <button
            type="button"
            onClick={() => setSelectedFolder('All')}
            className={cn(
              'flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer',
              selectedFolder === 'All'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            )}
          >
            <span className="flex items-center gap-2">
              <Folder className="h-3.5 w-3.5" />
              All Assets
            </span>
          </button>
          {ASSET_FOLDERS.map((folder) => {
            const count = assets.filter(
              (a) =>
                a.project_id === project.id &&
                a.folder_category === folder
            ).length;
            return (
              <button
                key={folder}
                type="button"
                onClick={() => setSelectedFolder(folder)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer',
                  selectedFolder === folder
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <Folder className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{folder}</span>
                </span>
                <span className="text-[10px] opacity-75">{count}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Main Upload + File Table */}
      <div className="space-y-4 lg:col-span-3">
        {canUpload && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={uploadFolder}
                  onChange={(e) =>
                    setUploadFolder(e.target.value as AssetFolderCategory)
                  }
                  className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800"
                >
                  {ASSET_FOLDERS.map((f) => (
                    <option key={f} value={f}>
                      Folder: {f}
                    </option>
                  ))}
                </select>
                <Input
                  value={versionTag}
                  onChange={(e) => setVersionTag(e.target.value)}
                  placeholder="Version (e.g. v1.2)"
                  className="h-8 w-32 text-xs"
                />
              </div>

              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer',
                  dragActive
                    ? 'border-zinc-900 bg-zinc-100'
                    : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300'
                )}
              >
                <UploadCloud className="h-6 w-6 text-zinc-400" />
                <p className="mt-2 text-xs font-medium text-zinc-700">
                  Drag &amp; drop files here, or click to upload
                </p>
                <p className="text-[11px] text-zinc-400">
                  Automatically tagged with uploader, timestamp, and version{' '}
                  {versionTag}
                </p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Files ({projectAssets.length})
              {currentUser.role === 'client' && (
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  (Showing client-approved deliverables only)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-100">
            {projectAssets.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-500">
                No files in this folder yet.
              </p>
            ) : (
              projectAssets.map((asset) => {
                const uploader = users.find((u) => u.id === asset.uploaded_by);
                return (
                  <div
                    key={asset.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-zinc-900 truncate">
                            {asset.file_name}
                          </span>
                          <Badge variant="outline">{asset.version_tag}</Badge>
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {asset.folder_category} · {formatBytes(asset.file_size)}{' '}
                          · Uploaded by {uploader?.name ?? 'Unknown'} on{' '}
                          {formatTimestamp(asset.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{asset.version_tag}</Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
