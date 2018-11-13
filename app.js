const express = require('express');
const morgan = require('morgan');
const axios = require('axios');

const app = express();
const metadataURL = 'http://169.254.170.2/v2/metadata/';
const port = process.env.PORT || 3000;

app.use(morgan('combined'));

app.get('/', (req, res) => {
  axios.get(metadataURL)
    .then((result) => {
      res.send(`<html><div style="text-align:center;"><h1>It works!</h1><p>server address ${result.data.Containers[0].Networks[0].IPv4Addresses[0]}</p></div></html>`);
    })
    .catch((error) => {
      res.status(200).send(error.message);
    });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
