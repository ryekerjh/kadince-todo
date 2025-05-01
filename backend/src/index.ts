import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import todoRoutes from './routes/todoRoutes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api', todoRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
