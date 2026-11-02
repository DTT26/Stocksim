import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import tradingRoutes from './routes/tradingRoutes';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import simulationRoutes from './routes/simulation';
import assignmentRoutes from './routes/assignment';
import watchlistRoutes from './routes/watchlist';
import paperTradingRoutes from './routes/paperTrading';
import challengeRoutes from './routes/challengeRoutes';
import walletRoutes from './routes/walletRoutes';
import aiRoutes from './routes/aiRoutes';
import notificationRoutes from './routes/notification';
import lecturerApplicationRoutes from './routes/lecturerApplication';
import paymentRoutes from './routes/paymentRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import marketRoutes from './routes/marketRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

const app = express();

app.set('trust proxy', 1);

const rawAllowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173'
];

const allowedOrigins = rawAllowedOrigins
  .flatMap(url => (url ? url.split(',') : []))
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (requestOrigin, callback) => {
    // Cho phép request không có origin (curl, mobile, server-to-server)
    if (!requestOrigin) return callback(null, true);

    const cleanOrigin = requestOrigin.trim().replace(/\/+$/, '');

    const isExplicitlyAllowed = allowedOrigins.includes(cleanOrigin);
    const isLocal = cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1');
    const isVercel = /\.vercel\.app$/.test(cleanOrigin);
    const isRender = /\.onrender\.com$/.test(cleanOrigin);
    const isCustomDomain = /thanhtung2612\.id\.vn$/.test(cleanOrigin);

    if (isExplicitlyAllowed || isLocal || isVercel || isRender || isCustomDomain || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      // Trong web deploy, phản hồi origin động để cookie SameSite=None hoạt động trơn tru
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'stocksim-api' });
});

// Routes
app.use('/api/trade', tradingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/watchlists', watchlistRoutes);
app.use('/api/paper-trading', paperTradingRoutes);
app.use('/api/challenge', challengeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/lecturer-applications', lecturerApplicationRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/analytics', analyticsRoutes);

export default app;
