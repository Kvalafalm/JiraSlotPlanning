import express, { Express, Request, Response } from 'express';
import config from 'config';
import issueRouter from './server/core/issue/issue-routes.js';
import errorMiddleware from './server/middleware/error.middleware';
import swaggerUi from 'swagger-ui-express';
import swDocument from './swagger.json';

const app: Express = express();
const PORT: number = config.get('port') || 5000;

app.use(express.json());
app.use('/api/v1/issue', issueRouter);
app.use(errorMiddleware);
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swDocument)
);

async function start() {
  app.listen(PORT, () =>
    console.log(`App has been started on port ${PORT}...`)
  );
}

start();