const express = require('express'),
  config = require('config'),
  winston = require('winston'),
  cors = require('cors');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'server-side-events' },
  transports: [
    //new winston.transports.File({ filename: 'error.log', level: 'error' })
  ],
});
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

const donation = {
  user: 0,
  amount: 0,
};

const app = express();

app.use(express.json());
app.use(cors());

app.post('/donate', (req, res) => {
  const amount = req.body.amount || 0;

  if (amount > 0) {
    donation.amount += amount;
    donation.user += 1;
  }

  return res.json({ message: 'Thank you 🙏' });
});

app.set('port', process.env.PORT || config.get('port'));

const server = app.listen(app.get('port'), function () {
  logger.info('Express server listening on port ' + server.address().port);
});

const SEND_INTERVAL = 2000;

const writeEvent = (res, sseId, data) => {
  res.write(`id: ${sseId}\n`);
  res.write(`data: ${data}\n\n`);
};

const sendEvent = (req, res) => {
  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
  });

  const sseId = new Date().toDateString();

  setInterval(() => {
    writeEvent(res, sseId, JSON.stringify(donation));
  }, SEND_INTERVAL);

  writeEvent(res, sseId, JSON.stringify(donation));
};

app.get('/dashboard', (req, res) => {
  if (req.headers.accept === 'text/event-stream') {
    sendEvent(req, res);
  } else {
    res.json({ message: 'Ok' });
  }
});
