export type UserRole = 'admin' | 'pm' | 'member' | 'client';

export type ProjectType =
  | 'Website'
  | 'Web App'
  | 'Mobile App'
  | 'Digital Marketing';

export type ProjectStatus =
  // Pre-sales lifecycle
  | 'Lead/Discovery'
  | 'Meeting Scheduled'
  | 'Proposal Drafted'
  | 'Proposal Review'
  | 'Draft / On Hold' // Denied, Remainder, Stalled
  // Active delivery lifecycle
  | 'Intake'
  | 'Scoping'
  | 'In Execution'
  | 'QA & Handover'
  | 'Completed/Archived'
  | 'Maintenance';

export type PipelineStageCategory =
  | 'presales' // Leads, Meetings, Proposals
  | 'active'   // Execution, QA, Intake, Scoping
  | 'drafts'   // Denied, Stalled, Remainder
  | 'archived';// Completed & Archived, Maintenance

export type AssetFolderCategory =
  | 'Brand Assets & Logos'
  | 'Raw Images & Media'
  | 'Content & Copy'
  | 'Design Files / Wireframes'
  | 'Contracts & Docs';

export type TaskStatus =
  | 'Backlog'
  | 'To Do'
  | 'In Progress'
  | 'Internal Review'
  | 'Done';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type MeetingOutcome =
  | 'scheduled'
  | 'approved'
  | 'denied'
  | 'rescheduled'
  | 'remainder';

export type ProposalOutcome =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'denied'
  | 'rescheduled'
  | 'remainder';

export type ActivityActionType =
  | 'PROJECT_CREATED'
  | 'PROJECT_STATUS_CHANGED'
  | 'PROJECT_ARCHIVED'
  | 'PROJECT_UNLOCKED'
  | 'PROJECT_REOPENED_FROM_DRAFT'
  | 'CONTACT_ADDED'
  | 'CONTACT_UPDATED'
  | 'MEETING_SCHEDULED'
  | 'MEETING_OUTCOME_RECORDED'
  | 'PROPOSAL_GENERATED'
  | 'PROPOSAL_OUTCOME_RECORDED'
  | 'SCOPE_UPDATED'
  | 'ASSET_UPLOADED'
  | 'ASSET_APPROVED'
  | 'CREDENTIAL_ADDED'
  | 'CREDENTIAL_REVEALED'
  | 'TASK_CREATED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DEADLINE_CHANGED'
  | 'DELIVERABLE_SUBMITTED'
  | 'CLIENT_SIGN_OFF'
  | 'DOCUMENT_UPLOADED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  title?: string | null;
  client_company?: string | null;
  created_at: string;
}

export interface ProjectContact {
  id: string;
  project_id?: string | null; // Optional if unlinked standalone business lead
  company_name?: string | null; // For standalone business contact
  name: string;
  role: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  is_primary?: boolean;
  can_access_portal?: boolean;
  created_at: string;
}

export interface ProjectMeeting {
  id: string;
  project_id: string;
  title: string;
  scheduled_at: string;
  is_general_session?: boolean; // General insights / check-in session (no traditional 4 outcome gates)
  pain_points?: string;
  solution_notes?: string;
  expectations_goals?: string;
  general_notes?: string;
  outcome: MeetingOutcome;
  outcome_at?: string;
  outcome_note?: string;
  decision_edited_by?: string;
  decision_edited_at?: string;
  next_action_at?: string;
  created_by: string;
  created_at: string;
}

export interface ProposalPricingItem {
  id: string;
  description: string;
  category: 'Development' | 'Subscription / Recurring' | 'Design' | 'Infrastructure' | 'Marketing' | 'Custom';
  cost: number;
  is_recurring?: boolean;
  billing_cycle?: 'one-time' | 'monthly' | 'yearly';
}

export interface ProjectProposal {
  id: string;
  project_id: string;
  title: string;
  solution_overview: string;
  workflow_team_schedule: string; // Weekly/monthly timeline & delivery expectations
  expected_deliverables_results: string;
  long_term_support_services: string;
  pricing_items: ProposalPricingItem[];
  currency: string;
  total_one_time_cost: number;
  total_recurring_cost: number;
  status: ProposalOutcome;
  outcome_at?: string;
  outcome_note?: string;
  next_review_meeting_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  title: string;
  doc_type: 'Proposal' | 'Contract' | 'SOW' | 'NDA' | 'Technical Spec' | 'Other';
  file_name: string;
  file_url: string;
  file_size?: number;
  is_mandatory: boolean;
  is_signed_off?: boolean;
  uploaded_by: string;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  client_name: string;
  project_type: ProjectType;
  status: ProjectStatus;
  start_date: string;
  target_end_date: string;
  actual_end_date?: string | null;
  is_archived: boolean;
  // Pre-sales draft state tracking
  draft_reason?: string | null;
  draft_source_stage?: 'meeting' | 'proposal' | 'manual';
  remainder_next_date?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  assigned_role: UserRole;
  created_at: string;
}

export interface DeliverableItem {
  id: string;
  title: string;
  completed: boolean;
  client_signed_off?: boolean;
}

export interface ProjectRequirement {
  id: string;
  project_id: string;
  scope_summary: string;
  deliverables_json: DeliverableItem[];
  out_of_scope_notes: string;
  updated_by?: string | null;
  updated_at: string;
}

export interface ProjectAsset {
  id: string;
  project_id: string;
  folder_category: AssetFolderCategory;
  file_name: string;
  file_url: string;
  file_size: number;
  version_tag: string;
  client_approved: boolean;
  uploaded_by: string;
  created_at: string;
}

export interface ProjectCredential {
  id: string;
  project_id: string;
  service_name: string;
  login_url?: string | null;
  username: string;
  encrypted_secret: string;
  iv: string;
  auth_tag: string;
  notes?: string | null;
  updated_by: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  assignee_id?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_date?: string | null;
  due_date: string;
  completed_at?: string | null;
  is_delayed: boolean;
  blocked_by_task_id?: string | null;
  linked_deliverable?: string | null;
  deliverable_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  action_type: ActivityActionType;
  entity_type: 'project' | 'requirement' | 'asset' | 'credential' | 'task' | 'meeting' | 'proposal' | 'contact' | 'document';
  entity_id?: string | null;
  change_summary: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface RolePermissions {
  canCreateProject: boolean;
  canEditScope: boolean;
  canManageTasks: boolean;
  canUpdateTaskStatus: boolean;
  canUploadAssets: boolean;
  canViewCredentials: boolean;
  canManageCredentials: boolean;
  canRevealCredentials: boolean;
  canViewInternalDelays: boolean;
  canViewAuditLogs: boolean;
  canToggleArchive: boolean;
  canManageUsers: boolean;
  canSubmitClientSignOff: boolean;
  canManageMeetingsAndProposals: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin / Founder',
  pm: 'Project Manager',
  member: 'Team Member',
  client: 'Client Portal',
};
