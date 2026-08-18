import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Content from './Content'

function AppLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const closeMobileNav = () => setMobileNavOpen(false)

  return (
    <div className={`qc-app-shell-v2 relative flex h-screen min-h-0 overflow-hidden transition-all duration-200 ${collapsed ? 'lg:pl-[64px]' : 'lg:pl-[200px]'}`}>
      <Sidebar
        collapsed={collapsed}
        open={mobileNavOpen}
        onClose={closeMobileNav}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Header
          collapsed={collapsed}
          onMenuClick={() => setMobileNavOpen(true)}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
        <Content className="px-4 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-5">
          {children ?? <Outlet />}
        </Content>
      </div>
    </div>
  )
}

export default AppLayout
