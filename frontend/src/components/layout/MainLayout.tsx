import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  selectedAppId: string | null;
  onAppChange: (appId: string | null) => void;
}

export default function MainLayout({
  children,
  selectedAppId,
  onAppChange,
}: MainLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      <Header selectedAppId={selectedAppId} onAppChange={onAppChange} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 bg-mendix-gray">
          {children}
        </main>
      </div>
    </div>
  );
}
