const fs = require('fs');

const cleanupLocalFile = (filePath) => {
  if (!filePath) return;

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to clean up upload file:', error.message);
  }
};

const cleanupLocalFiles = (files = []) => {
  files.forEach((file) => cleanupLocalFile(file?.path || file));
};

module.exports = {
  cleanupLocalFile,
  cleanupLocalFiles,
};
