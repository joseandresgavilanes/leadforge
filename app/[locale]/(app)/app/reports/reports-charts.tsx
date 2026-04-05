'use client'

import { useTranslations } from 'next-intl'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display'
import { formatCurrency } from '@/lib/utils'

interface Props {
  leadsBySource: Record<string, number>
  pipelineByStage: { name: string; value: number; count: number; color: string }[]
  forecast: number
}

export default function ReportsCharts({ leadsBySource, pipelineByStage, forecast }: Props) {
  const t = useTranslations('reports')
  const sourceData = Object.entries(leadsBySource).map(([name, count]) => ({
    name: name.replace('_', ' '),
    count,
  })).sort((a, b) => b.count - a.count)

  const stageData = pipelineByStage.filter((s) => s.value > 0)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Leads by Source */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('charts.leadsBySource')}</CardTitle>
        </CardHeader>
        <CardContent>
          {sourceData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">{t('empty.title')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sourceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: 12 }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pipeline by Stage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('charts.pipelineByStage')}</CardTitle>
        </CardHeader>
        <CardContent>
          {stageData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">{t('empty.title')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stageData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stageData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Forecast card */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('charts.forecast')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm text-muted-foreground">{t('charts.forecastWeightedLabel')}</p>
              <p className="text-3xl font-heading font-bold text-primary mt-1">{formatCurrency(forecast)}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('charts.forecastWeightedHint')}</p>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={pipelineByStage.filter(s => s.value > 0)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {pipelineByStage.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: 12 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
