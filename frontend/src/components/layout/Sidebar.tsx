import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '□' },
  { to: '/graph', label: 'Branch Graph', icon: '◇' },
  { to: '/branches', label: 'Branches', icon: '≡' },
  { to: '/timeline', label: 'Timeline', icon: '—' },
];

export default function Sidebar() {
  return (
    <nav className="w-56 bg-white border-r border-gray-200 py-4 flex-shrink-0">
      <ul className="space-y-1 px-3">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-mendix-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
