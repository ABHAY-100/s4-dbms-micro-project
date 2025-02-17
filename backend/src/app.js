import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import mortuaryRoutes from './routes/mortuaryRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(cookieParser());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/mortuary', mortuaryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
