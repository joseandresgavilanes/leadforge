import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import DemoForm from './demo-form'

export default async function DemoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('marketing.demo')
  const tc = await getTranslations('common')

  return (
    <div className="min-h-screen bg-brand-bg">
      <nav className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading font-bold text-brand-primary">LeadForge</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-xl mx-auto text-center mb-12">
          <h1 className="font-heading text-4xl font-bold text-brand-text-main mb-4">{t('title')}</h1>
          <p className="text-xl text-brand-text-muted">{t('subtitle')}</p>
        </div>
        <div className="max-w-lg mx-auto rounded-2xl border bg-white shadow-sm p-8">
          <DemoForm locale={locale} />
        </div>
      </div>
    </div>
  )
}
