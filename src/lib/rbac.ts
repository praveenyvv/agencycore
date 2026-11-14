import type { Project, RolePermissions, Task, UserRole } from '@/types/agency';

const PERMISSION_MATRIX: Record<UserRole, RolePermissions> = {
  admin: {
    canCreateProject: true,
    canEditScope: true,
    canManageTasks: true,
    canUpdateTaskStatus: true,
    canUploadAssets: true,
    canViewCredentials: true,
    canManageCredentials: true,
    canRevealCredentials: true,
    canViewInternalDelays: true,
    canViewAuditLogs: true,
    canToggleArchive: true,
    canManageUsers: true,
    canSubmitClientSignOff: false,
    canManageMeetingsAndProposals: true,
  },
  pm: {
    canCreateProject: true,
    canEditScope: true,
    canManageTasks: true,
    canUpdateTaskStatus: true,
    canUploadAssets: true,
    canViewCredentials: true,
    canManageCredentials: true,
    canRevealCredentials: true,
    canViewInternalDelays: true,
    canViewAuditLogs: true,
    canToggleArchive: false,
    canManageUsers: false,
    canSubmitClientSignOff: false,
    canManageMeetingsAndProposals: true,
  },
  member: {
    canCreateProject: false,
    canEditScope: false,
    canManageTasks: false,
    canUpdateTaskStatus: true,
    canUploadAssets: true,
    canViewCredentials: true,
    canManageCredentials: false,
    canRevealCredentials: true,
    canViewInternalDelays: true,
    canViewAuditLogs: true,
    canToggleArchive: false,
    canManageUsers: false,
    canSubmitClientSignOff: false,
    canManageMeetingsAndProposals: false,
  },
  client: {
    canCreateProject: false,
    canEditScope: false,
    canManageTasks: false,
    canUpdateTaskStatus: false,
    canUploadAssets: false,
    canViewCredentials: false,
    canManageCredentials: false,
    canRevealCredentials: false,
    canViewInternalDelays: false,
    canViewAuditLogs: false,
    canToggleArchive: false,
    canManageUsers: false,
    canSubmitClientSignOff: true,
    canManageMeetingsAndProposals: false,
  },
};

export function getPermissions(role: UserRole): RolePermissions {
  return PERMISSION_MATRIX[role];
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith('/team')) {
    return role === 'admin' || role === 'pm';
  }
  if (pathname.startsWith('/audit')) {
    return role !== 'client';
  }
  return true;
}

export function canMutateProject(role: UserRole, project?: Project): boolean {
  if (!project) return false;
  if (project.is_archived) return false;
  return role === 'admin' || role === 'pm';
}

export interface TaskDelayInfo {
  isDelayed: boolean;
  daysOverdue: number;
  isDueToday: boolean;
}

/**
 * Automated Delay Detection:
 * If Current Date > Hard Deadline and status !== 'Done', flag as DELAYED
 * and calculate days overdue.
 */
export function getTaskDelayInfo(
  task: Pick<Task, 'due_date' | 'status' | 'completed_at'>,
  referenceDate: Date | null
): TaskDelayInfo {
  if (!referenceDate) {
    return { isDelayed: false, daysOverdue: 0, isDueToday: false };
  }
  const todayStr = referenceDate.toISOString().slice(0, 10);
  const dueStr = task.due_date.slice(0, 10);

  if (task.status === 'Done') {
    if (task.completed_at) {
      const completedStr = task.completed_at.slice(0, 10);
      const diff = diffDays(dueStr, completedStr);
      return {
        isDelayed: diff > 0,
        daysOverdue: Math.max(0, diff),
        isDueToday: false,
      };
    }
    return { isDelayed: false, daysOverdue: 0, isDueToday: false };
  }

  const daysOverdue = diffDays(dueStr, todayStr);
  return {
    isDelayed: daysOverdue > 0,
    daysOverdue: Math.max(0, daysOverdue),
    isDueToday: daysOverdue === 0,
  };
}

function diffDays(fromYmd: string, toYmd: string): number {
  const from = new Date(`${fromYmd}T00:00:00Z`).getTime();
  const to = new Date(`${toYmd}T00:00:00Z`).getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}
