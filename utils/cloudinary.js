const cloudinary = require('cloudinary').v2;
const { config, validateCloudinaryConfig } = require('../config');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

cloudinary.ensureConfigured = validateCloudinaryConfig;

module.exports = cloudinary;
