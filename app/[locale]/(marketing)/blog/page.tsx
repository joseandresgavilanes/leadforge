import { getTranslations } from 'next-intl/server'
import { MarketingSubpage } from '@/components/marketing/marketing-subpage'

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('marketing.blogPage')

  const posts = [
    { title: t('post1Title'), excerpt: t('post1Excerpt') },
    { title: t('post2Title'), excerpt: t('post2Excerpt') },
    { title: t('post3Title'), excerpt: t('post3Excerpt') },
  ]

  return (
    <MarketingSubpage locale={locale}>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-heading text-4xl font-bold text-brand-text-main mb-3">{t('title')}</h1>
        <p className="text-brand-text-muted mb-12">{t('subtitle')}</p>
        <ul className="space-y-10">
          {posts.map((post, i) => (
            <li key={i} className="border-b border-brand-border pb-10">
              <h2 className="font-heading text-xl font-semibold text-brand-text-main mb-2">{post.title}</h2>
              <p className="text-brand-text-muted">{post.excerpt}</p>
            </li>
          ))}
        </ul>
      </div>
    </MarketingSubpage>
  )
}
