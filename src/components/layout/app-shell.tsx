'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Archive,
  Bell,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Command,
  FolderKanban,
  Globe,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/app-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTaskDelayInfo } from '@/lib/rbac';
import { cn, formatDate } from '@/lib/utils';
import { ROLE_LABELS, type ProjectType, type UserRole } from '@/types/agency';

const PROJECT_TYPE_ICONS: Record<ProjectType, React.ReactNode> = {
  Website: <Globe className="h-3.5 w-3.5 text-blue-600" />,
  'Web App': <Layers className="h-3.5 w-3.5 text-violet-600" />,
  'Mobile App': <Smartphone className="h-3.5 w-3.5 text-emerald-600" />,
  'Digital Marketing': <Megaphone className="h-3.5 w-3.5 text-amber-600" />,
};

const ROLE_BADGE_VARIANT: Record<
  UserRole,
  'default' | 'info' | 'success' | 'purple'
> = {
  admin: 'default',
  pm: 'info',
  member: 'success',
  client: 'purple',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    users,
    permissions,
    accessibleProjects,
    accessibleTasks,
    todayDate,
    switchPersona,
    isAuthenticated,
    signOut,
  } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect to /login if signed out (unless already on /login)
  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSwitcherOpen(false);
        setNotificationsOpen(false);
        setPersonaMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const delayedTasks = useMemo(() => {
    if (!permissions.canViewInternalDelays) return [];
    return accessibleTasks
      .map((task) => ({
        task,
        delay: getTaskDelayInfo(task, todayDate),
        project: accessibleProjects.find((p) => p.id === task.project_id),
      }))
      .filter((item) => item.delay.isDelayed);
  }, [accessibleTasks, accessibleProjects, permissions.canViewInternalDelays, todayDate]);

  const activeProjectId = pathname.startsWith('/projects/')
    ? pathname.split('/')[2]
    : null;
  const activeProject = accessibleProjects.find((p) => p.id === activeProjectId);

  const navItems = useMemo(() => {
    const items = [
      {
        label:
          currentUser.role === 'client' ? 'Client Portal' : 'Command Center',
        href: '/',
        icon: LayoutDashboard,
        visible: true,
      },
      {
        label: 'Drafts & Deals',
        href: '/drafts',
        icon: Archive,
        visible: currentUser.role !== 'client',
      },
      {
        label: 'My Tasks',
        href: '/tasks',
        icon: CheckSquare,
        visible: currentUser.role !== 'client',
      },
      {
        label: 'Team & Roles',
        href: '/team',
        icon: Users,
        visible: permissions.canManageUsers || currentUser.role === 'pm',
      },
      {
        label: 'Audit & Archive',
        href: '/audit',
        icon: ShieldCheck,
        visible: permissions.canViewAuditLogs,
      },
    ];
    return items.filter((i) => i.visible);
  }, [currentUser.role, permissions.canManageUsers, permissions.canViewAuditLogs]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchedProjects = accessibleProjects.filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.client_name.toLowerCase().includes(q) ||
        p.project_type.toLowerCase().includes(q)
    );
    const matchedTasks = accessibleTasks.filter(
      (t) =>
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
    );
    return { matchedProjects, matchedTasks };
  }, [searchQuery, accessibleProjects, accessibleTasks]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-200 select-none">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800/80 px-3">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-zinc-950 font-bold text-xs tracking-tight">
            AC
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight text-white">
                AgencyCore
              </span>
              <span className="text-[10px] text-zinc-400">
                Lifecycle OS v1.0
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Quick Project Switcher */}
      {!collapsed && (
        <div className="relative px-3 pt-3 pb-2">
          <button
            onClick={() => setSwitcherOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/90 px-2.5 py-2 text-left text-xs hover:border-zinc-700 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span className="truncate font-medium text-zinc-100">
                {activeProject ? activeProject.title : 'Switch Project...'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          </button>

          {switcherOpen && (
            <div className="absolute left-3 right-3 top-14 z-50 rounded-md border border-zinc-800 bg-zinc-900 p-1 shadow-xl">
              <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Accessible Projects ({accessibleProjects.length})
              </div>
              {accessibleProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSwitcherOpen(false);
                    setMobileOpen(false);
                    router.push(`/projects/${project.id}`);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors cursor-pointer',
                    activeProjectId === project.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {PROJECT_TYPE_ICONS[project.project_type]}
                    <span className="truncate">{project.title}</span>
                  </div>
                  {project.is_archived && (
                    <Lock className="h-3 w-3 shrink-0 text-zinc-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {!collapsed && (
          <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Workspace
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Active Projects List */}
        {!collapsed && (
          <div className="pt-5">
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Projects
              </span>
              <span className="text-[10px] text-zinc-600">
                {accessibleProjects.length}
              </span>
            </div>
            <div className="space-y-0.5">
              {accessibleProjects.map((project) => {
                const isSelected = activeProjectId === project.id;
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors',
                      isSelected
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 shrink-0 rounded-full',
                          project.status === 'In Execution' && 'bg-blue-400',
                          project.status === 'QA & Handover' && 'bg-amber-400',
                          project.status === 'Maintenance' && 'bg-emerald-400',
                          project.status === 'Completed/Archived' &&
                            'bg-zinc-500',
                          (project.status === 'Intake' ||
                            project.status === 'Scoping') &&
                            'bg-violet-400'
                        )}
                      />
                      <span className="truncate">{project.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User & RBAC Role Switcher Footer */}
      <div className="relative border-t border-zinc-800/80 p-2.5">
        <button
          onClick={() => setPersonaMenuOpen((o) => !o)}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md p-1.5 text-left hover:bg-zinc-900 transition-colors cursor-pointer',
            collapsed && 'justify-center'
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-100 border border-zinc-700">
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-zinc-100">
                {currentUser.name}
              </div>
              <div className="truncate text-[10px] text-zinc-400">
                {ROLE_LABELS[currentUser.role]}
              </div>
            </div>
          )}
        </button>

        {personaMenuOpen && (
          <div className="absolute bottom-14 left-2 right-2 z-50 rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl">
            <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Switch RBAC Role (Demo)
            </div>
            <div className="space-y-0.5 mt-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchPersona(u.id);
                    setPersonaMenuOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors cursor-pointer',
                    u.id === currentUser.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-300 hover:bg-zinc-800/60'
                  )}
                >
                  <div className="truncate">
                    <div className="font-medium truncate">{u.name}</div>
                    <div className="text-[10px] text-zinc-400">
                      {ROLE_LABELS[u.role]}
                    </div>
                  </div>
                  {u.id === currentUser.id && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              ))}
            </div>
            <div className="my-1 border-t border-zinc-800" />
            <button
              onClick={() => {
                setPersonaMenuOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-400 hover:bg-zinc-800 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 text-zinc-950">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden lg:block shrink-0 border-r border-zinc-200 transition-all duration-200',
          collapsed ? 'w-14' : 'w-60'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-64 h-full">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-zinc-900 truncate">
                {activeProject ? activeProject.title : 'Command Center'}
              </span>
              <Badge variant={ROLE_BADGE_VARIANT[currentUser.role]}>
                {ROLE_LABELS[currentUser.role]}
              </Badge>
              {activeProject?.is_archived && (
                <Badge variant="secondary">
                  <Lock className="h-3 w-3" /> Read-Only Archive
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cmd+K Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-500 hover:border-zinc-300 hover:bg-white hover:text-zinc-800 transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search projects, tasks...</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>

            {/* Overdue Notification Bell (Internal Staff Only) */}
            {permissions.canViewInternalDelays && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen((o) => !o)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
                  aria-label="Overdue task alerts"
                >
                  <Bell className="h-4 w-4" />
                  {delayedTasks.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                      {delayedTasks.length}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border border-zinc-200 bg-white p-2 shadow-xl">
                    <div className="flex items-center justify-between border-b border-zinc-100 px-2 py-1.5">
                      <span className="text-xs font-semibold text-zinc-900">
                        Overdue Task Alerts
                      </span>
                      <Badge variant={delayedTasks.length > 0 ? 'danger' : 'success'}>
                        {delayedTasks.length} Delayed
                      </Badge>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {delayedTasks.length === 0 ? (
                        <p className="px-2 py-4 text-center text-xs text-zinc-500">
                          All tasks are on schedule.
                        </p>
                      ) : (
                        delayedTasks.map(({ task, delay, project }) => (
                          <button
                            key={task.id}
                            onClick={() => {
                              setNotificationsOpen(false);
                              router.push(`/projects/${task.project_id}`);
                            }}
                            className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-red-50/60 transition-colors cursor-pointer"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium text-zinc-900">
                                {task.title}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                {project?.title} ·{' '}
                                <span className="font-medium text-red-600">
                                  {delay.daysOverdue}d overdue
                                </span>{' '}
                                (Due {formatDate(task.due_date)})
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RBAC-gated New Project CTA */}
            {permissions.canCreateProject && (
              <Button
                size="sm"
                onClick={() => router.push('/?newProject=1')}
                className="hidden sm:inline-flex"
              >
                <Plus className="h-3.5 w-3.5" />
                New Project
              </Button>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Cmd+K Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20 px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-center border-b border-zinc-100 px-3">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, clients, or tasks..."
                className="h-11 w-full bg-transparent px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-3">
              <div>
                <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Projects ({searchResults.matchedProjects.length})
                </div>
                {searchResults.matchedProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(`/projects/${project.id}`);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs hover:bg-zinc-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {PROJECT_TYPE_ICONS[project.project_type]}
                      <span className="font-medium text-zinc-900">
                        {project.title}
                      </span>
                      <span className="text-zinc-400">· {project.client_name}</span>
                    </div>
                    <Badge variant="outline">{project.status}</Badge>
                  </button>
                ))}
              </div>

              <div>
                <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Tasks ({searchResults.matchedTasks.length})
                </div>
                {searchResults.matchedTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(`/projects/${task.project_id}`);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs hover:bg-zinc-100 cursor-pointer"
                  >
                    <span className="font-medium text-zinc-800 truncate">
                      {task.title}
                    </span>
                    <Badge variant="secondary">{task.status}</Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
