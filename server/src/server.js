import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

const startServer = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`[InvoiceHub Server] Running on http://localhost:${config.port}`);
    console.log(`[InvoiceHub Server] API Base: http://localhost:${config.port}/api/v1`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
