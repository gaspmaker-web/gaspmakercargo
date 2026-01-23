# Recogida de paquetes — Resumen rápido

- Node 18+
- Copiar .env.example -> .env.local y rellenar DATABASE_URL y NEXTAUTH_SECRET
- Instalar dependencias: npm install
- Generar prisma client: npx prisma generate
- Crear migración (dev): npx prisma migrate dev --name init
- Ejecutar: npm run dev