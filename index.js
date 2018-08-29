const app = require('./lib/server');
require('dotenv').config();

app.listen(process.env.PORT || 3000);
