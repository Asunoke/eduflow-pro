import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Wallet,
  FileText,
  Settings,
  Menu,
  X,
  School,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Élèves', href: '/students', icon: Users },
  { name: 'Classes', href: '/classes', icon: GraduationCap },
  { name: 'Professeurs', href: '/teachers', icon: School },
  { name: 'Matières', href: '/subjects', icon: BookOpen },
  { name: 'Notes & Bulletins', href: '/grades', icon: ClipboardList },
  { name: 'Finances', href: '/finances', icon: Wallet },
  { name: 'Rapports', href: '/reports', icon: FileText },
];

import logo from '@/assets/logo.jpg';

export function AppSidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, darkMode, toggleDarkMode, settings } = useStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-[#1a1823] border-r border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      {/* Header */}
      <div className={cn("flex items-center transition-all duration-300 h-16", sidebarCollapsed ? "justify-center px-2" : "justify-between px-4")}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
            <span className="font-bold text-slate-800 dark:text-white tracking-tight">
              EduFlow
            </span>
          </div>
        )}

        {sidebarCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 shrink-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium bg-slate-900 text-white border-none">
              Ouvrir le menu
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          const linkContent = (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary' : 'text-slate-400')} />
              {!sidebarCollapsed && <span>{item.name}</span>}
              {isActive && !sidebarCollapsed && (
                <div className="ml-auto w-1 h-5 rounded-full bg-primary" />
              )}
            </NavLink>
          );

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.name} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium bg-slate-900 text-white border-none">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Footer Settings */}
      <div className="p-3 border-t border-slate-50 dark:border-slate-800 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all justify-start',
            sidebarCollapsed && 'justify-center px-0'
          )}
        >
          {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-400" />}
          {!sidebarCollapsed && <span>{darkMode ? 'Mode Clair' : 'Mode Sombre'}</span>}
        </Button>
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <Settings className="h-5 w-5 text-slate-400" />
          {!sidebarCollapsed && <span>Paramètres</span>}
        </NavLink>
      </div>
    </aside>
  );
}
