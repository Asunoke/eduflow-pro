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
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, darkMode, toggleDarkMode, settings } = useStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-sidebar-primary-foreground text-sm">
                EduFlow
              </span>
              <span className="text-[10px] text-sidebar-muted truncate max-w-[120px]">
                {settings.schoolName || 'School Management'}
              </span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
        >
          {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
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
                'nav-item',
                isActive && 'nav-item-active',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-sidebar-primary-foreground')} />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </NavLink>
          );

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.name} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={sidebarCollapsed ? 'icon' : 'default'}
              onClick={toggleDarkMode}
              className={cn(
                'text-sidebar-foreground hover:bg-sidebar-accent w-full',
                sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'
              )}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {!sidebarCollapsed && <span>{darkMode ? 'Mode clair' : 'Mode sombre'}</span>}
            </Button>
          </TooltipTrigger>
          {sidebarCollapsed && (
            <TooltipContent side="right">
              {darkMode ? 'Mode clair' : 'Mode sombre'}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
