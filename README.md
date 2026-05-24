# API Control - Vimovies

Backend API para vimovies.com con soporte para WebSocket y REST.

## Configuración para Render

### Variables de Entorno
En Render, configura las siguientes variables de entorno:

- PORT - Render asigna automáticamente (deja vacío o usa 3000)
- SUPABASE_URL - URL de tu proyecto Supabase
- SUPABASE_ANON_KEY - Clave anónima de Supabase
- NODE_ENV - production

### Build Command
\\\ash
npm install
\\\

### Start Command
\\\ash
npm start
\\\

## Desarrollo Local

1. Copia .env.example a .env
2. Configura las variables de entorno
3. Ejecuta:
\\\ash
npm run dev
\\\

## Características

- ? REST API con Hono
- ? WebSocket con Socket.io
- ? CORS configurado para www.vimovies.com y localhost
- ? Soporte para Supabase
- ? Jobs programados con node-cron
- ? Ejecución con tsx para ES modules