const DEFAULT_SITE_URL = "http://localhost:3000";

export const getBaseSiteUrl = () => {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    DEFAULT_SITE_URL;
  return envUrl.replace(/\/+$/, "");
};

export const getAbsoluteUrl = (path: string) => {
  if (!path) {
    return getBaseSiteUrl();
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base = getBaseSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

export const getContactEmail = () => {
  const envEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  if (envEmail && envEmail.trim().length > 0) {
    return envEmail;
  }

  const base = getBaseSiteUrl();
  try {
    const host = new URL(base).hostname;
    return host ? `info@${host}` : "";
  } catch {
    return "";
  }
};
