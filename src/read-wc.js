import fetch from 'node-fetch';
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss:SSS',
                }),
                winston.format.printf(
                    (info) =>
                        `${info.timestamp} ${info.level}: ${info.message}` +
                        (info.splat !== undefined ? `${info.splat}` : ' '),
                ),
            ),
        }),
    ],
    exitOnError: false,
});

import * as db from './db.js';

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
    const writes = [];
    writes.push(db.Vitals.create(await getVitals()));
    writes.push(db.Lifetime.create(await getLifetime()));
    await Promise.all(writes);
    logger.info(writes);

    logger.info('done, waiting to finish ...');
    db.disconnect();
}

readWallconnector();
