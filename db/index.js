const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'manthetic', // make sure this DB exists
  password: 'admin',
  port: 5432,
});

module.exports = pool;
