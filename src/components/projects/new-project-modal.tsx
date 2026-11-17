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

const newProjectSchema = z.object({
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
  scope_summary: z
    .string()
    .min(5, 'Initial summary or pain points must be at least 5 characters'),
  out_of_scope_notes: z.string().optional(),
  deliverables_text: z.string().optional(),
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
      scope_summary: values.scope_summary,
      out_of_scope_notes: values.out_of_scope_notes,
      deliverables,
    });

    reset();
    onClose();
    router.push(`/projects/${created.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px] p-4 animate-fade-up">
      <div className="w-full max-w-[620px] rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-[#4361ee]" />
            <h2 className="text-[15px] font-bold text-[#111827]">
              New Project &amp; Requirements Intake
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] flex items-center justify-center cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4 max-h-[76vh] overflow-y-auto">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                  Project Title *
                </label>
                <Input
                  placeholder="e.g. NovaPay Mobile Wallet"
                  className="h-[36px] text-[13px]"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-[11px] text-[#ef4444] mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                  Client Name *
                </label>
                <Input
                  placeholder="e.g. NovaPay Inc."
                  className="h-[36px] text-[13px]"
                  {...register('client_name')}
                />
                {errors.client_name && (
                  <p className="text-[11px] text-[#ef4444] mt-1">
                    {errors.client_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                  Project Type *
                </label>
                <select
                  {...register('project_type')}
                  className="flex h-[36px] w-full rounded-[8px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#111827] focus:border-[#4361ee] focus:outline-none"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                  Initial Pipeline Stage *
                </label>
                <select
                  {...register('initial_stage')}
                  className="flex h-[36px] w-full rounded-[8px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#111827] focus:border-[#4361ee] focus:outline-none"
                >
                  <option value="Lead/Discovery">Lead / Initial Discovery</option>
                  <option value="Meeting Scheduled">Meeting Scheduled</option>
                  <option value="Intake">Intake (Confirmed Deal)</option>
                  <option value="In Execution">Directly In Execution</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                Initial Scope Summary *
              </label>
              <textarea
                rows={3}
                placeholder="Describe the core project objectives, technical stack, and success criteria..."
                className="w-full rounded-[8px] border border-[#e5e7eb] bg-white px-3 py-2 text-[13px] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#4361ee] focus:outline-none focus:ring-3 focus:ring-[rgba(67,97,238,0.1)]"
                {...register('scope_summary')}
              />
              {errors.scope_summary && (
                <p className="text-[11px] text-[#ef4444] mt-1">
                  {errors.scope_summary.message}
                </p>
              )}
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                  Initial Deliverables (one per line)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-[8px] border border-[#e5e7eb] bg-white px-3 py-2 text-[12.5px] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#4361ee] focus:outline-none"
                  {...register('deliverables_text')}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#6b7280] mb-1">
                  Out-of-Scope Boundaries
                </label>
                <textarea
                  rows={3}
                  placeholder="Explicitly list what is excluded from this SOW..."
                  className="w-full rounded-[8px] border border-[#e5e7eb] bg-white px-3 py-2 text-[12.5px] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#4361ee] focus:outline-none"
                  {...register('out_of_scope_notes')}
                />
              </div>
            </div>

            <div className="rounded-[8px] border border-[rgba(67,97,238,0.18)] bg-[#eef0fd] px-3.5 py-2.5 text-[11.5px] text-[#4361ee] font-medium">
              Initializing this project will automatically provision the 5 Asset Repository folders, Credential Vault, and the 5-column Kanban Board.
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-3.5 border-t border-[#e5e7eb] bg-[#fafafa] flex justify-end gap-2 sticky bottom-0">
            <Button type="button" variant="outline" onClick={onClose} className="h-[36px] px-4 text-[13px]">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-[36px] px-5 rounded-[8px] bg-[#4361ee] hover:bg-[#3451d1] text-white text-[13px]"
            >
              Create Project Workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
