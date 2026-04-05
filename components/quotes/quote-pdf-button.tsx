'use client'

import { useState } from 'react'
import { Document, Page, Text, View, pdf, StyleSheet } from '@react-pdf/renderer'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { QuoteWithItems } from '@/types'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  h1: { fontSize: 18, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  th: { fontWeight: 'bold', borderBottomWidth: 1, paddingVertical: 4 },
})

export function QuotePdfButton({ quote }: { quote: QuoteWithItems }) {
  const t = useTranslations('quotes')
  const tc = useTranslations('common')
  const [loading, setLoading] = useState(false)

  async function download() {
    setLoading(true)
    try {
      const doc = (
        <Document>
          <Page size="A4" style={styles.page}>
            <Text style={styles.h1}>{quote.title}</Text>
            <Text style={{ marginBottom: 16 }}>{quote.quote_number}</Text>
            {quote.items.map((item, i) => (
              <View key={item.id ?? i} style={styles.row}>
                <Text style={{ flex: 3 }}>{item.description}</Text>
                <Text>{item.quantity}</Text>
                <Text>{formatCurrency(item.unit_price)}</Text>
                <Text>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
            <View style={{ marginTop: 24 }}>
              <Text>{t('fields.subtotal')}: {formatCurrency(quote.subtotal)}</Text>
              <Text>{t('fields.taxAmount')}: {formatCurrency(quote.tax_amount)}</Text>
              <Text style={{ fontWeight: 'bold', marginTop: 4 }}>{t('fields.total')}: {formatCurrency(quote.total)}</Text>
            </View>
          </Page>
        </Document>
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quote.quote_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" loading={loading} onClick={download}>
      {tc('actions.download')}
    </Button>
  )
}
