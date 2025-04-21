import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
    transports: [new winston.transports.Console()],
    exitOnError: false,
});

import * as db from './db.js';

/**
 * Search charging sessions for a given date in Vitals collection and store aggregate data in Sessions collection.
 *
 * @param {string} date ISO date of the form YYYY-MM-DD to search for charging sessions
 */
async function updateSessions(date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Get all vitals for the given day, sorted by timestamp
    const vitals = await db.Vitals.find({
        createdAt: {
            $gte: dayStart,
            $lt: dayEnd,
        },
    })
        .sort({ createdAt: 1 })
        .exec();

    // aggregate charging sessions
    const sessions = [];
    let currentSession = {
        start_date: undefined,
        end_date: undefined,
        uptime_s: undefined,
        session_energy_wh: undefined,
    };

    // iterate through the query results
    vitals.forEach((vital) => {
        if (!currentSession.start_date || vital.uptime_s < currentSession.uptime_s || vital.session_energy_wh === 0) {
            // if we have no current session yet, or uptime is lower than the last one (i.e. wall connector lost
            // connection briefly), or energy is 0 (i.e. charging somehow restarted), we start a new session

            if (currentSession && currentSession.session_energy_wh > 0) {
                // store current session first if it's valid
                logger.info(
                    'finished charging session ' +
                        currentSession.start_date +
                        ' until ' +
                        currentSession.end_date +
                        ' with ' +
                        currentSession.session_energy_wh +
                        ' Wh',
                );
                sessions.push(currentSession);
            }

            // start new session
            currentSession = {
                start_date: vital.createdAt,
                end_date: vital.createdAt,
                uptime_s: vital.uptime_s,
                session_energy_wh: vital.session_energy_wh,
            };
        } else {
            // continue current session if it is still charging
            if (vital.session_energy_wh > currentSession.session_energy_wh) {
                currentSession.end_date = vital.createdAt;
                currentSession.uptime_s = vital.uptime_s;
                currentSession.session_energy_wh = vital.session_energy_wh;
            }
        }
    });

    // add current session if it exists unless it is continued the next day
    if (currentSession.start_date) {
        const endDate = new Date(currentSession.end_date);
        if (endDate.getHours() === 23 && endDate.getMinutes() >= 58) {
            logger.info('session continued tomorrow on ' + endDate);
        } else {
            logger.info(
                'finished final charging session ' +
                    currentSession.start_date +
                    ' until ' +
                    currentSession.end_date +
                    ' with ' +
                    currentSession.session_energy_wh +
                    ' Wh',
            );
            sessions.push(currentSession);
        }
    }

    // collect all promises for db updates
    const promises = [];
    if (sessions.length > 0) {
        // Store in database
        sessions.forEach(async (session) => {
            if (session.session_energy_wh) {
                promises.push(db.Session.replaceOne({ start_date: session.start_date }, session, { upsert: true }));
            } else {
                logger.info('skipping session with no energy data: ' + session.start_date);
            }
        });
    }

    // wait for all promises to finish
    await Promise.all(promises);
    logger.info('done, waiting to finish ...');
    db.disconnect();
}

const args = process.argv.slice(2);
const date = args[0]
logger.info('updating sessions for ' + date);
updateSessions(date);
