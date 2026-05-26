// Load the config.
import config from './config/app.js';
// Let us log structured messages to the console.
import jsonConsoleLogger from './json-console-logger.js';
// Load the app.
import app from './app.js';
// eslint-disable-next-line import/order
import initScheduledJobs from './scheduled-tasks.js';

const process = require('node:process');

// Start up node-cron to handle any scheduled jobs.
initScheduledJobs();

// Run it.
app.listen(config.port, () => {
  if (process.env.NODE_ENV !== 'production') {
    jsonConsoleLogger.debug({message: `Server listening on http://localhost:${config.port}${config.pathPrefix}.`});
  }
});
