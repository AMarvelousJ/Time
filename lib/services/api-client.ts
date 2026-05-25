const bootstrapActorId = process.env.NEXT_PUBLIC_BOOTSTRAP_ACTOR_ID;

const getHeaders = () => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (bootstrapActorId) {
    headers["x-actor-profile-id"] = bootstrapActorId;
  }
  return headers;
};

export const apiFetch = async <T>(
  input: string,
  init?: RequestInit
): Promise<T> => {
  const method = (init?.method ?? "GET").toUpperCase();
  const response = await fetch(input, {
    ...init,
    cache: method === "GET" ? "no-store" : init?.cache,
    headers: {
      ...getHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }
  return payload;
};
