import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import type { ApiResponse } from "@/lib/api"

export type ApiGet = <T>(path: string) => Promise<ApiResponse<T>>
export type ListQuery = Record<string, string | number | boolean | undefined>

const list = <T>(get: ApiGet, endpoint: string, query: ListQuery = {}) => get<T>(withQuery(endpoint, query))

export const domainServices = {
  academics: {
    list: <T>(get: ApiGet, entity: keyof typeof API_ENDPOINTS.academics, query?: ListQuery) => list<T>(get, API_ENDPOINTS.academics[entity] as string, query),
    detail: <T>(get: ApiGet, entity: string, id: string) => get<T>(API_ENDPOINTS.academics.detail(entity, id)),
  },
  students: {
    list: <T>(get: ApiGet, query?: ListQuery) => list<T>(get, API_ENDPOINTS.students.list, query),
    detail: <T>(get: ApiGet, id: string) => get<T>(API_ENDPOINTS.students.detail(id)),
  },
  finance: {
    list: <T>(get: ApiGet, endpoint: string, query?: ListQuery) => list<T>(get, endpoint, query),
  },
  lms: {
    workspace: <T>(get: ApiGet, offeringId?: string) => get<T>(withQuery(API_ENDPOINTS.lms.workspace, { offeringId })),
  },
} as const
