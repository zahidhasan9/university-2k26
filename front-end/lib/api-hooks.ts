"use client"

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query"
import type { Method } from "axios"

import type { ApiResponse } from "@/lib/api"
import { apiRequest } from "@/lib/http-client"

type EndpointMutationOptions = {
  method?: Method
  invalidate?: QueryKey[]
}

export function useEndpointMutation<TData = unknown, TBody = unknown>(
  endpoint: string,
  options: EndpointMutationOptions = {},
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: TBody) =>
      apiRequest<TData>(endpoint, {
        method: options.method ?? "POST",
        data: body,
      }),
    onSuccess: async () => {
      await Promise.all(
        (options.invalidate ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      )
    },
  })
}

export function responseData<T>(response: ApiResponse<T>): T {
  return response.data
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
