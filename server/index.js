const express = require('express');
const db = require('./db/config');
const route = require('./controllers/route');
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');

const fs = require('fs');
const path = require('path');

require('dotenv').config();

// Una promesa rechazada sin catch no debe tumbar el servidor (era el motivo de
// los reinicios con las consultas a Mongo de sesiones de Supabase).
process.on('unhandledRejection', (reason) => {
  console.error('[Nova CRM] Promesa rechazada sin manejar:', reason?.message || reason);
});

const port = process.env.PORT || 5001;

// Setup Express App
const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(compression());
app.use(bodyParser.json({ limit: '10mb' }));

// Set up CORS
app.use(
  cors({
    origin: '*',
    exposedHeaders: ['Authorization'],
  }),
);

// API Routes
app.use('/api', route);

// 404 limpio para la API (nunca debe caer en el index.html del front)
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Ruta de API no encontrada: ${req.originalUrl}` });
});

/**
 * Producción (Raspberry Pi): el mismo proceso de Node sirve el build de React.
 * La comprobación se hace por petición para poder compilar el cliente sin reiniciar.
 */
const clientBuild = path.join(__dirname, '..', 'client', 'build');
const clientIndex = path.join(clientBuild, 'index.html');

app.use(
  express.static(clientBuild, {
    index: false,
    maxAge: '7d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html') || filePath.endsWith('service-worker.js')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

app.get(/^(?!\/api).*/, (req, res) => {
  if (!fs.existsSync(clientIndex)) {
    return res.status(503).json({
      message:
        'La interfaz aún no está compilada. Ejecuta "npm run build" en la raíz del proyecto (o revisa el puerto del cliente en desarrollo).',
    });
  }

  res.setHeader('Cache-Control', 'no-cache');
  return res.sendFile(clientIndex);
});

if (fs.existsSync(clientIndex)) {
  console.log(`[Nova CRM] Sirviendo interfaz web desde ${clientBuild}`);
}

// Start server
const server = app.listen(port, () => {
  const protocol = process.env.HTTPS === 'true' || process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const { address } = server.address();
  const host = address === '::' ? '127.0.0.1' : address;
  console.log(`Server listening at ${protocol}://${host}:${port}/`);
});

// Connect to MongoDB
const DATABASE_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017';
const DATABASE = process.env.DB || 'Prolink';

db(DATABASE_URL, DATABASE);
