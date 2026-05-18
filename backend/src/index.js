const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./db');

const productosRouter = require('./routes/productos');
const clientesRouter  = require('./routes/clientes');
const ventasRouter    = require('./routes/ventas');
const reportesRouter  = require('./routes/reportes');
const authRouter      = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ]
    if (!origin || allowed.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}));
app.use(express.json());

app.use(session({
  store: new pgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'tienda_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 8 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) return next();
  if (!req.session.usuario) return res.status(401).json({ error: 'No autenticado' });
  next();
});

app.use('/api/auth',      authRouter);
app.use('/api/productos', productosRouter);
app.use('/api/clientes',  clientesRouter);
app.use('/api/ventas',    ventasRouter);
app.use('/api/reportes',  reportesRouter);

app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));