import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import { useI18n } from '../hooks/useI18n'
import { useInterfaceScale } from '../hooks/useInterfaceScale'

export function DashboardLayout() {
  const { t } = useI18n()
  useInterfaceScale(135, 100)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const openSidebar = useCallback(() => setSidebarOpen(true), [])

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f5] text-zinc-950">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-black text-white outline-none focus:translate-y-0 focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
      >
        {t('accessibility.skipToContent')}
      </a>
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div id="dashboard-content" className="min-w-0 lg:pl-[272px]">
        <Navbar onMenuOpen={openSidebar} />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1480px] px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
