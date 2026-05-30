export interface ApiResponse<T = unknown> {
  success: boolean
  status: number
  data: T | null
  error?: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestConfig<TBody = unknown> {
  url: string
  method?: HttpMethod
  baseURL?: string

  params?: Record<string, unknown>
  data?: TBody

  headers?: Record<string, string>

  token?: string
  timeout?: number
}

