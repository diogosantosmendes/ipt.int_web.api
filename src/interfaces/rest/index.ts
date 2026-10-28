import express, { Express, NextFunction, Request, Response } from 'express';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import UseCases from '../../application/use-cases';
import { initControllers } from './controllers';
import createRoutes from './routes';
import { Server } from 'http';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import { createGoogleAuthMiddleware, loadGoogleAuthConfig } from './auth/googleAuth';

const port = Number(process.env.PORT) || 3000;
const openApiDocument = JSON.parse(readFileSync(path.join(__dirname, 'openapi.json'), 'utf8'));

export function initRestApp(useCases: UseCases): Server {
  const app = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.set('query parser', 'extended');
  const controllers = initControllers(useCases);

  app.use(express.json());
  /**
   * @openapi
   * /openapi.json:
   *   get:
   *     summary: Get the OpenAPI specification
   *     security: []
   *     responses:
   *       200:
   *         description: OpenAPI specification
   */
  app.get('/openapi.json', (_request, response) => {
    response.json(openApiDocument);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use((_request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Check API health
   *     security: []
   *     responses:
   *       200:
   *         description: API is available
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthResponse'
   */
  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });
  app.use(createRoutes(controllers, createGoogleAuthMiddleware(loadGoogleAuthConfig())));

  app.use((_request, response) => {
    response.status(404).json({ error: 'Route not found' });
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    response.status(400).json({
      error: error instanceof Error ? error.message : 'Bad request',
    });
  });

  const server = app.listen(port, () => {
    console.log(`Generic API running at http://localhost:${port}`);
  });

  return server;
}