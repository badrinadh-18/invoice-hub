import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

const startServer = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`[InvoiceHub Server] Running on http://localhost:${config.port}`);
    console.log(`[InvoiceHub Server] API Base: http://localhost:${config.port}/api/v1`);

    // Automatic Keep-Alive: Sends heartbeat ping every 10 minutes to prevent Render free-tier sleep
    const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
    const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL || 'https://invoice-hub-t9jv.onrender.com/api/v1/health';

    if (config.nodeEnv === 'production') {
      setInterval(async () => {
        try {
          await fetch(KEEP_ALIVE_URL);
          console.log(`[KeepAlive] Heartbeat sent to keep cloud server awake.`);
        } catch (err) {
          console.warn(`[KeepAlive] Heartbeat warning:`, err.message);
        }
      }, PING_INTERVAL);
    }
  });

  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
