'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Globe, ChevronDown } from 'lucide-react'
import { locales, localeNames, type Locale } from '@/lib/i18n/config'

export function MarketingLocaleSwitcher({ locale }: { locale: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('common.langSwitcher')

  function switchLocale(next: string) {
    const segments = pathname.split('/')
    if (segments[1] && locales.includes(segments[1] as Locale)) {
      segments[1] = next
    }
    router.push(segments.join('/') || '/')
    router.refresh()
  }

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-brand-text-muted hover:bg-muted"
        aria-label={t('label')}
      >
        <Globe className="h-4 w-4" />
        <span>{localeNames[locale as Locale]}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <div className="absolute right-0 top-full mt-1 w-36 rounded-md border bg-background shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => switchLocale(l)}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-muted first:rounded-t-md last:rounded-b-md ${l === locale ? 'font-medium text-primary' : ''}`}
          >
            {localeNames[l]}
          </button>
        ))}
      </div>
    </div>
  )
}
