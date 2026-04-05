'use client'

import React, { useState } from 'react'
import { AppSidebar } from '@/components/app-shell/sidebar'
import { AppTopbar } from '@/components/app-shell/topbar'
import type { Profile, Organization } from '@/types'

interface AppLayoutClientProps {
  children: React.ReactNode
  locale: string
  user: Profile | null
  organization: Organization
  organizations: { organization_id: string; organization: Organization }[]
}

export default function AppLayoutClient({ children, locale, user, organization, organizations }: AppLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        locale={locale}
        orgName={organization.name}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar
          locale={locale}
          user={user}
          organization={organization}
          organizations={organizations}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
