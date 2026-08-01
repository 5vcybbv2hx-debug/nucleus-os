import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import AtlasQuickActions from '@/components/atlas/AtlasQuickActions';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-28 lg:pb-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <AtlasQuickActions />
      <BottomNav />
    </div>
  );
}