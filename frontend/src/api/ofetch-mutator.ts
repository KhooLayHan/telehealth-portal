// 1. Define the ASP.NET ProblemDetails standard shape
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: any; // Allow any other extensions (like traceId)
}

class ApiError extends Error {
  status: number;
  data: ProblemDetails; // 2. Tell TS that 'data' is ProblemDetails!

  constructor(status: number, data: unknown) {
    super(`API error: ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = (data as ProblemDetails) || {};
  }
}

export const ofetchMutator = async <T>(
  url: string,
  options: RequestInit
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    credentials: "include", // 🔥 CRITICAL FOR HTTPONLY COOKIES
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
  return text ? (JSON.parse(text) as T) : (undefined as T);
};

export { ApiError };
