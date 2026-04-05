'use client'

import { Menu, Bell, ChevronDown, Globe, LogOut, User, Settings, CreditCard } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/db/client'
import { UserAvatar } from '@/components/ui/data-display'
import type { Profile, Organization } from '@/types'
import { locales, localeNames } from '@/lib/i18n/config'
import { OrgSwitcher } from '@/components/app-shell/org-switcher'

interface TopbarProps {
  locale: string
  user: Profile | null
  organization: Organization
  organizations: { organization_id: string; organization: Organization }[]
  onMenuToggle: () => void
}

export function AppTopbar({ locale, user, organization, organizations, onMenuToggle }: TopbarProps) {
  const t = useTranslations('common')
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
    router.refresh()
  }

  function switchLocale(newLocale: string) {
    const path = window.location.pathname
    const newPath = path.replace(`/${locale}/`, `/${newLocale}/`)
    router.push(newPath)
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4">
      <button
        onClick={onMenuToggle}
        className="lg:hidden rounded-md p-1.5 hover:bg-muted transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb placeholder - filled by page */}
      <div id="breadcrumb-slot" className="flex-1 min-w-0" />

      <div className="flex items-center gap-1.5">
        <OrgSwitcher organizations={organizations} activeOrganizationId={organization.id} />
        {/* Language selector */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Globe className="h-4 w-4" />
            <span>{localeNames[locale as keyof typeof localeNames]}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-36 rounded-md border bg-background shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md ${l === locale ? 'font-medium text-primary' : 'text-foreground'}`}
              >
                {localeNames[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <button className="relative rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="h-4.5 w-4.5" />
        </button>

        {/* User menu */}
        <div className="relative group ml-1">
          <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted transition-colors">
            <UserAvatar
              firstName={user?.first_name}
              lastName={user?.last_name}
              avatarUrl={user?.avatar_url}
              size="sm"
            />
            <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
              {user?.first_name} {user?.last_name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-background shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="px-3 py-2 border-b">
              <p className="text-xs font-medium truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-muted-foreground truncate">{organization.name}</p>
            </div>
            <Link href={`/${locale}/app/settings`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
              <User className="h-4 w-4" /> {t('user.profile')}
            </Link>
            <Link href={`/${locale}/app/settings`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
              <Settings className="h-4 w-4" /> {t('organization.settings')}
            </Link>
            <Link href={`/${locale}/app/billing`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
              <CreditCard className="h-4 w-4" /> {t('user.account')}
            </Link>
            <div className="border-t">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors rounded-b-md"
              >
                <LogOut className="h-4 w-4" /> {t('user.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
