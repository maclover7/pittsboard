const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, '../public')));
app.get('/api/weather', require('./weather'));
app.get('/api/pabus', require('./pabus'));
app.get('/api/pittbus', require('./pittbus'));
app.get('/ping', (req, res) => { res.status(200).end(); });

module.exports = app;
