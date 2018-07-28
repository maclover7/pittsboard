const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, '../public')));
app.get('/api/weather', require('./weather'));
app.get('/api/pabus', require('./pabus'));

module.exports = app;
