import app from './app';
import config from './config';

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`[backend] RadiusServer API running on port ${config.port} (${config.nodeEnv})`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`[backend] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[backend] HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[backend] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
