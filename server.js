// backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { calculateLeasing } = require('./calculator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Разрешить запросы с фронтенда
app.use(bodyParser.json());

// API Endpoint
app.post('/api/calculate', (req, res) => {
  try {
    const requestData = req.body;
    const result = calculateLeasing(requestData);
    
    // Форматируем результат для фронтенда
    const formattedResult = result.map(item => ({
      month: item.month,
      date: item.paymentDate,
      payment: item.monthlyPayment.withNds,
      principal: item.principalPayment.value,
      interest: item.interestPayment.value,
      balance: item.balance
    }));
    
    res.json({ success: true, data: formattedResult });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});