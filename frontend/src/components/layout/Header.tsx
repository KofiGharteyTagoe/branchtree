import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, GitBranch, List, Clock, ArrowLeft, LogOut, Settings, MessageSquare, X } from 'lucide-react';
import SyncButton from '../app/SyncButton';
import DeleteAppButton from '../app/DeleteAppButton';
import { useApps } from '../../hooks/useApps';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../config/api';

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

const FEEDBACK_CATEGORIES = [
  { value: 'bug', label: 'Bug Report', description: 'Something is broken or not working correctly' },
  { value: 'improvement', label: 'Improvement', description: 'Suggest an enhancement to existing functionality' },
  { value: 'feature', label: 'Feature Request', description: 'Request a new feature or capability' },
  { value: 'general', label: 'General', description: 'Any other feedback or comments' },
];

export default function Header({ selectedAppId, onAppChange }: HeaderProps) {
  const navigate = useNavigate();
  const { data } = useApps();
  const { user, logout } = useAuth();
  const selectedApp = data?.apps.find((a) => a.appId === selectedAppId);

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('general');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBack = () => {
    onAppChange(null);
    navigate('/');
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    setFeedbackMessage(null);
    try {
      await apiClient.post('/feedback', {
        category: feedbackCategory,
        title: feedbackTitle.trim(),
        description: feedbackDescription.trim(),
      });
      setFeedbackMessage({ type: 'success', text: 'Thank you! Your feedback has been submitted.' });
      setFeedbackTitle('');
      setFeedbackDescription('');
      setFeedbackCategory('general');
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackMessage(null);
      }, 2000);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to submit feedback' });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <>
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

          {/* Right: Actions + User */}
          <div className="flex items-center gap-3">
            {selectedAppId && (
              <>
                <SyncButton appId={selectedAppId} />
                <DeleteAppButton
                  appId={selectedAppId}
                  onDeleted={handleBack}
                />
                <div className="w-px h-6 bg-surface-200" />
              </>
            )}

            {user && (
              <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email)[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-surface-600 hidden lg:inline max-w-[120px] truncate">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={() => setShowFeedback(true)}
                  className="p-1.5 text-surface-400 hover:text-amber-500 transition-colors"
                  title="Send Feedback"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                {user.isAdmin && (
                  <button
                    onClick={() => navigate('/admin/settings')}
                    className="p-1.5 text-surface-400 hover:text-brand-600 transition-colors"
                    title="Admin Panel"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={logout}
                  className="p-1.5 text-surface-400 hover:text-red-500 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-semibold text-surface-900">Send Feedback</h3>
              </div>
              <button onClick={() => { setShowFeedback(false); setFeedbackMessage(null); }} className="text-surface-400 hover:text-surface-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackMessage && (
              <div className={`mb-4 p-3 rounded-xl text-sm ${feedbackMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {feedbackMessage.text}
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              {/* Category selector */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {FEEDBACK_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFeedbackCategory(cat.value)}
                      className={`p-3 rounded-xl text-left text-sm transition-colors border ${
                        feedbackCategory === cat.value
                          ? 'border-brand-300 bg-brand-50 text-brand-700'
                          : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                      }`}
                    >
                      <span className="font-medium block">{cat.label}</span>
                      <span className="text-xs opacity-70">{cat.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Title</label>
                <input
                  type="text"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Brief summary of your feedback"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
                <textarea
                  value={feedbackDescription}
                  onChange={(e) => setFeedbackDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Provide details about your feedback, including steps to reproduce if reporting a bug..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowFeedback(false); setFeedbackMessage(null); }}
                  className="px-4 py-2 text-sm text-surface-600 hover:bg-surface-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackSubmitting || !feedbackTitle.trim() || !feedbackDescription.trim()}
                  className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
