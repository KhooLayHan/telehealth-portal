// 1. Define the ASP.NET ProblemDetails standard shape
export interface ProblemDetails {
  detail?: string;
  instance?: string;
  requestId?: string;
  status?: number;
  title?: string;
  traceId?: string;
  type?: string;
  [key: string]: unknown;
}

class ApiError extends Error {
  status: number;
  data: ProblemDetails; // 2. Tell TS that 'data' is ProblemDetails!

  constructor(status: number, data: unknown) {
    super(`API error: ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = (data as ProblemDetails) ?? {};
  }
}

export const ofetchMutator = async <T>(
  url: string,
  options: RequestInit
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(response.status, errorData);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
};

export { ApiError };
