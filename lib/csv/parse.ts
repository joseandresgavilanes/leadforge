/**
 * Minimal RFC-style CSV parser (quoted fields, commas inside quotes).
 * Sufficient for imports; no streaming.
 */
export function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur.trim())
  return out
}

export function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0)
  return lines.map(parseCsvLine)
}

export function rowsToObjects(headers: string[], rows: string[][]): Record<string, string>[] {
  return rows.map((cells) => {
    const o: Record<string, string> = {}
    headers.forEach((h, i) => {
      o[h] = cells[i] ?? ''
    })
    return o
  })
}
