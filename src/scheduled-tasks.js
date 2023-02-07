// Use node-cron for scheduled tasks.
import cron from 'node-cron';

// Use to make HTTP calls.
import axios from 'axios';

import config from './config/app.js';

// Let us log structured messages to the console.
import jsonConsoleLogger, {unErrorJson} from './json-console-logger.js';

/**
 * Start up node-cron.
 */
const initScheduledJobs = () => {
  const scheduledJobFunction = cron.schedule('0 6 * * *', async () => {
    console.log('Triggering cron job(s).');

    // Get the date.
    const currentDate = new Date();

    // Tasks here.

    console.log('Ending cron job(s).');
  });

  scheduledJobFunction.start();
};

export {initScheduledJobs as default};
