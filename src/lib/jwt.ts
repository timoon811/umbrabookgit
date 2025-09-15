export function getJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv;
  }
  // Dev fallback to keep local environment working
  if (process.env.NODE_ENV !== "production") {
    return "umbra_platform_super_secret_jwt_key_2024";
  }
  throw new Error("JWT_SECRET environment variable is required");
}


