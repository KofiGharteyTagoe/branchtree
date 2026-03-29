import type { ReactNode } from 'react';
import Header from './Header';
import BranchCanopyBackground from './BranchCanopyBackground';

interface MainLayoutProps {
  children: ReactNode;
  selectedAppId: string | null;
  onAppChange: (appId: string | null) => void;
}

export default function MainLayout({ children, selectedAppId, onAppChange }: MainLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-surface-50">
      <BranchCanopyBackground />
      <Header selectedAppId={selectedAppId} onAppChange={onAppChange} />
      <main className="flex-1 overflow-auto relative z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
