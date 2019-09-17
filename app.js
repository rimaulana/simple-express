const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const mjson = require('morgan-json');
const fs = require('fs');

const app = express();
const metadataURL = 'http://169.254.170.2/v2/metadata/';
const port = 4000;
const timeout = 1000;
let taskID = "";
let serverIP = "";
let startTime = Math.floor(new Date() / 1000);

morgan.token('task-id', () => {
  return taskID;
})

morgan.token('server-ip', () => {
  return serverIP;
})

const getServerInfo = async () => {
  try {
    if (process.env.ECS_CONTAINER_METADATA_FILE) {
      let metadata = JSON.parse(fs.readFileSync(process.env.ECS_CONTAINER_METADATA_FILE))
      taskID = metadata['TaskARN']
      serverIP = metadata['HostPrivateIPv4Address']
    }
    let res = await axios.get(metadataURL, { timeout })
    serverIP = res.data.Containers[0].Networks[0].IPv4Addresses[0]
    return { id: taskID, ip: serverIP }
  } catch (error) {
    return { id: taskID, ip: serverIP }
  }
}

const logFormat = mjson({
  'task-id': ':task-id',
  'server-ip': ':server-ip',
  'remote-address': ':remote-addr',
  time: ':date[iso]',
  method: ':method',
  url: ':url',
  'http-version': ':http-version', 'status-code': ':status',
  'content-length': ':res[content-length]', 'response-time': ':response-time',
  referrer: ':referrer',
  'user-agent': ':user-agent',
});

if (process.env.LOG_TYPE === 'json') {
  app.use(morgan(logFormat));
} else {
  app.use(morgan('combined'));
}

app.get('/', (req, res) => {
  res.status(200).json({ 'task-id': taskID, 'server-ip': serverIP });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/slow/:time', (req, res) => {
  let duration = parseInt(req.params.time, 10)
  let currentTime = Math.floor(new Date() / 1000);
  if ((currentTime - startTime) >= duration) {
    res.status(200).json({ status: 'ok' });
  } else {
    res.status(500).json({ status: 'not ready' })
  }
})

app.listen(port, () => {
  getServerInfo()
    .then(() => {
      console.log(`Server started on port ${port}`);
    })

});