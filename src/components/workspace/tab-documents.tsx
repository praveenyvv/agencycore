'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileCheck,
  FileText,
  Lock,
  Plus,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatBytes, formatTimestamp } from '@/lib/utils';
import type { Project, ProjectDocument } from '@/types/agency';

const DOC_TYPES: ProjectDocument['doc_type'][] = [
  'Proposal',
  'Contract',
  'SOW',
  'NDA',
  'Technical Spec',
  'Other',
];

export function TabDocuments({ project }: { project: Project }) {
  const {
    currentUser,
    permissions,
    documents,
    users,
    uploadDocument,
    toggleDocumentSignOff,
  } = useAuth();

  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<ProjectDocument['doc_type']>('Contract');
  const [fileName, setFileName] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);

  const projectDocs = documents
    .filter((d) => d.project_id === project.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileName.trim()) return;

    uploadDocument({
      project_id: project.id,
      title,
      doc_type: docType,
      file_name: fileName,
      file_url: `#doc-${Date.now()}`,
      file_size: 1_250_000,
      is_mandatory: isMandatory,
    });

    setTitle('');
    setFileName('');
    setShowUpload(false);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-zinc-600" />
            Mandatory Documents &amp; Commercial Contracts
          </h2>
          <p className="text-xs text-zinc-500">
            Centrally organized repository for client proposals, NDAs, signed
            Statements of Work (SOW), and technical sign-offs.
          </p>
        </div>
        {permissions.canEditScope && (
          <Button size="sm" onClick={() => setShowUpload((v) => !v)}>
            <Plus className="h-3.5 w-3.5" /> Upload Document
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {showUpload && (
        <Card className="border-zinc-300 bg-zinc-50/60">
          <CardHeader>
            <CardTitle className="text-sm">Upload Mandatory Document</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadSubmit} className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Document Title *
                </label>
                <Input
                  required
                  placeholder="e.g. Executed Master SOW"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  Document Type *
                </label>
                <select
                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs"
                  value={docType}
                  onChange={(e) =>
                    setDocType(e.target.value as ProjectDocument['doc_type'])
                  }
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">
                  File Attachment Name *
                </label>
                <Input
                  required
                  placeholder="e.g. statement-of-work-signed.pdf"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
              </div>

              <div className="sm:col-span-3 flex items-center justify-between border-t border-zinc-200 pt-3">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  Mark as Mandatory Delivery Document
                </label>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUpload(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    <Upload className="h-3.5 w-3.5" /> Save Document
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Documents Table */}
      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {projectDocs.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-500">
              No contracts or documents registered yet.
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-2.5 px-3">Document Title</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">File</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Uploaded</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {projectDocs.map((doc) => {
                  const uploader = users.find((u) => u.id === doc.uploaded_by);
                  return (
                    <tr key={doc.id} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-3 font-medium text-zinc-900">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>{doc.title}</span>
                          {doc.is_mandatory && (
                            <Badge variant="secondary" className="text-[10px]">
                              Mandatory
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-600">
                        <Badge variant="outline">{doc.doc_type}</Badge>
                      </td>
                      <td className="py-3 px-3 text-zinc-600 font-mono text-[11px]">
                        {doc.file_name} ({formatBytes(doc.file_size || 500000)})
                      </td>
                      <td className="py-3 px-3">
                        {doc.is_signed_off ? (
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3" /> Signed Off
                          </Badge>
                        ) : (
                          <Badge variant="warning">Pending Sign-off</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-zinc-500">
                        {uploader?.name ?? 'Staff'} ·{' '}
                        {formatTimestamp(doc.created_at)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {currentUser.role === 'client' && !doc.is_signed_off && (
                            <Button
                              size="sm"
                              variant="default"
                              className="text-xs"
                              onClick={() => toggleDocumentSignOff(doc.id)}
                            >
                              Sign Off
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() =>
                              alert(
                                `Downloading document: ${doc.file_name} from secure repository.`
                              )
                            }
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
