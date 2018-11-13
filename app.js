const express = require('express');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 3000;

const ifs = require('os').networkInterfaces();

const getIP = () => {
  const result = Object.keys(ifs)
    .map(x => ifs[x].filter(y => y.family === 'IPv4' && !x.internal)[0])
    .filter(x => x)[0].address;
  return result;
};

app.use(morgan('combined'));


app.get('/', (req, res) => {
  res.send(`<html><div style="text-align:center;"><h1>It works!</h1><p>server address ${getIP()}</p></div></html>`);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
