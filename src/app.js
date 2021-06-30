import express from 'express';

import apiLogger from './api-logger.js';
import config from './config/app.js';

import v1Router from './v1-router.js';
import v2Router from './v2-router.js';

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(apiLogger);

app.use(`${config.pathPrefix}/v1`, v1Router);
app.use(`${config.pathPrefix}/v2`, v2Router);

app.use((request, response) => {
  response.status(404).send({message: 'Not found.'});
});

export {app as default};
