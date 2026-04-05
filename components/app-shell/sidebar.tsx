'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Building2, Contact, TrendingUp,
  CheckSquare, Activity, FileText, BarChart3, Settings,
  CreditCard, UserCog, Zap, X, Menu, Database, Inbox, ListOrdered,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import React from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface SidebarProps {
  locale: string
  orgName: string
  open: boolean
  onClose: () => void
}

export function AppSidebar({ locale, orgName, open, onClose }: SidebarProps) {
  const t = useTranslations('common.app.nav')
  const tc = useTranslations('common')
  const pathname = usePathname()
  const base = `/${locale}/app`

  const navItems: NavItem[] = [
    { label: t('dashboard'), href: `${base}/dashboard`, icon: LayoutDashboard },
    { label: t('leads'), href: `${base}/leads`, icon: Zap },
    { label: t('contacts'), href: `${base}/contacts`, icon: Contact },
    { label: t('companies'), href: `${base}/companies`, icon: Building2 },
    { label: t('opportunities'), href: `${base}/opportunities`, icon: TrendingUp },
    { label: t('inbox'), href: `${base}/inbox`, icon: Inbox },
    { label: t('sequences'), href: `${base}/sequences`, icon: ListOrdered },
    { label: t('tasks'), href: `${base}/tasks`, icon: CheckSquare },
    { label: t('activities'), href: `${base}/activities`, icon: Activity },
    { label: t('quotes'), href: `${base}/quotes`, icon: FileText },
    { label: t('reports'), href: `${base}/reports`, icon: BarChart3 },
  ]

  const settingsItems: NavItem[] = [
    { label: t('team'), href: `${base}/team`, icon: UserCog },
    { label: t('settings'), href: `${base}/settings`, icon: Settings },
    { label: t('dataHygiene'), href: `${base}/settings/data`, icon: Database },
    { label: t('billing'), href: `${base}/billing`, icon: CreditCard },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / Org name */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight truncate">
                {tc('app.productName')}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">{orgName}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}

          <div className="pt-4 pb-1 px-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {tc('app.accountSection')}
            </p>
          </div>

          {settingsItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </aside>
    </>
  )
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  )
}
