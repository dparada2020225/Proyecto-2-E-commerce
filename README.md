# 🛒 Proyecto 2 — Sistema de Gestión de Tienda

Aplicación web fullstack para gestionar inventario, clientes y ventas de una tienda. Desarrollada para el curso **cc3062 - Sistemas y Tecnologías Web**, Universidad del Valle de Guatemala, Ciclo 1 2026.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL 15 |
| Autenticación | express-session + bcryptjs |
| Infraestructura | Docker + Docker Compose |

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- No se requiere Node.js, PostgreSQL ni ninguna otra dependencia local

---

## Levantar el proyecto desde cero

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd proyecto2

# 2. Crear los archivos de variables de entorno
cp .env.example .env
cp frontend/.env.example frontend/.env

# 3. Levantar toda la infraestructura
docker compose up --build
```

La base de datos se inicializa automáticamente con tablas y datos de prueba al primer arranque.

### URLs de acceso

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| PostgreSQL | localhost:5432 |

---

## Credenciales

### Base de datos (fijas para calificación)
| Campo | Valor |
|-------|-------|
| Usuario | `proy2` |
| Contraseña | `secret` |
| Base de datos | `tienda` |

### Aplicación web (login)
| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `admin123` |

---

## Documentación de la API REST

Todos los endpoints requieren sesión activa (cookie de sesión) excepto los de autenticación.
Base URL: `http://localhost:3001/api`

### Autenticación

| Método | Endpoint | Body | Respuesta |
|--------|----------|------|-----------|
| POST | `/auth/login` | `{ "usuario": "admin", "password": "admin123" }` | `{ "mensaje": "Login exitoso", "usuario": { "id", "usuario", "nombre" } }` |
| POST | `/auth/logout` | — | `{ "mensaje": "Sesión cerrada" }` |
| GET | `/auth/me` | — | `{ "usuario": { "id", "usuario", "nombre" } }` o `401` |

### Productos

| Método | Endpoint | Body | Respuesta |
|--------|----------|------|-----------|
| GET | `/productos` | — | Lista de productos con categoría y proveedor (JOIN) |
| GET | `/productos/bajo-stock` | — | Productos con stock menor al promedio (Subquery) |
| GET | `/productos/categorias` | — | Lista de categorías |
| GET | `/productos/proveedores` | — | Lista de proveedores |
| POST | `/productos` | `{ "nombre", "precio", "stock", "id_categoria", "id_proveedor" }` | Producto creado `201` |
| PUT | `/productos/:id` | `{ "nombre", "precio", "stock", "id_categoria", "id_proveedor" }` | Producto actualizado |
| DELETE | `/productos/:id` | — | `{ "mensaje": "Producto eliminado" }` |

### Clientes

| Método | Endpoint | Body | Respuesta |
|--------|----------|------|-----------|
| GET | `/clientes` | — | Lista de todos los clientes |
| GET | `/clientes/con-ventas` | — | Clientes con al menos una venta (Subquery IN) |
| POST | `/clientes` | `{ "nombre", "correo" }` | Cliente creado `201` |
| PUT | `/clientes/:id` | `{ "nombre", "correo" }` | Cliente actualizado |
| DELETE | `/clientes/:id` | — | `{ "mensaje": "Cliente eliminado" }` |

### Ventas

| Método | Endpoint | Body | Respuesta |
|--------|----------|------|-----------|
| GET | `/ventas` | — | Lista de ventas con cliente y empleado (JOIN) |
| GET | `/ventas/empleados` | — | Lista de empleados |
| GET | `/ventas/:id/detalle` | — | Detalle de una venta con productos (JOIN) |
| POST | `/ventas` | `{ "id_cliente", "id_empleado", "detalle": [{ "id_producto", "cantidad", "precio_unitario" }] }` | `{ "mensaje": "Venta registrada", "id_venta" }` — con transacción explícita y descuento de stock |

### Reportes

| Método | Endpoint | Body | Respuesta |
|--------|----------|------|-----------|
| GET | `/reportes/ventas-totales` | — | Total por venta usando VIEW `reporte_ventas` |
| GET | `/reportes/cte-ventas` | — | Ventas totales por cliente ordenadas por monto (CTE WITH) |
| GET | `/reportes/clientes-frecuentes` | — | Clientes con más de 1 venta (GROUP BY + HAVING) |

### Códigos de error

| Código | Significado |
|--------|-------------|
| 400 | Datos inválidos o stock insuficiente |
| 401 | No autenticado |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

Todos los errores retornan `{ "error": "descripción del error" }`.

---

## Estructura del proyecto

proyecto2/
├── docker-compose.yml
├── .env.example
├── db/
│   ├── ddl.sql          # Esquema + índices + vista + usuario admin
│   └── scriptDatos.sql  # 25+ registros por tabla
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js         # Servidor + sesión + middleware auth
│       ├── db.js            # Pool de conexión PostgreSQL
│       └── routes/
│           ├── auth.js      # login, logout, /me
│           ├── productos.js # CRUD + JOIN + Subquery
│           ├── clientes.js  # CRUD + Subquery IN
│           ├── ventas.js    # CRUD + JOIN + Transacción
│           └── reportes.js  # VIEW + CTE + GROUP BY/HAVING
└── frontend/
├── Dockerfile
├── .env.example
├── package.json
└── src/
├── App.jsx          # AuthContext + rutas protegidas
├── main.jsx
├── index.css        # Tema oscuro/claro con CSS variables
└── pages/
├── Login.jsx
├── Productos.jsx
├── Clientes.jsx
├── Ventas.jsx
└── Reportes.jsx

---

## Funcionalidades implementadas

### CRUD
- **Productos**: crear, editar, eliminar — con categoría y proveedor
- **Clientes**: crear, editar, eliminar

### Técnicas SQL visibles en la UI
| Técnica | Dónde se usa |
|---------|-------------|
| JOIN (3) | Productos con categoría/proveedor · Ventas con cliente/empleado · Detalle de venta con productos |
| Subquery IN | Clientes con ventas registradas |
| Subquery en WHERE | Productos con stock menor al promedio |
| GROUP BY + HAVING | Clientes frecuentes (más de 1 venta) |
| CTE — WITH | Ventas totales por cliente ordenadas por monto |
| VIEW | `reporte_ventas` — total por venta |
| Transacción explícita | Registro de venta: BEGIN / INSERT / UPDATE stock / COMMIT — con ROLLBACK si stock insuficiente |

### Avanzado
- **Autenticación**: login/logout con sesión persistida en PostgreSQL (`express-session` + `connect-pg-simple`)
- **Exportar CSV**: botón en cada reporte (ventas, clientes frecuentes, bajo stock)
- **Modo oscuro / claro**: toggle en el nav, preferencia guardada en `localStorage`

---

## Detener y limpiar

```bash
# Detener los contenedores
docker compose down

# Detener Y borrar la base de datos (para reiniciar desde cero)
docker compose down -v
```

---

## Variables de entorno

### `.env` (raíz)
```env
DB_USER=proy2
DB_PASSWORD=secret
DB_NAME=tienda
DB_HOST=db
DB_PORT=5432
PORT=3001
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:3001/api
```