const config = {
  port: parseInt(process.env.APP_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  db: {
    host: '127.0.0.1',
    port: 5432,
    database: process.env.POSTGRES_DB || 'radius',
    user: process.env.POSTGRES_USER || 'radius',
    password: process.env.POSTGRES_PASSWORD || 'changeme',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  cookieSecure: process.env.COOKIE_SECURE === 'true',

  internalSecret: process.env.INTERNAL_SECRET || 'dev-internal-secret',

  defaultAdmin: {
    username: process.env.DEFAULT_ADMIN_USER || 'admin',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!',
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    loginWindowMs: 15 * 60 * 1000,
    loginMax: 10,
  },

  frontendPath: process.env.FRONTEND_PATH || '/app/frontend',
} as const;

export default config;
