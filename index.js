const dotenv = require('dotenv');
const app = require('./lib/server');

if (!process.env.NODE_ENV || (process.env.NODE_ENV && process.env.NODE_ENV !== 'production')) {
  dotenv.config();
}

app.listen(process.env.PORT || 3000, '0.0.0.0');
