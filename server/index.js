const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : '*',
}));
app.use(express.json({ limit: '100kb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'cartowl' });
});

const adminAuthRouter = require('./routes/admin-auth');
app.use('/api/admin', adminAuthRouter);

const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);

const publicRouter = require('./routes/public');
app.use('/api', publicRouter);

// Serve React in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Cartowl server running on port ${PORT}`);
  });
}

module.exports = app;
