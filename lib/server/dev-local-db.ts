const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function getDatabaseHost(
  databaseUrl = process.env.DATABASE_URL,
): string | null {
  if (!databaseUrl) return null;

  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return null;
  }
}

export function isLocalDatabaseUrl(
  databaseUrl = process.env.DATABASE_URL,
): boolean {
  const host = getDatabaseHost(databaseUrl);
  return host ? LOCAL_DB_HOSTS.has(host) : false;
}

export function assertLocalDatabaseUrl(
  databaseUrl = process.env.DATABASE_URL,
): void {
  const host = getDatabaseHost(databaseUrl);
  if (!host || !LOCAL_DB_HOSTS.has(host)) {
    throw new Error(
      `Refusing to run against non-local DATABASE_URL host: ${host ?? "missing/invalid"}`,
    );
  }
}

export function assertNonProductionLocalSeedTarget(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed when NODE_ENV=production");
  }

  if (process.env.VERCEL_ENV === "production") {
    throw new Error("Refusing to seed when VERCEL_ENV=production");
  }

  assertLocalDatabaseUrl();
}
