import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import bodyRoutes from './routes/bodyRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import billingRoutes from './routes/billingRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/bodies', bodyRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/billing', billingRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});