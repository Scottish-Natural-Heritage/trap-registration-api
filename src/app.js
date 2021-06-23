import express from 'express';

import config from './config/app.js';
import router from './router.js';

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(`${config.pathPrefix}/v1`, router);

app.use((request, response) => {
  response.status(404).send({message: 'Not found.'});
});

export {app as default};
