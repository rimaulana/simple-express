const express = require('express');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 3000;


app.use(morgan('combined'));


app.get('/', (req, res) => {
  res.send('<html><h1 style="text-align:center;">It works!</h1></html>');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
