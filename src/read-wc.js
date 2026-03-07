import fetch from 'node-fetch';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

const TEST_MODE =
  process.argv.includes('--test-mode') ||
  process.argv.includes('--test') ||
  process.env.TEST_MODE === 'true';

if (TEST_MODE) {
  process.env.DB_CONNECT = 'false';
}

const BASE_URL = 'http://' + process.env.TESLAWC + '/api/1/';

async function getVitals() {
  logger.debug('reading vitals from wc ...');
  const response = await fetch(BASE_URL + 'vitals');
  logger.debug('done reading vitals');
  return response.json();
}

async function getLifetime() {
  logger.debug('reading lifetime from wc ...');
  const response = await fetch(BASE_URL + 'lifetime');
  logger.debug('done reading lifetime');
  return response.json();
}

async function readWallconnector() {
  const db = await import('./db.js');
  const [vitals, lifetime] = await Promise.all([getVitals(), getLifetime()]);

  if (TEST_MODE) {
    await Promise.all([new db.Vitals(vitals).validate(), new db.Lifetime(lifetime).validate()]);
    logger.info('test mode: wall connector payloads are schema-valid');
  } else {
    await Promise.all([db.Vitals.create(vitals), db.Lifetime.create(lifetime)]);
    logger.info('wall connector data written to database');
  }

  logger.info('done, waiting to finish ...');
  if (!TEST_MODE) {
    db.disconnect();
  }
}

readWallconnector();
