// app/api/auth/[...nextauth]/route.ts
// Este archivo ahora solo re-exporta los handlers de tu archivo auth.ts

import { handlers } from "@/auth"; // Importa 'handlers' desde tu auth.ts
export const { GET, POST } = handlers;


