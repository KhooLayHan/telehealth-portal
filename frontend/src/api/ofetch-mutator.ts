/**
 * API base URL — resolved from environment variable at build time.
 *
 * Local dev:  VITE_API_URL defaults to "http://localhost:5144" (see .env.development)
 * Deployed:   VITE_API_URL is set by the CD workflow to the EB endpoint URL
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5144";

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
  data: ProblemDetails;

  constructor(status: number, data: unknown) {
    super(`API error: ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = (data as ProblemDetails) ?? {};
  }
}

/**
 * Custom fetch mutator for Orval-generated API clients.
 *
 * Orval generates calls like: ofetchMutator("/api/v1/auth/login", { method: "POST", ... })
 * This mutator prepends the API_BASE_URL so the full URL becomes:
 *   - Local:    http://localhost:5144/api/v1/auth/login
 *   - Deployed: http://<eb-env>.us-east-1.elasticbeanstalk.com/api/v1/auth/login
 */
export const ofetchMutator = async <T>(url: string, options: RequestInit): Promise<T> => {
  const fullUrl = `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
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
