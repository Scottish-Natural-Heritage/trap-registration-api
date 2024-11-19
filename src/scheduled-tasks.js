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

    const promises = [];

    // Each day check for expired licences that do not have a renewal done and send out reminder.
    promises.push(
      axios.post(`http://localhost:${config.port}${config.pathPrefix}/v2/expired-licence-no-renewals-reminder`)
    );

    if (currentDate.getDate() === 1) {
      // Check for expired licences of meat bait users that did not submit a return, on the 1st of every month.
      promises.push(
        axios.post(`http://localhost:${config.port}${config.pathPrefix}/v2/expired-licence-no-returns-reminder`)
      );

      // Check for valid licences of meat bait users that did not submit a return the previous year,
      // on the 1st of February and 1st of March.
      if (currentDate.getMonth() === 1 || currentDate.getMonth() === 2) {
        promises.push(
          axios.post(
            `http://localhost:${config.port}${config.pathPrefix}/v2/valid-licence-no-returns-previous-year-reminder`
          )
        );
      }

      // Check for valid licences of meat bait users that did not submit a return, on the 1st of April.
      if (currentDate.getMonth() === 3) {
        promises.push(
          axios.post(`http://localhost:${config.port}${config.pathPrefix}/v2/valid-licence-no-returns-reminder`)
        );
      }

      // Check for valid licences of meat bait users, on the 1st of December.
      if (currentDate.getMonth() === 11) {
        promises.push(
          axios.post(`http://localhost:${config.port}${config.pathPrefix}/v2/valid-licence-returns-due-reminder`)
        );
      }
    }

    try {
      await Promise.all(promises);
    } catch (error) {
      jsonConsoleLogger.error(unErrorJson(error));
    }

    console.log('Ending cron job(s).');
  });

  scheduledJobFunction.start();
};

export {initScheduledJobs as default};
