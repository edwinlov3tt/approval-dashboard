import { useAuth } from '../../lib/auth'

export default function TopNav() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-surface border-b border-border h-14 px-sp-4 sticky top-0 z-50">
      <div className="max-w-full mx-auto flex items-center justify-between h-full">
        <div className="text-20 font-semibold text-brand">Client Approval Dashboard</div>
        <div className="flex items-center gap-sp-3">
          <span className="meta-body">{user?.name || 'User'}</span>
          <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-medium text-14">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          <button
            onClick={logout}
            className="meta-button-secondary meta-button-small"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
