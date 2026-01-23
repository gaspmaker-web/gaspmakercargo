import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

type Caja = {
  peso_lbs?: number;
  largo_in?: number;
  ancho_in?: number;
  alto_in?: number;
};

type Pedido = {
  descripcion?: string;
  cantidad?: number;
  cajas?: Caja[];
};

type Cliente = {
  nombre: string;
  email?: string;
  whatsapp?: string;
  direccionDropoff?: string;
  pedidos: Pedido[];
};

type NewOrder = {
  clientes: Cliente[];
  total?: number;
};

const mem: { orders: Array<{ id: string; createdAt: string; data: NewOrder }> } = {
  orders: [],
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NewOrder;

    // Validaciones mínimas
    if (!body?.clientes?.length) {
      return NextResponse.json(
        { error: "Debe enviar al menos un cliente" },
        { status: 400 }
      );
    }

    const id = randomUUID();
    mem.orders.push({
      id,
      createdAt: new Date().toISOString(),
      data: body,
    });

    // Devolvemos el ID para usarlo como referenceId en Square
    return NextResponse.json({ ok: true, orderId: id });
  } catch (err: any) {
    console.error("Error guardando pedido:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error guardando pedido" },
      { status: 500 }
    );
  }
}
