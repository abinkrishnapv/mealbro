'use strict';

require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./config/database');

const port = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();

    console.log('Database connection established.');

    app.listen(port, () => {
      console.log(`App running on :${port}`);
    });
  } catch (err) {
    console.error('Could not connect to the database:', err.message);
    process.exit(1);
  }
})();