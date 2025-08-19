const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

// Parse database connection from environment variables
const getDatabaseConfig = () => {

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Fallback to local development
  return {
    user: 'postgres',
    host: 'localhost',
    database: 'manthetic',
    password: 'admin',
    port: 5432,
  };
};

const config = getDatabaseConfig();
const pool = new Pool(
  typeof config === 'string'
    ? {
      connectionString: config,
      ssl: false
    }
    : config
);

module.exports = pool;
