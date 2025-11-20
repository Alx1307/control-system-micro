const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');
const formatResponse = require('./middleware/responseFormatter');

const app = express();
const PORT = process.env.PORT || 8001;
 
app.use(cors());
app.use(express.json());
app.use(formatResponse);

app.use('/v1/orders', orderRoutes);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'Orders service is running',
      timestamp: new Date().toISOString()
    }
  });
});

app.use((err, req, res, next) => {
  console.error('[SERVER_ERROR]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Маршрут не найден'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Orders service running on port ${PORT}`);
});