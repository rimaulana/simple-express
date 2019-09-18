const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const mjson = require('morgan-json');
const fs = require('fs');

const app = express();
const metadataURL = 'http://169.254.170.2/v2/metadata/';
const port = process.env.PORT || 3000;
const timeout = 1000;
let taskID = '';
let serverIP = '';
const startTime = Math.floor(new Date() / 1000);

morgan.token('task-id', () => taskID);

morgan.token('server-ip', () => serverIP);

const getServerInfo = async () => {
  try {
    if (process.env.ECS_CONTAINER_METADATA_FILE) {
      const metadata = JSON.parse(fs.readFileSync(process.env.ECS_CONTAINER_METADATA_FILE));
      taskID = metadata.TaskARN;
      serverIP = metadata.HostPrivateIPv4Address;
    }
    const res = await axios.get(metadataURL, { timeout });
    // eslint-disable-next-line prefer-destructuring
    serverIP = res.data.Containers[0].Networks[0].IPv4Addresses[0];
    // support for fargate task
    taskID = res.data.TaskARN;
    return { id: taskID, ip: serverIP };
  } catch (error) {
    // Added support running as Kubernetes pod
    if (process.env.SERVER_IP) {
      serverIP = process.env.SERVER_IP
    }
    if (process.env.POD_ID) {
      taskID = process.env.POD_ID
    }
    return { id: taskID, ip: serverIP };
  }
};

const logFormat = mjson({
  'task-id': ':task-id',
  'server-ip': ':server-ip',
  'remote-address': ':remote-addr',
  time: ':date[iso]',
  method: ':method',
  url: ':url',
  'http-version': ':http-version',
  'status-code': ':status',
  'content-length': ':res[content-length]',
  'response-time': ':response-time',
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
  const duration = parseInt(req.params.time, 10);
  const currentTime = Math.floor(new Date() / 1000);
  if ((currentTime - startTime) >= duration) {
    res.status(200).json({ status: 'ok' });
  } else {
    res.status(500).json({ status: 'not ready' });
  }
});

app.listen(port, () => {
  getServerInfo()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log(`Server started on port ${port}`);
    });
});
