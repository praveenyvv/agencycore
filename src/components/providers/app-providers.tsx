'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type {
  ActivityActionType,
  ActivityLog,
  AssetFolderCategory,
  DeliverableItem,
  MeetingOutcome,
  Project,
  ProjectAsset,
  ProjectContact,
  ProjectCredential,
  ProjectDocument,
  ProjectMeeting,
  ProjectProposal,
  ProjectRequirement,
  ProjectType,
  ProposalOutcome,
  ProposalPricingItem,
  RolePermissions,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from '@/types/agency';
import {
  DEMO_PROJECT_MEMBERSHIPS,
  DEMO_USERS,
  INITIAL_SHELL_PROJECTS,
} from '@/lib/auth-personas';
import {
  INITIAL_ACTIVITY_LOGS,
  INITIAL_ASSETS,
  INITIAL_CONTACTS,
  INITIAL_CREDENTIALS,
  INITIAL_DOCUMENTS,
  INITIAL_MEETINGS,
  INITIAL_PROPOSALS,
  INITIAL_REQUIREMENTS,
  INITIAL_TASKS,
} from '@/lib/initial-data';
import { getPermissions, getTaskDelayInfo } from '@/lib/rbac';

export interface CreateProjectInput {
  title: string;
  client_name: string;
  project_type: ProjectType;
  start_date: string;
  target_end_date: string;
  scope_summary: string;
  out_of_scope_notes?: string;
  deliverables?: string[];
  initial_stage?: 'Lead/Discovery' | 'Meeting Scheduled' | 'Intake' | 'In Execution';
}

export interface CreateContactInput {
  project_id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  notes?: string;
  is_primary?: boolean;
  can_access_portal?: boolean;
}

export interface CreateMeetingInput {
  project_id: string;
  title: string;
  scheduled_at: string;
  pain_points?: string;
  solution_notes?: string;
  expectations_goals?: string;
  general_notes?: string;
}

export interface RecordMeetingOutcomeInput {
  meeting_id: string;
  outcome: MeetingOutcome;
  outcome_at?: string;
  outcome_note?: string;
  reschedule_date?: string;
  remainder_date?: string;
}

export interface CreateProposalInput {
  project_id: string;
  title: string;
  solution_overview: string;
  workflow_team_schedule: string;
  expected_deliverables_results: string;
  long_term_support_services: string;
  pricing_items: Array<{
    description: string;
    category: ProposalPricingItem['category'];
    cost: number;
    billing_cycle?: 'one-time' | 'monthly' | 'yearly';
  }>;
  next_review_meeting_at?: string;
}

export interface RecordProposalOutcomeInput {
  proposal_id: string;
  outcome: ProposalOutcome;
  outcome_at?: string;
  outcome_note?: string;
  reschedule_date?: string;
  remainder_date?: string;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description: string;
  assignee_id?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  start_date?: string | null;
  due_date: string;
  blocked_by_task_id?: string | null;
  linked_deliverable?: string | null;
}

export interface AddCredentialInput {
  project_id: string;
  service_name: string;
  login_url?: string;
  username: string;
  plaintext_secret: string;
  notes?: string;
}

export interface UploadDocumentInput {
  project_id: string;
  title: string;
  doc_type: ProjectDocument['doc_type'];
  file_name: string;
  file_url: string;
  file_size?: number;
  is_mandatory: boolean;
}

