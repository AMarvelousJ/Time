export const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

export const withNoStoreHeaders = (init?: ResponseInit): ResponseInit => ({
  ...init,
  headers: {
    ...noStoreHeaders,
    ...(init?.headers ?? {}),
  },
});
