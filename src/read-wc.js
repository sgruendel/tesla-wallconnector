'use strict';

const fetch = require('node-fetch');
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
    exitOnError: false,
});

const db = require('./db');

const BASE_URL = 'http://192.168.7.131/api/1/';

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
    const writes = [];
    writes.push(db.Vitals.create(await getVitals()));
    writes.push(db.Lifetime.create(await getLifetime()));
    await Promise.all(writes);
    logger.info(writes);

    logger.info('done, waiting to finish ...');
    db.disconnect();
}

readWallconnector();
