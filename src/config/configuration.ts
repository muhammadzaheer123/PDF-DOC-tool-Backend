export interface AppConfig {
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  mongoUri: string;
  backendPublicUrl: string;
  redis: {
    url?: string;
    host: string;
    port: number;
    password?: string;
  };
  storage: {
    driver: "local";
    uploadDir: string;
    resultDir: string;
    publicBaseUrl: string;
  };
  maxFileSizeMb: number;
  groq: {
    apiKey: string;
    model: string;
  };
  openai: {
    apiKey: string;
    textModel: string;
    imageModel: string;
  };
  auth: {
    jwtAccessSecret: string;
    jwtRefreshSecret: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
    bcryptSaltRounds: number;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? "4000", 10),
  apiPrefix: process.env.API_PREFIX ?? "api/v1",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/docuforge",
  backendPublicUrl:
    process.env.BACKEND_PUBLIC_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT ?? "4000"}`),
  redis: {
    url: process.env.REDIS_URL || undefined,
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  storage: {
    driver: "local",
    uploadDir: process.env.STORAGE_LOCAL_UPLOAD_DIR ?? "storage/uploads",
    resultDir: process.env.STORAGE_LOCAL_RESULT_DIR ?? "storage/results",
    publicBaseUrl:
      process.env.STORAGE_PUBLIC_BASE_URL ?? "http://localhost:4000/files",
  },
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? "50", 10),
  groq: {
    apiKey: process.env.GROQ_API_KEY ?? "",
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    textModel: process.env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini",
    imageModel: process.env.OPENAI_IMAGE_MODEL ?? "dall-e-3",
  },
  auth: {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "",
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "30d",
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "12", 10),
  },
});
