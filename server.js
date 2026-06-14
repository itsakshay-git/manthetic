const app = require('./app');
const { config, validateStartupConfig } = require('./config');

validateStartupConfig();

const PORT = config.port;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
