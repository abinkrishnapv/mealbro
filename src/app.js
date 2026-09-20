'use strict';

const express = require('express');

const driverRouter = require('./routes/driver');
const adminRouter = require('./routes/admin');

const app = express();

app.use(express.json());

app.use('/api/driver', driverRouter);
app.use('/api/admin', adminRouter);

app.use((req, res) =>
  res.status(404).json({
    error: {
      message: 'Unknown route.',
    },
  })
);

app.use((err, req, res, next) => {
  console.error('--- REQUEST ERROR ---');
  console.error(err);
  console.error('---------------------');

  res.status(err.status || 500).json({
    error: {
      message: err.message,
      name: err.name,
    },
  });
});

module.exports = app;