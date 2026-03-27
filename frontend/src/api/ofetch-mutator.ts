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
    throw { status: response.status, data: errorData }; // Throws the ProblemDetails JSON!
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
};
