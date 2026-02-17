const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'cartowl' });
});

const adminAuthRouter = require('./routes/admin-auth');
app.use('/api/admin', adminAuthRouter);

const publicRouter = require('./routes/public');
app.use('/api', publicRouter);

// Serve React in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Cartowl server running on port ${PORT}`);
  });
}

module.exports = app;
