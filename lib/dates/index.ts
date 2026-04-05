import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import type { Locale } from 'date-fns'

const localeMap: Record<string, Locale> = {
  en: enUS,
  es,
}

function getLocale(locale = 'en') {
  return localeMap[locale] ?? enUS
}

export function formatDate(date: string | Date, locale = 'en'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy', { locale: getLocale(locale) })
}

export function formatDateShort(date: string | Date, locale = 'en'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d', { locale: getLocale(locale) })
}

export function formatDateTime(date: string | Date, locale = 'en'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy HH:mm', { locale: getLocale(locale) })
}

export function formatRelative(date: string | Date, locale = 'en'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true, locale: getLocale(locale) })
  if (isYesterday(d)) return locale === 'es' ? 'Ayer' : 'Yesterday'
  return formatDate(d, locale)
}

export function formatRelativeShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function isoNow(): string {
  return new Date().toISOString()
}

export function isoDate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}
