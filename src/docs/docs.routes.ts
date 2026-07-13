import { Request, Response, Router } from 'express';
import openapiSpec from './openapi';

const router = Router();

// Swagger UI loaded from a CDN - works everywhere including Vercel
// (no static files to serve from our side)
const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RentNest API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      persistAuthorization: true,
    });
  </script>
</body>
</html>`;

router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(swaggerHtml);
});

router.get('/openapi.json', (req: Request, res: Response) => {
  res.json(openapiSpec);
});

export const DocsRoutes = router;
