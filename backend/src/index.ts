import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes.js';
import { config } from './config/index.js';
import { RequestSchedulingEngine } from './engines/request_scheduling.engine.js';
import { ExpiryEngine } from './engines/expiry.engine.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ServerError]', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred. Please try again.',
  });
});

// Start Background Engine Loops (Simulated 10s Scheduler & Expiry Ticks)
setInterval(async () => {
  try {
    await RequestSchedulingEngine.runSchedulerLoop();
    await ExpiryEngine.tick();
    await ExpiryEngine.processAlertEvents();
  } catch (err) {
    console.error('[EngineLoopError]', err);
  }
}, config.scheduler.loopIntervalSeconds * 1000);

const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(`  BloodResource Sharing System Backend Listening on Port ${PORT}`);
  console.log(`  Mode: Priority-Driven Multi-Hospital Academic Engine System`);
  console.log(`  Supabase Connection: Supported via DB Adapters & Environment`);
  console.log(`================================================================`);
});
