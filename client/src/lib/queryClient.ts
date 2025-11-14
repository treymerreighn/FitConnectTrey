import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  methodOrUrl: string,
  urlOrOptions?: string | RequestInit | any,
  data?: unknown,
): Promise<any> {
  // Two calling styles supported for backward compatibility:
  // 1) apiRequest(method, url, data)
  // 2) apiRequest(url, { method: 'POST', body, headers })
  let url: string;
  let options: RequestInit = { credentials: "include" };

  if (typeof urlOrOptions === "string") {
    // style 1
    const method = methodOrUrl;
    url = urlOrOptions;
    const isFormData = data instanceof FormData;
    options.method = method;
    options.body = isFormData ? (data as any) : (data ? JSON.stringify(data) : undefined);
    if (!isFormData && data) {
      options.headers = { "Content-Type": "application/json" } as any;
    }
  } else {
    // style 2
    url = methodOrUrl;
    const maybeOpts = (urlOrOptions || {}) as RequestInit & { body?: any };
    options = { ...options, ...maybeOpts };

    // If a non-FormData body is provided as an object, stringify it and set header
    if (options.body && !(options.body instanceof FormData) && typeof options.body !== "string") {
      options.body = JSON.stringify(options.body);
      options.headers = { ...(options.headers as any), "Content-Type": "application/json" } as any;
    }
    // If the body is a string (likely already stringified JSON) and there's no
    // Content-Type header, assume JSON so server parses it.
    if (options.body && !(options.body instanceof FormData) && typeof options.body === "string") {
      const headers = { ...(options.headers as any) } as Record<string, string>;
      if (!headers["Content-Type"] && !headers["content-type"]) {
        options.headers = { ...(options.headers as any), "Content-Type": "application/json" } as any;
      }
    }
  }

  const res = await fetch(url, options);
  await throwIfResNotOk(res);

  // If response is JSON, parse and return the body to match most client call-sites
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }

  // Fallback: return the Response for non-JSON (e.g., file downloads)
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Starting React Query fetch for: ${queryKey[0]}`);
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    console.log(`React Query response status for ${queryKey[0]}:`, res.status);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log(`React Query fetch successful for ${queryKey[0]}:`, data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Always fetch fresh data
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as Error).message;
          if (message.startsWith('4')) return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    },
  },
});
