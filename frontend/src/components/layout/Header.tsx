import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GitBranch, List, Clock } from 'lucide-react';
import AppSelector from '../app/AppSelector';
import SyncButton from '../app/SyncButton';
import DeleteAppButton from '../app/DeleteAppButton';

interface HeaderProps {
  selectedAppId: string | null;
  onAppChange: (appId: string | null) => void;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/graph', label: 'Graph', icon: GitBranch },
  { to: '/branches', label: 'Branches', icon: List },
  { to: '/timeline', label: 'Timeline', icon: Clock },
];

export default function Header({ selectedAppId, onAppChange }: HeaderProps) {
  return (
    <header className="bg-white border-b border-surface-200/80 px-6 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between max-w-[1600px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-soft">
            <GitBranch className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            Branch<span className="text-brand-500">Tree</span>
          </span>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center bg-surface-50 rounded-xl p-1 border border-surface-200/60">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-pill ${isActive ? 'nav-pill-active' : 'nav-pill-inactive'}`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <AppSelector selectedAppId={selectedAppId} onAppChange={onAppChange} />
          {selectedAppId && <SyncButton appId={selectedAppId} />}
          {selectedAppId && (
            <DeleteAppButton
              appId={selectedAppId}
              onDeleted={() => onAppChange(null)}
            />
          )}
        </div>
      </div>
    </header>
  );
}
