import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, GitBranch, List, Clock, ArrowLeft } from 'lucide-react';
import SyncButton from '../app/SyncButton';
import DeleteAppButton from '../app/DeleteAppButton';
import { useApps } from '../../hooks/useApps';

interface HeaderProps {
  selectedAppId: string | null;
  onAppChange: (appId: string | null) => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/graph', label: 'Graph', icon: GitBranch },
  { to: '/branches', label: 'Branches', icon: List },
  { to: '/timeline', label: 'Timeline', icon: Clock },
];

export default function Header({ selectedAppId, onAppChange }: HeaderProps) {
  const navigate = useNavigate();
  const { data } = useApps();
  const selectedApp = data?.apps.find((a) => a.appId === selectedAppId);

  const handleBack = () => {
    onAppChange(null);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-surface-200/80 px-6 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between max-w-[1600px] mx-auto">
        {/* Left: Logo + back button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {selectedAppId ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">Projects</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-soft">
                <GitBranch className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                Branch<span className="text-brand-500">Tree</span>
              </span>
            </div>
          )}

          {selectedAppId && (
            <>
              <div className="w-px h-6 bg-surface-200" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                  <GitBranch className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-semibold text-gray-900 max-w-[200px] truncate">
                  {selectedApp?.appName || selectedApp?.appId || 'Project'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Center: Navigation (only when a project is selected) */}
        {selectedAppId && (
          <nav className="hidden md:flex items-center bg-surface-50 rounded-xl p-1 border border-surface-200/60">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-pill ${isActive ? 'nav-pill-active' : 'nav-pill-inactive'}`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Right: Actions (only when a project is selected) */}
        {selectedAppId ? (
          <div className="flex items-center gap-3">
            <SyncButton appId={selectedAppId} />
            <DeleteAppButton
              appId={selectedAppId}
              onDeleted={handleBack}
            />
          </div>
        ) : (
          <div /> /* Spacer for centering */
        )}
      </div>
    </header>
  );
}
