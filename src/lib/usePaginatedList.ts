import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '../api/client'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** A DRF-paginated list (10 per page, see backend TenPerPagePagination) as an
 * infinite, "load more"-able array — used for transaction/transfer history
 * lists that can otherwise grow unbounded and would fetch the user's entire
 * history on every page load. */
export function usePaginatedList<T>(queryKey: unknown[], url: string, params?: Record<string, unknown>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) =>
      (await api.get<PaginatedResponse<T>>(url, { params: { ...params, page: pageParam } })).data,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
  })

  const items = query.data?.pages.flatMap((page) => page.results) ?? []

  return {
    items,
    isLoading: query.isLoading,
    hasMore: query.hasNextPage,
    isFetchingMore: query.isFetchingNextPage,
    loadMore: () => query.fetchNextPage(),
  }
}
