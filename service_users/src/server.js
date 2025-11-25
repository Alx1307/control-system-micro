const express = require('express');
const cors = require('cors');
const formatResponse = require('./middleware/responseFormatter');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requestLogger = require('./middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(formatResponse);
app.use(requestLogger);

app.get('/v1/users/health', (req, res) => {
  res.success({
    status: 'OK',
    service: 'Users Service',
    timestamp: new Date().toISOString()
  });
});

app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервис пользователей запущен на порту ${PORT}`);
});