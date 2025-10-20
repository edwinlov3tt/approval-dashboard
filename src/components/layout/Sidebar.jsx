import { Link, useLocation } from 'react-router-dom'
import Icon from '../ui/Icon'
import { mockCompanyProfile } from '../../lib/mockData'

export default function Sidebar() {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/ads', label: 'Ads', icon: 'ads' },
    { path: '/campaigns', label: 'Campaigns', icon: 'campaigns' },
    { path: '/calendar', label: 'Calendar', icon: 'calendar' },
    { path: '/profile', label: 'Profile', icon: 'profile' },
  ]

  return (
    <aside className="w-60 bg-surface border-r border-border h-[calc(100vh-56px)] sticky top-14 flex flex-col">
      <nav className="p-sp-4 flex-1 overflow-y-auto">
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
                  <span className="mr-sp-3">
                    <Icon name={item.icon} />
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Business Profile Section - Always at bottom */}
      <div className="border-t border-divider p-sp-4 flex-shrink-0">
        <Link
          to="/business-profile"
          className={`flex items-center p-sp-3 rounded-md transition-colors hover:bg-canvas ${
            location.pathname === '/business-profile' ? 'bg-canvas' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-md bg-brand flex items-center justify-center text-white font-semibold text-16 mr-sp-3 flex-shrink-0">
            {mockCompanyProfile.company_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-14 font-medium text-text-primary truncate">
              {mockCompanyProfile.company_name.split(',')[0]}
            </div>
            <div className="text-12 text-text-muted">Business Profile</div>
          </div>
        </Link>
      </div>
    </aside>
  )
}
