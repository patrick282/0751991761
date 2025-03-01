
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('WhatsApp Bot is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Keep-alive server listening at http://0.0.0.0:${port}`);
});

module.exports = app;
