import express from 'express';
import morgan from 'morgan';

import config from './config/app.js';
import logger from './logger.js';
import router from './router.js';

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(morgan('combined', {stream: logger.stream}));

app.use(`${config.pathPrefix}/v1`, router);

app.use((request, response) => {
  response.status(404).send({message: 'Not found.'});
});

export {app as default};
