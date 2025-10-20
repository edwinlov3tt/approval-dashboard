import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'Dashboard' },
    { path: '/campaigns', label: 'Campaigns', icon: 'Campaigns' },
    { path: '/calendar', label: 'Calendar', icon: 'Calendar' },
    { path: '/profile', label: 'Profile', icon: 'Profile' },
  ]

  return (
    <aside className="w-60 bg-surface border-r border-border min-h-[calc(100vh-56px)]">
      <nav className="p-sp-4">
        <ul className="space-y-sp-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-sp-4 py-sp-3 rounded-md transition-colors text-14 ${
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-text-primary hover:bg-canvas'
                  }`}
                >
                  <span className="mr-sp-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
