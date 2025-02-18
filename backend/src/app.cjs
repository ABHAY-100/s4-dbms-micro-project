const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes.cjs');
const mortuaryRoutes = require('./routes/mortuaryRoutes.cjs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "https://s4-dbms-micro-project.onrender.com",
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
