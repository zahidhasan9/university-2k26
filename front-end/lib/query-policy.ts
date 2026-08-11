export const QUERY_KEYS = {
  auth: { me: ["auth", "me"] as const },
  notifications: { all: ["notifications"] as const, header: ["notifications", "header"] as const },
  academics: (entity: string, filters?: unknown) => ["academics", entity, filters] as const,
  students: (filters?: unknown) => ["students", filters] as const,
  finance: (resource: string, filters?: unknown) => ["finance", resource, filters] as const,
  lms: (offeringId?: string) => ["lms", "workspace", offeringId] as const,
} as const

export const CACHE_POLICY = {
  identity: { staleTime: 5 * 60_000, gcTime: 30 * 60_000 },
  reference: { staleTime: 10 * 60_000, gcTime: 30 * 60_000 },
  operational: { staleTime: 30_000, gcTime: 5 * 60_000 },
  realtime: { staleTime: 10_000, gcTime: 60_000, refetchInterval: 60_000 },
} as const
