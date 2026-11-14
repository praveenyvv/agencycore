'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderPlus, X } from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProjectType } from '@/types/agency';

const PROJECT_TYPES: ProjectType[] = [
  'Website',
  'Web App',
  'Mobile App',
  'Digital Marketing',
];

const newProjectSchema = z
  .object({
    title: z.string().min(3, 'Project title must be at least 3 characters'),
    client_name: z.string().min(2, 'Client name is required'),
    project_type: z.enum([
      'Website',
      'Web App',
      'Mobile App',
      'Digital Marketing',
    ]),
    initial_stage: z.enum([
      'Lead/Discovery',
      'Meeting Scheduled',
      'Intake',
      'In Execution',
    ]),
    start_date: z.string().min(1, 'Start date is required'),
    target_end_date: z.string().min(1, 'Target end date is required'),
    scope_summary: z
      .string()
      .min(5, 'Initial summary or pain points must be at least 5 characters'),
    out_of_scope_notes: z.string().optional(),
    deliverables_text: z.string().optional(),
  })
  .refine((data) => data.target_end_date >= data.start_date, {
    message: 'Target end date must be on or after the start date',
    path: ['target_end_date'],
  });

type NewProjectFormValues = z.infer<typeof newProjectSchema>;

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewProjectModal({ open, onClose }: NewProjectModalProps) {
  const router = useRouter();
  const { createProject, permissions } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewProjectFormValues>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      title: '',
      client_name: '',
      project_type: 'Web App',
      initial_stage: 'Lead/Discovery',
      start_date: '2026-11-14',
      target_end_date: '2026-12-18',
      scope_summary: '',
      out_of_scope_notes: '',
      deliverables_text: 'Discovery & Pain-Point Architecture\nCore Build & QA\nProduction Handover',
    },
  });

  if (!open || !permissions.canCreateProject) return null;

  const onSubmit = (values: NewProjectFormValues) => {
    const deliverables = (values.deliverables_text ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const created = createProject({
      title: values.title,
      client_name: values.client_name,
      project_type: values.project_type,
      initial_stage: values.initial_stage,
      start_date: values.start_date,
      target_end_date: values.target_end_date,
      scope_summary: values.scope_summary,
      out_of_scope_notes: values.out_of_scope_notes,
      deliverables,
    });

    reset();
    onClose();
    router.push(`/projects/${created.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-zinc-700" />
            <h2 className="text-sm font-semibold text-zinc-900">
              New Project &amp; Requirements Intake
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Project Title *
              </label>
              <Input
                placeholder="e.g. NovaPay Mobile Wallet"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-[11px] text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Client Name *
              </label>
              <Input
                placeholder="e.g. NovaPay Inc."
                {...register('client_name')}
              />
              {errors.client_name && (
                <p className="text-[11px] text-red-600">
                  {errors.client_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Project Type *
              </label>
              <select
                {...register('project_type')}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Initial Pipeline Stage *
              </label>
              <select
                {...register('initial_stage')}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15"
              >
                <option value="Lead/Discovery">Lead / Initial Discovery</option>
                <option value="Meeting Scheduled">Meeting Scheduled</option>
                <option value="Intake">Intake (Confirmed Deal)</option>
                <option value="In Execution">Directly In Execution</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Start Date *
              </label>
              <Input type="date" {...register('start_date')} />
              {errors.start_date && (
                <p className="text-[11px] text-red-600">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Target End Date *
              </label>
              <Input type="date" {...register('target_end_date')} />
              {errors.target_end_date && (
                <p className="text-[11px] text-red-600">
                  {errors.target_end_date.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">
              Initial Scope Summary *
            </label>
            <textarea
              rows={3}
              placeholder="Describe the core project objectives, technical stack, and success criteria..."
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15"
              {...register('scope_summary')}
            />
            {errors.scope_summary && (
              <p className="text-[11px] text-red-600">
                {errors.scope_summary.message}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Initial Deliverables (one per line)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15"
                {...register('deliverables_text')}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">
                Out-of-Scope Boundaries
              </label>
              <textarea
                rows={3}
                placeholder="Explicitly list what is excluded from this SOW..."
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15"
                {...register('out_of_scope_notes')}
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600">
            Initializing this project will automatically provision the 5 Asset
            Repository folders, an empty AES-256 Credential Vault, and the
            5-column Execution Kanban Board.
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Create Project Workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
