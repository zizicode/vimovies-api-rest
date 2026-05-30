import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'

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

const client: AxiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function httpRequest<TResponse = unknown, TBody = unknown>(
  config: RequestConfig<TBody>
): Promise<ApiResponse<TResponse>> {
  try {
    const requestConfig = {
      url: config.url,
      method: config.method ?? 'GET',
      headers: {
        ...config.headers,
        ...(config.token && {
          Authorization: `Bearer ${config.token}`,
        }),
      },
    
      ...(config.baseURL && { baseURL: config.baseURL }),
      ...(config.params && { params: config.params }),
      ...(config.data && { data: config.data }),
      ...(config.timeout && { timeout: config.timeout }),
    }

    const response = await client.request<TResponse>(requestConfig)

    // If the API already returns the standard structure {success, status, data}, return it directly
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'status' in response.data &&
      'data' in response.data
    ) {
      return response.data as ApiResponse<TResponse>
    }

    return {
      success: true,
      status: response?.status ?? 200,
      data: response.data,
    }
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>

    return {
      success: false,
      status: err.response?.status ?? 500,
      data: null,
      error:
        err.response?.data?.message ||
        err.message ||
        'Unexpected request error',
    }
  }
}