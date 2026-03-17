export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getJwtSecretOrThrow(): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || !jwtSecret.trim()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing required environment variable: JWT_SECRET");
    }

    // Keep local development usable while still warning loudly.
    console.warn("[ENV] JWT_SECRET is not set. Using local development fallback secret.");
    return "fallback-secret-change-me";
  }

  return jwtSecret;
}