import type { PaginatedResult } from '@/types'

export function emptyPaginated<T>(page: number, pageSize: number): PaginatedResult<T> {
  return { data: [], total: 0, page, pageSize, totalPages: 0 }
}

export function paginateArray<T>(data: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = data.length
  const from = (page - 1) * pageSize
  const slice = data.slice(from, from + pageSize)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  return { data: slice, total, page, pageSize, totalPages }
}
