const fs = require('node:fs');
const path = require('node:path');
const swaggerJSDoc = require('swagger-jsdoc');

const rootDirectory = path.resolve(__dirname, '..');
const document = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Generic API',
      version: '1.0.0',
      description: 'Generic REST API for entity collections.',
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Google ID token issued to the configured web client.',
        },
      },
    },
    security: [{ BearerAuth: [] }],
    servers: [
        { url: 'http://localhost:3000', description: 'Development server' },
        { url: 'https://ipt-int-web-api.onrender.com', description: 'Production server' }
      ],
  },
  apis: [
    path.join(rootDirectory, 'src/interfaces/rest/controllers/GenericController.ts'),
    path.join(rootDirectory, 'src/interfaces/rest/index.ts'),
  ],
});

fs.mkdirSync(path.join(rootDirectory, 'dist'), { recursive: true });
fs.writeFileSync(
  path.join(rootDirectory, 'dist/openapi.json'),
  `${JSON.stringify(document, null, 2)}\n`,
);