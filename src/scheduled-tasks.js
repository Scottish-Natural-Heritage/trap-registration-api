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

    // Check for valid licences of meat bait users, on the 1st of December.
    if (currentDate.getDate() === 1 && currentDate.getMonth() === 11) {
      try {
        await axios.post(`http://localhost:${config.port}${config.pathPrefix}/v2/valid-licence-returns-due-reminder`);
      } catch (error) {
        jsonConsoleLogger.error(unErrorJson(error));
      }
    }

    // Check for valid licences of meat bait users that did not submit a return the previous year,
    // on the 1st of February and 1st of March.
    if (currentDate.getDate() === 1 && (currentDate.getMonth() === 1 || currentDate.getMonth() === 2)) {
      try {
        await axios.post(`http://localhost:${config.port}${config.pathPrefix}/v2/valid-licence-no-returns-previous-year-reminder`);
      } catch (error) {
        jsonConsoleLogger.error(unErrorJson(error));
      }
    }

    // Check for valid licences of meat bait users that did not submit a return, on the 1st of April.
    if (currentDate.getDate() === 1 && currentDate.getMonth() === 3) {
      try {
        await axios.post(`http://localhost:${config.port}${config.pathPrefix}/v2/valid-licence-no-returns-reminder`);
      } catch (error) {
        jsonConsoleLogger.error(unErrorJson(error));
      }
    }

    // Check for expired licences of meat bait users that did not submit a return, on the 1st of every month.
    if (currentDate.getDate() === 1) {
      try {
        await axios.post(`http://localhost:${config.port}${config.pathPrefix}/v2/expired-licence-no-returns-reminder`);
      } catch (error) {
        jsonConsoleLogger.error(unErrorJson(error));
      }
    }

    console.log('Ending cron job(s).');
  });

  scheduledJobFunction.start();
};

export {initScheduledJobs as default};