interface AuthContextValue {
  currentUser: User;
  users: User[];
  permissions: RolePermissions;
  accessibleProjects: Project[];
  accessibleTasks: Task[];
  contacts: ProjectContact[];
  meetings: ProjectMeeting[];
  proposals: ProjectProposal[];
  documents: ProjectDocument[];
  requirements: ProjectRequirement[];
  assets: ProjectAsset[];
  credentials: ProjectCredential[];
  activityLogs: ActivityLog[];
  todayDate: Date | null;
  switchPersona: (userId: string) => void;
  signInWithEmail: (email: string) => boolean;
  isAuthenticated: boolean;
  signOut: () => void;
  // Core Pre-Sales & Lifecycle Mutations
  createProject: (input: CreateProjectInput) => Project;
  addContact: (input: CreateContactInput) => ProjectContact;
  updateContact: (contactId: string, updates: Partial<ProjectContact>) => void;
  deleteContact: (contactId: string) => void;
  createMeeting: (input: CreateMeetingInput) => ProjectMeeting;
  updateMeeting: (meetingId: string, updates: Partial<ProjectMeeting>) => void;
  deleteMeeting: (meetingId: string) => void;
  recordMeetingOutcome: (input: RecordMeetingOutcomeInput) => void;
  createProposal: (input: CreateProposalInput) => ProjectProposal;
  updateProposal: (proposalId: string, updates: Partial<ProjectProposal>) => void;
  deleteProposal: (proposalId: string) => void;
  recordProposalOutcome: (input: RecordProposalOutcomeInput) => void;
  reopenDraftProject: (projectId: string, targetStage: 'Meeting Scheduled' | 'Proposal Review' | 'Intake' | 'In Execution', note?: string) => void;
  uploadDocument: (input: UploadDocumentInput) => ProjectDocument;
  toggleDocumentSignOff: (docId: string) => void;
  // Existing Step 4 Mutations
  updateRequirements: (
    projectId: string,
    updates: {
      scope_summary: string;
      out_of_scope_notes: string;
      deliverables_json: DeliverableItem[];
    },
    changeReason: string
  ) => void;
  uploadAsset: (input: {
    project_id: string;
    folder_category: AssetFolderCategory;
    file_name: string;
    file_size: number;
    version_tag: string;
    file_url?: string;
  }) => void;
  toggleAssetApproval: (projectId: string, assetId: string) => void;
  addCredential: (input: AddCredentialInput) => Promise<void>;
  revealCredential: (projectId: string, credentialId: string) => Promise<string>;
  createTask: (input: CreateTaskInput) => void;
  updateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => void;
  updateTaskDeliverable: (
    projectId: string,
    taskId: string,
    deliverableUrl: string
  ) => void;
  toggleProjectArchive: (projectId: string) => void;
  submitClientSignOff: (projectId: string, deliverableId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const emptySubscribe = () => () => {};
let cachedClientDate: Date | null = null;
function getClientTodaySnapshot(): Date {
  if (!cachedClientDate) {
    cachedClientDate = new Date();
  }
  return cachedClientDate;
}
function getServerTodaySnapshot(): Date | null {
  return null;
}

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [currentUserId, setCurrentUserId] = useState<string>(DEMO_USERS[0].id);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const todayDate = useSyncExternalStore(
    emptySubscribe,
    getClientTodaySnapshot,
    getServerTodaySnapshot
  );

  const [projects, setProjects] = useState<Project[]>(INITIAL_SHELL_PROJECTS);
  const [memberships, setMemberships] = useState<Record<string, string[]>>(
    DEMO_PROJECT_MEMBERSHIPS
  );
  const [contacts, setContacts] = useState<ProjectContact[]>(INITIAL_CONTACTS);
  const [meetings, setMeetings] = useState<ProjectMeeting[]>(INITIAL_MEETINGS);
  const [proposals, setProposals] = useState<ProjectProposal[]>(INITIAL_PROPOSALS);
  const [documents, setDocuments] = useState<ProjectDocument[]>(INITIAL_DOCUMENTS);
  const [requirements, setRequirements] = useState<ProjectRequirement[]>(INITIAL_REQUIREMENTS);
  const [assets, setAssets] = useState<ProjectAsset[]>(INITIAL_ASSETS);
  const [credentials, setCredentials] = useState<ProjectCredential[]>(INITIAL_CREDENTIALS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  const currentUser = useMemo(
    () => DEMO_USERS.find((u) => u.id === currentUserId) ?? DEMO_USERS[0],
    [currentUserId]
  );

  const permissions = useMemo(
    () => getPermissions(currentUser.role),
    [currentUser.role]
  );

  const appendLog = useCallback(
    (
      projectId: string,
      actionType: ActivityActionType,
      entityType: ActivityLog['entity_type'],
      entityId: string | null,
      changeSummary: string,
      metadata: Record<string, unknown> = {}
    ) => {
      const entry: ActivityLog = {
        id: makeId('log'),
        project_id: projectId,
        user_id: currentUser.id,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        change_summary: changeSummary,
        metadata_json: metadata,
        created_at: new Date().toISOString(),
      };
      setActivityLogs((prev) => [entry, ...prev]);
    },
    [currentUser.id]
  );

  const accessibleProjects = useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'pm') {
      return projects;
    }
    const allowedIds = memberships[currentUser.id] ?? [];
    return projects.filter((p) => allowedIds.includes(p.id));
  }, [currentUser, projects, memberships]);

  const accessibleTasks = useMemo(() => {
    const projectIds = new Set(accessibleProjects.map((p) => p.id));
    return tasks.filter((t) => {
      if (!projectIds.has(t.project_id)) return false;
      if (currentUser.role === 'client') {
        return t.status === 'Done';
      }
      return true;
    });
  }, [accessibleProjects, tasks, currentUser.role]);

  const switchPersona = (userId: string) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUserId(found.id);
      setIsAuthenticated(true);
    }
  };

  const signInWithEmail = (email: string) => {
    const found = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (found) {
      setCurrentUserId(found.id);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const signOut = () => setIsAuthenticated(false);

  // 1. Create Project (Supports Discovery / Meetings / Draft intake)
  const createProject = useCallback(
    (input: CreateProjectInput): Project => {
      if (!permissions.canCreateProject) {
        throw new Error('RBAC: Only Admin or PM can create projects.');
      }
      const now = new Date().toISOString();
      const projectId = makeId('proj');
      const stage = input.initial_stage || 'Intake';

      const newProject: Project = {
        id: projectId,
        title: input.title.trim(),
        client_name: input.client_name.trim(),
        project_type: input.project_type,
        status: stage,
        start_date: input.start_date,
        target_end_date: input.target_end_date,
        actual_end_date: null,
        is_archived: false,
        created_by: currentUser.id,
        created_at: now,
        updated_at: now,
      };

      const deliverables: DeliverableItem[] = (input.deliverables ?? [])
        .map((d) => d.trim())
        .filter(Boolean)
        .map((title) => ({
          id: makeId('del'),
          title,
          completed: false,
          client_signed_off: false,
        }));

      const newReq: ProjectRequirement = {
        id: makeId('req'),
        project_id: projectId,
        scope_summary: input.scope_summary.trim(),
        deliverables_json: deliverables,
        out_of_scope_notes: input.out_of_scope_notes?.trim() ?? '',
        updated_by: currentUser.id,
        updated_at: now,
      };

      setProjects((prev) => [newProject, ...prev]);
      setRequirements((prev) => [newReq, ...prev]);
      setMemberships((prev) => ({
        ...prev,
        [currentUser.id]: [...(prev[currentUser.id] ?? []), projectId],
      }));

      appendLog(
        projectId,
        'PROJECT_CREATED',
        'project',
        projectId,
        `Created project "${newProject.title}" for ${newProject.client_name} (${newProject.project_type}) in stage ${stage}`,
        {
          status: stage,
          target_end_date: newProject.target_end_date,
          deliverables_count: deliverables.length,
        }
      );

      return newProject;
    },
    [permissions.canCreateProject, currentUser.id, appendLog]
  );

  // 2. Contacts Management (Multiple contacts per project)
  const addContact = useCallback(
    (input: CreateContactInput): ProjectContact => {
      const contactId = makeId('cnt');
      const newContact: ProjectContact = {
        id: contactId,
        project_id: input.project_id,
        name: input.name.trim(),
        role: input.role.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || null,
        notes: input.notes?.trim() || null,
        is_primary: Boolean(input.is_primary),
        can_access_portal: Boolean(input.can_access_portal ?? true),
        created_at: new Date().toISOString(),
      };

      setContacts((prev) => [newContact, ...prev]);
      appendLog(
        input.project_id,
        'CONTACT_ADDED',
        'contact',
        contactId,
        `Added contact ${newContact.name} (${newContact.role})`,
        { email: newContact.email, role: newContact.role }
      );
      return newContact;
    },
    [appendLog]
  );

  const updateContact = useCallback(
    (contactId: string, updates: Partial<ProjectContact>) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const deleteContact = useCallback((contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  }, []);

  // 3. Meetings & Structured Pre-Sales Outcomes
  const createMeeting = useCallback(
    (input: CreateMeetingInput): ProjectMeeting => {
      const meetingId = makeId('meet');
      const now = new Date().toISOString();
      const newMeeting: ProjectMeeting = {
        id: meetingId,
        project_id: input.project_id,
        title: input.title.trim(),
        scheduled_at: input.scheduled_at,
        pain_points: input.pain_points?.trim() || '',
        solution_notes: input.solution_notes?.trim() || '',
        expectations_goals: input.expectations_goals?.trim() || '',
        general_notes: input.general_notes?.trim() || '',
        outcome: 'scheduled',
        created_by: currentUser.id,
        created_at: now,
      };

      setMeetings((prev) => [newMeeting, ...prev]);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === input.project_id && p.status === 'Lead/Discovery'
            ? { ...p, status: 'Meeting Scheduled', updated_at: now }
            : p
        )
      );

      appendLog(
        input.project_id,
        'MEETING_SCHEDULED',
        'meeting',
        meetingId,
        `Scheduled meeting "${newMeeting.title}" for ${newMeeting.scheduled_at}`,
        { scheduled_at: newMeeting.scheduled_at }
      );

      return newMeeting;
    },
    [currentUser.id, appendLog]
  );

  const updateMeeting = useCallback(
    (meetingId: string, updates: Partial<ProjectMeeting>) => {
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, ...updates } : m))
      );
    },
    []
  );

  const deleteMeeting = useCallback(
    (meetingId: string) => {
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    },
    []
  );

  const recordMeetingOutcome = useCallback(
    (input: RecordMeetingOutcomeInput) => {
      const existing = meetings.find((m) => m.id === input.meeting_id);
      if (!existing) return;

      const now = new Date().toISOString();
      const outcomeAt = input.outcome_at || now;

      setMeetings((prev) =>
        prev.map((m) =>
          m.id === input.meeting_id
            ? {
                ...m,
                outcome: input.outcome,
                outcome_at: outcomeAt,
                outcome_note: input.outcome_note || '',
                next_action_at: input.reschedule_date || input.remainder_date,
              }
            : m
        )
      );

      // Transition project status according to outcome specification:
      // Approved -> advances to 'Proposal Review' / creates proposal step
      // Denied -> moves to 'Draft / On Hold' with note
      // Rescheduled -> remains 'Meeting Scheduled' with updated next action
      // Remainder -> moves to 'Draft / On Hold' with remainder reminder date
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== existing.project_id) return p;

          if (input.outcome === 'approved') {
            return {
              ...p,
              status: 'Proposal Review',
              draft_reason: null,
              updated_at: now,
            };
          } else if (input.outcome === 'denied') {
            return {
              ...p,
              status: 'Draft / On Hold',
              draft_reason: input.outcome_note || 'Meeting outcome: Denied by client.',
              draft_source_stage: 'meeting',
              updated_at: now,
            };
          } else if (input.outcome === 'remainder') {
            return {
              ...p,
              status: 'Draft / On Hold',
              draft_reason: input.outcome_note || 'Awaiting response. Remainder scheduled.',
              draft_source_stage: 'meeting',
              remainder_next_date: input.remainder_date || null,
              updated_at: now,
            };
          } else if (input.outcome === 'rescheduled') {
            return {
              ...p,
              status: 'Meeting Scheduled',
              updated_at: now,
            };
          }
          return p;
        })
      );

      appendLog(
        existing.project_id,
        'MEETING_OUTCOME_RECORDED',
        'meeting',
        input.meeting_id,
        `Recorded meeting outcome: ${input.outcome.toUpperCase()}${
          input.outcome_note ? ` — "${input.outcome_note}"` : ''
        }`,
        {
          outcome: input.outcome,
          outcome_at: outcomeAt,
          note: input.outcome_note,
          reschedule_date: input.reschedule_date,
          remainder_date: input.remainder_date,
        }
      );
    },
    [meetings, appendLog]
  );

  // 4. Proposals (Template, Pricing Table, Outcome Actions)
  const createProposal = useCallback(
    (input: CreateProposalInput): ProjectProposal => {
      const proposalId = makeId('prop');
      const now = new Date().toISOString();

      let oneTime = 0;
      let recurring = 0;
      const pricingItems: ProposalPricingItem[] = input.pricing_items.map((pi) => {
        const costNum = Number(pi.cost) || 0;
        if (pi.billing_cycle === 'monthly' || pi.billing_cycle === 'yearly') {
          recurring += costNum;
        } else {
          oneTime += costNum;
        }
        return {
          id: makeId('pi'),
          description: pi.description,
          category: pi.category,
          cost: costNum,
          is_recurring: pi.billing_cycle === 'monthly' || pi.billing_cycle === 'yearly',
          billing_cycle: pi.billing_cycle || 'one-time',
        };
      });

      const newProposal: ProjectProposal = {
        id: proposalId,
        project_id: input.project_id,
        title: input.title.trim(),
        solution_overview: input.solution_overview.trim(),
        workflow_team_schedule: input.workflow_team_schedule.trim(),
        expected_deliverables_results: input.expected_deliverables_results.trim(),
        long_term_support_services: input.long_term_support_services.trim(),
        pricing_items: pricingItems,
        currency: 'USD',
        total_one_time_cost: oneTime,
        total_recurring_cost: recurring,
        status: 'draft',
        next_review_meeting_at: input.next_review_meeting_at || undefined,
        created_by: currentUser.id,
        created_at: now,
        updated_at: now,
      };

      setProposals((prev) => [newProposal, ...prev]);

      // Auto-register proposal into the Documents repository as mandatory
      const safeTitle = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const docId = makeId('doc');
      const autoDoc: ProjectDocument = {
        id: docId,
        project_id: input.project_id,
        title: input.title,
        doc_type: 'Proposal',
        file_name: `proposal_${safeTitle}.pdf`,
        file_url: `#generated-proposal-${proposalId}`,
        file_size: 1024 * 350,
        is_mandatory: true,
        is_signed_off: false,
        uploaded_by: currentUser.id,
        created_at: now,
      };
      setDocuments((prev) => [autoDoc, ...prev]);

      appendLog(
        input.project_id,
        'PROPOSAL_GENERATED',
        'proposal',
        proposalId,
        `Created Proposal "${newProposal.title}" (Total: $${oneTime.toLocaleString()} + $${recurring.toLocaleString()}/mo)`,
        { total_one_time: oneTime, total_recurring: recurring }
      );

      return newProposal;
    },
    [currentUser.id, appendLog]
  );

  const updateProposal = useCallback(
    (proposalId: string, updates: Partial<ProjectProposal>) => {
      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? { ...p, ...updates, updated_at: new Date().toISOString() }
            : p
        )
      );
    },
    []
  );

  const deleteProposal = useCallback(
    (proposalId: string) => {
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
    },
    []
  );

  const recordProposalOutcome = useCallback(
    (input: RecordProposalOutcomeInput) => {
      const existing = proposals.find((p) => p.id === input.proposal_id);
      if (!existing) return;

      const now = new Date().toISOString();
      const outcomeAt = input.outcome_at || now;

      setProposals((prev) =>
        prev.map((p) =>
          p.id === input.proposal_id
            ? {
                ...p,
                status: input.outcome,
                outcome_at: outcomeAt,
                outcome_note: input.outcome_note || '',
                next_review_meeting_at: input.reschedule_date || p.next_review_meeting_at,
                updated_at: now,
              }
            : p
        )
      );

      // Proposal Outcome Routing:
      // Approved -> enters main execution section ('In Execution' or 'Intake')
      // Denied -> moves to 'Draft / On Hold' with reason note
      // Remainder -> moves to 'Draft / On Hold' with remainder follow-up date
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== existing.project_id) return p;

          if (input.outcome === 'approved') {
            return {
              ...p,
              status: 'In Execution',
              draft_reason: null,
              draft_source_stage: undefined,
              updated_at: now,
            };
          } else if (input.outcome === 'denied') {
            return {
              ...p,
              status: 'Draft / On Hold',
              draft_reason: input.outcome_note || 'Proposal declined by client.',
              draft_source_stage: 'proposal',
              updated_at: now,
            };
          } else if (input.outcome === 'remainder') {
            return {
              ...p,
              status: 'Draft / On Hold',
              draft_reason: input.outcome_note || 'Proposal pending client review. Remainder active.',
              draft_source_stage: 'proposal',
              remainder_next_date: input.remainder_date || null,
              updated_at: now,
            };
          }
          return p;
        })
      );

      appendLog(
        existing.project_id,
        'PROPOSAL_OUTCOME_RECORDED',
        'proposal',
        input.proposal_id,
        `Proposal outcome recorded: ${input.outcome.toUpperCase()}${
          input.outcome_note ? ` — "${input.outcome_note}"` : ''
        }`,
        {
          outcome: input.outcome,
          outcome_at: outcomeAt,
          note: input.outcome_note,
        }
      );
    },
    [proposals, appendLog]
  );

  // 5. Reopen Project from Drafts (Resume right where it was stopped)
  const reopenDraftProject = useCallback(
    (
      projectId: string,
      targetStage: 'Meeting Scheduled' | 'Proposal Review' | 'Intake' | 'In Execution',
      note?: string
    ) => {
      const now = new Date().toISOString();
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                status: targetStage,
                draft_reason: null,
                draft_source_stage: undefined,
                remainder_next_date: null,
                updated_at: now,
              }
            : p
        )
      );

      appendLog(
        projectId,
        'PROJECT_REOPENED_FROM_DRAFT',
        'project',
        projectId,
        `Reopened project from Drafts into stage "${targetStage}"${
          note ? ` (${note})` : ''
        }`,
        { target_stage: targetStage, note }
      );
    },
    [appendLog]
  );

  // 6. Documents Management (Mandatory proposals, contracts, SOWs, NDAs)
  const uploadDocument = useCallback(
    (input: UploadDocumentInput): ProjectDocument => {
      const docId = makeId('doc');
      const newDoc: ProjectDocument = {
        id: docId,
        project_id: input.project_id,
        title: input.title.trim(),
        doc_type: input.doc_type,
        file_name: input.file_name.trim(),
        file_url: input.file_url,
        file_size: input.file_size || 512_000,
        is_mandatory: input.is_mandatory,
        is_signed_off: false,
        uploaded_by: currentUser.id,
        created_at: new Date().toISOString(),
      };

      setDocuments((prev) => [newDoc, ...prev]);
      appendLog(
        input.project_id,
        'DOCUMENT_UPLOADED',
        'document',
        docId,
        `Uploaded ${input.doc_type} document: "${newDoc.title}"`,
        { doc_type: input.doc_type, mandatory: input.is_mandatory }
      );
      return newDoc;
    },
    [currentUser.id, appendLog]
  );

  const toggleDocumentSignOff = useCallback(
    (docId: string) => {
      const target = documents.find((d) => d.id === docId);
      if (!target) return;
      const nextSign = !target.is_signed_off;

      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, is_signed_off: nextSign } : d))
      );

      appendLog(
        target.project_id,
        'CLIENT_SIGN_OFF',
        'document',
        docId,
        `${nextSign ? 'Signed off on' : 'Revoked sign-off on'} document "${target.title}"`,
        { signed_off: nextSign }
      );
    },
    [documents, appendLog]
  );

  // Existing Step 4 Mutations
  const updateRequirements = useCallback(
    (
      projectId: string,
      updates: {
        scope_summary: string;
        out_of_scope_notes: string;
        deliverables_json: DeliverableItem[];
      },
      changeReason: string
    ) => {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj || proj.is_archived || !permissions.canEditScope) return;

      const prevReq = requirements.find((r) => r.project_id === projectId);
      const now = new Date().toISOString();

      setRequirements((prev) =>
        prev.map((r) =>
          r.project_id === projectId
            ? {
                ...r,
                scope_summary: updates.scope_summary,
                out_of_scope_notes: updates.out_of_scope_notes,
                deliverables_json: updates.deliverables_json,
                updated_by: currentUser.id,
                updated_at: now,
              }
            : r
        )
      );

      appendLog(
        projectId,
        'SCOPE_UPDATED',
        'requirement',
        prevReq?.id ?? null,
        `Scope & requirements updated: ${changeReason}`,
        {
          reason: changeReason,
          before_deliverables: prevReq?.deliverables_json.length ?? 0,
          after_deliverables: updates.deliverables_json.length,
        }
      );
    },
    [projects, permissions.canEditScope, requirements, currentUser.id, appendLog]
  );

  const uploadAsset = useCallback(
    (input: {
      project_id: string;
      folder_category: AssetFolderCategory;
      file_name: string;
      file_size: number;
      version_tag: string;
      file_url?: string;
    }) => {
      const proj = projects.find((p) => p.id === input.project_id);
      if (!proj || proj.is_archived || !permissions.canUploadAssets) return;

      const assetId = makeId('ast');
      const newAsset: ProjectAsset = {
        id: assetId,
        project_id: input.project_id,
        folder_category: input.folder_category,
        file_name: input.file_name,
        file_url: input.file_url ?? `#asset-${assetId}`,
        file_size: input.file_size,
        version_tag: input.version_tag || 'v1.0',
        client_approved: false,
        uploaded_by: currentUser.id,
        created_at: new Date().toISOString(),
      };

      setAssets((prev) => [newAsset, ...prev]);
      appendLog(
        input.project_id,
        'ASSET_UPLOADED',
        'asset',
        assetId,
        `Uploaded "${newAsset.file_name}" (${newAsset.version_tag}) to ${newAsset.folder_category}`,
        {
          folder: newAsset.folder_category,
          version: newAsset.version_tag,
          file_size: newAsset.file_size,
        }
      );
    },
    [projects, permissions.canUploadAssets, currentUser.id, appendLog]
  );

  const toggleAssetApproval = useCallback(
    (projectId: string, assetId: string) => {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj || proj.is_archived || !permissions.canEditScope) return;

      const target = assets.find((a) => a.id === assetId);
      if (!target) return;
      const nextApproved = !target.client_approved;

      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId ? { ...a, client_approved: nextApproved } : a
        )
      );

      appendLog(
        projectId,
        'ASSET_APPROVED',
        'asset',
        assetId,
        `${nextApproved ? 'Approved' : 'Unapproved'} "${target.file_name}" for Client Portal visibility`,
        { client_approved: nextApproved }
      );
    },
    [projects, permissions.canEditScope, assets, appendLog]
  );

  const addCredential = useCallback(
    async (input: AddCredentialInput) => {
      const proj = projects.find((p) => p.id === input.project_id);
      if (!proj || proj.is_archived || !permissions.canManageCredentials) {
        throw new Error('RBAC: Cannot add credentials.');
      }

      const res = await fetch('/api/vault/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plaintext: input.plaintext_secret }),
      });
      if (!res.ok) {
        throw new Error('Encryption failed');
      }
      const { encrypted_secret, iv, auth_tag } = await res.json();

      const credId = makeId('cred');
      const newCred: ProjectCredential = {
        id: credId,
        project_id: input.project_id,
        service_name: input.service_name.trim(),
        login_url: input.login_url?.trim() || null,
        username: input.username.trim(),
        encrypted_secret,
        iv,
        auth_tag,
        notes: input.notes?.trim() || null,
        updated_by: currentUser.id,
        updated_at: new Date().toISOString(),
      };

      setCredentials((prev) => [newCred, ...prev]);
      appendLog(
        input.project_id,
        'CREDENTIAL_ADDED',
        'credential',
        credId,
        `Added AES-256 encrypted credential for "${newCred.service_name}"`,
        { service_name: newCred.service_name }
      );
    },
    [projects, permissions.canManageCredentials, currentUser.id, appendLog]
  );

  const revealCredential = useCallback(
    async (projectId: string, credentialId: string): Promise<string> => {
      if (!permissions.canRevealCredentials) {
        throw new Error('RBAC: Clients cannot reveal credentials.');
      }
      const cred = credentials.find(
        (c) => c.id === credentialId && c.project_id === projectId
      );
      if (!cred) throw new Error('Credential not found');

      const res = await fetch('/api/vault/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encrypted_secret: cred.encrypted_secret,
          iv: cred.iv,
          auth_tag: cred.auth_tag,
        }),
      });
      if (!res.ok) {
        throw new Error('Decryption failed');
      }
      const { plaintext } = await res.json();

      appendLog(
        projectId,
        'CREDENTIAL_REVEALED',
        'credential',
        credentialId,
        `${currentUser.name} viewed credential "${cred.service_name}"`,
        { service_name: cred.service_name, actor: currentUser.email }
      );

      return plaintext as string;
    },
    [permissions.canRevealCredentials, credentials, currentUser, appendLog]
  );

  const createTask = useCallback(
    (input: CreateTaskInput) => {
      const proj = projects.find((p) => p.id === input.project_id);
      if (!proj || proj.is_archived || !permissions.canManageTasks) return;

      const taskId = makeId('task');
      const now = new Date().toISOString();
      const delayInfo = getTaskDelayInfo(
        {
          due_date: input.due_date,
          status: input.status,
          completed_at: input.status === 'Done' ? now : null,
        },
        todayDate
      );

      const newTask: Task = {
        id: taskId,
        project_id: input.project_id,
        title: input.title.trim(),
        description: input.description.trim(),
        assignee_id: input.assignee_id || null,
        status: input.status,
        priority: input.priority,
        start_date: input.start_date || null,
        due_date: input.due_date,
        completed_at: input.status === 'Done' ? now : null,
        is_delayed: delayInfo.isDelayed,
        blocked_by_task_id: input.blocked_by_task_id || null,
        linked_deliverable: input.linked_deliverable || null,
        deliverable_url: null,
        created_at: now,
        updated_at: now,
      };

      setTasks((prev) => [newTask, ...prev]);
      appendLog(
        input.project_id,
        'TASK_CREATED',
        'task',
        taskId,
        `Created task "${newTask.title}" (Priority: ${newTask.priority}, Due: ${newTask.due_date})`,
        { status: newTask.status, priority: newTask.priority, due_date: newTask.due_date }
      );
    },
    [projects, permissions.canManageTasks, todayDate, appendLog]
  );

  const updateTaskStatus = useCallback(
    (projectId: string, taskId: string, status: TaskStatus) => {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj || proj.is_archived || !permissions.canUpdateTaskStatus) return;

      const existing = tasks.find((t) => t.id === taskId);
      if (!existing || existing.status === status) return;

      const now = new Date().toISOString();
      const completedAt = status === 'Done' ? now : null;
      const delayInfo = getTaskDelayInfo(
        { due_date: existing.due_date, status, completed_at: completedAt },
        todayDate
      );

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status,
                completed_at: completedAt,
                is_delayed: delayInfo.isDelayed,
                updated_at: now,
              }
            : t
        )
      );

      appendLog(
        projectId,
        'TASK_STATUS_CHANGED',
        'task',
        taskId,
        `Moved "${existing.title}" from ${existing.status} → ${status}`,
        { before: existing.status, after: status }
      );
    },
    [projects, permissions.canUpdateTaskStatus, tasks, todayDate, appendLog]
  );

  const updateTaskDeliverable = useCallback(
    (projectId: string, taskId: string, deliverableUrl: string) => {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj || proj.is_archived || !permissions.canUpdateTaskStatus) return;

      const existing = tasks.find((t) => t.id === taskId);
      if (!existing) return;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                deliverable_url: deliverableUrl.trim(),
                updated_at: new Date().toISOString(),
              }
            : t
        )
      );

      appendLog(
        projectId,
        'DELIVERABLE_SUBMITTED',
        'task',
        taskId,
        `Submitted deliverable link on "${existing.title}"`,
        { deliverable_url: deliverableUrl.trim() }
      );
    },
    [projects, permissions.canUpdateTaskStatus, tasks, appendLog]
  );

  const toggleProjectArchive = useCallback(
    (projectId: string) => {
      if (!permissions.canToggleArchive) return;
      const proj = projects.find((p) => p.id === projectId);
      if (!proj) return;

      const nextArchived = !proj.is_archived;
      const now = new Date().toISOString();

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                is_archived: nextArchived,
                status: nextArchived ? 'Completed/Archived' : 'In Execution',
                actual_end_date: nextArchived ? now.slice(0, 10) : null,
                updated_at: now,
              }
            : p
        )
      );

      appendLog(
        projectId,
        nextArchived ? 'PROJECT_ARCHIVED' : 'PROJECT_UNLOCKED',
        'project',
        projectId,
        nextArchived
          ? `Project locked into Immutable Read-Only Archive by ${currentUser.name}`
          : `Project unlocked from Archive by ${currentUser.name}`,
        { is_archived: nextArchived }
      );
    },
    [permissions.canToggleArchive, projects, currentUser.name, appendLog]
  );

  const submitClientSignOff = useCallback(
    (projectId: string, deliverableId: string) => {
      if (!permissions.canSubmitClientSignOff) return;
      const req = requirements.find((r) => r.project_id === projectId);
      const del = req?.deliverables_json.find((d) => d.id === deliverableId);
      if (!req || !del) return;

      setRequirements((prev) =>
        prev.map((r) =>
          r.project_id === projectId
            ? {
                ...r,
                deliverables_json: r.deliverables_json.map((d) =>
                  d.id === deliverableId ? { ...d, client_signed_off: true } : d
                ),
              }
            : r
        )
      );

      appendLog(
        projectId,
        'CLIENT_SIGN_OFF',
        'requirement',
        deliverableId,
        `Client ${currentUser.name} signed off on "${del.title}"`,
        { deliverable: del.title }
      );
    },
    [permissions.canSubmitClientSignOff, requirements, currentUser.name, appendLog]
  );

  const value: AuthContextValue = {
    currentUser,
    users: DEMO_USERS,
    permissions,
    accessibleProjects,
    accessibleTasks,
    contacts,
    meetings,
    proposals,
    documents,
    requirements,
    assets,
    credentials,
    activityLogs,
    todayDate,
    switchPersona,
    signInWithEmail,
    isAuthenticated,
    signOut,
    createProject,
    addContact,
    updateContact,
    deleteContact,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    recordMeetingOutcome,
    createProposal,
    updateProposal,
    deleteProposal,
    recordProposalOutcome,
    reopenDraftProject,
    uploadDocument,
    toggleDocumentSignOff,
    updateRequirements,
    uploadAsset,
    toggleAssetApproval,
    addCredential,
    revealCredential,
    createTask,
    updateTaskStatus,
    updateTaskDeliverable,
    toggleProjectArchive,
    submitClientSignOff,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AppProviders');
  }
  return ctx;
}
