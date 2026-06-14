const { Pool } = require('pg');
const { config } = require('../config');

const getDatabaseConfig = () => {
  if (config.databaseUrl) {
    return {
      connectionString: config.databaseUrl,
      ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
    };
  }

  return {
    user: process.env.PGUSER,
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'manthetic',
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432', 10),
  };
};

const poolConfig = getDatabaseConfig();
const pool = new Pool(poolConfig);

module.exports = pool;
