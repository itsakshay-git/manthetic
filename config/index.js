const dotenv = require('dotenv');

dotenv.config();

const defaultCorsOrigins = [
  'http://localhost:5174',
  'https://manthetic-admin.vercel.app',
  'https://manthetic-storefront.vercel.app',
  'https://manthetic.onrender.com',
];

const parseList = (value, fallback) => {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigins: parseList(process.env.CORS_ORIGINS, defaultCorsOrigins),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};

const validateStartupConfig = () => {
  const required = {
    DATABASE_URL: config.databaseUrl,
    JWT_SECRET: config.jwtSecret,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const validateCloudinaryConfig = () => {
  const missing = [];
  if (!config.cloudinary.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!config.cloudinary.apiKey) missing.push('CLOUDINARY_API_KEY');
  if (!config.cloudinary.apiSecret) missing.push('CLOUDINARY_API_SECRET');

  if (missing.length) {
    throw new Error(`Missing Cloudinary environment variables: ${missing.join(', ')}`);
  }
};

module.exports = {
  config,
  validateStartupConfig,
  validateCloudinaryConfig,
};
