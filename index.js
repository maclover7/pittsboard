const app = require('./lib/server');
require('dotenv').load();

app.listen(process.env.PORT || 3000);
