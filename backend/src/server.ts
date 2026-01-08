import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL connection
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'invoicexrp',
  user: process.env.DB_USER || 'xrpuser',
  password: process.env.DB_PASSWORD || 'xrppass123',
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Routes
import authRoutes from './routes/auth';
import invoiceRoutes from './routes/invoice';
import marketplaceRoutes from './routes/marketplace';
import escrowRoutes from './routes/escrow';
import didRoutes from './routes/did';
import xrplRoutes from './routes/xrpl';

app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/did', didRoutes);
app.use('/api/xrpl', xrplRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'InvoiceXRP API is running' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});