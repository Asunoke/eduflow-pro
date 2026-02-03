import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { AppSidebar } from './AppSidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarCollapsed } = useStore();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
