/**
 * Environment variable validation
 * Ensures all required env vars are set for production
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV',
] as const;

const optionalButRecommended = [
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const;

export function validateEnvVariables(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required vars
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check optional but recommended
  if (process.env.NODE_ENV === 'production') {
    for (const envVar of optionalButRecommended) {
      if (!process.env[envVar]) {
        errors.push(`Missing recommended environment variable in production: ${envVar}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Assert env variables are valid on startup
 * Call this in middleware or root layout
 */
export function assertEnvVariables(): void {
  const validation = validateEnvVariables();
  
  if (!validation.valid) {
    const errorMessage = `Environment validation failed:\n${validation.errors.join('\n')}`;
    throw new Error(errorMessage);
  }
}

/**
 * Get env variable with type safety
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Environment variable not found: ${key}`);
  }
  return value;
}

/**
 * Get optional env variable
 */
export function getOptionalEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] ?? defaultValue;
}
