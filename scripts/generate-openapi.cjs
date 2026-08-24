const fs = require('node:fs');
const path = require('node:path');
const swaggerJSDoc = require('swagger-jsdoc');

const rootDirectory = path.resolve(__dirname, '..');
const document = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Movies API',
      version: '1.0.0',
      description: 'REST API for managing movies.',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local server' }],
  },
  apis: [
    path.join(rootDirectory, 'src/interfaces/rest/controllers/MovieController.ts'),
    path.join(rootDirectory, 'src/interfaces/rest/index.ts'),
  ],
});

fs.mkdirSync(path.join(rootDirectory, 'dist'), { recursive: true });
fs.writeFileSync(
  path.join(rootDirectory, 'dist/openapi.json'),
  `${JSON.stringify(document, null, 2)}\n`,
);