
// lib/schemas.ts
import { z } from "zod";

// Definimos el esquema de un pedido
export const pedidoSchema = z.object({
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  cantidad: z.number().min(1, "La cantidad debe ser al menos 1"),
});

// Definimos el esquema de un cliente con pedidos
export const clienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  pedidos: z.array(pedidoSchema).nonempty("Debe haber al menos un pedido"),
});

// Definimos el esquema principal con múltiples clientes
export const formSchema = z.object({
  clientes: z.array(clienteSchema).nonempty("Debe haber al menos un cliente"),
});

// Tipos derivados de los esquemas
export type PedidoInput = z.infer<typeof pedidoSchema>;
export type ClienteInput = z.infer<typeof clienteSchema>;
export type FormInput = z.infer<typeof formSchema>;