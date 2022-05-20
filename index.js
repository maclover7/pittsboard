const app = require('./lib/server');

if (!process.env.NODE_ENV || (process.env.NODE_ENV && process.env.NODE_ENV !== "production")) {
  require('dotenv').config();
}

app.listen(process.env.PORT || 3000);
