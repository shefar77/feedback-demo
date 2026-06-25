import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { generateRouter } from './routes/generate';
import { submitRouter } from './routes/submit';
import { analyticsRouter } from './routes/analytics';
import { authRouter }      from './routes/auth';
import { dashboardRouter } from './routes/dashboard';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? '*', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));
// app.post('/generate-feedback', async (req, res) => {
//   console.log('HIT generate-feedback');

//   res.json({
//     suggestions: [
//       "Great experience!",
//       "Loved the service.",
//       "Could improve response time."
//     ]
//   });
// });

const limiter = rateLimit({
  windowMs: 60 * 1000,  
  max: 30,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/generate-feedback', limiter);
app.use('/auth',              authRouter);
app.use('/dashboard',         dashboardRouter);
app.use('/generate-feedback', generateRouter);
app.use('/submit-feedback',   submitRouter);
app.use('/analytics',         analyticsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));