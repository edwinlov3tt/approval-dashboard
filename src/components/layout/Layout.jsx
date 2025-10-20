import TopNav from './TopNav'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-canvas">
      <TopNav />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 content-padding py-sp-6">
          <div className="max-w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
