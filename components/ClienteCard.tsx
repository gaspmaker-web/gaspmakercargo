"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Plus, Trash } from "lucide-react";

type Props = {
  index: number;
  remove: (index: number) => void;
};

export default function ClienteCard({ index, remove }: Props) {
  const { control, register, formState: { errors } } = useFormContext();

  const { fields, append, remove: removePedido } = useFieldArray({
    control,
    name: `clientes.${index}.pedidos`,
  });

  return (
    <Card className="mb-4">
      <CardContent className="space-y-4">
        <div>
          <Label>Nombre de cliente</Label>
          <Input {...register(`clientes.${index}.nombre` as const)} placeholder="Nombre y apellido" />
          {errors?.clientes?.[index]?.nombre && (
            <p className="text-xs text-red-600">El nombre es requerido.</p>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Pedidos</h4>
          {fields.map((field, pedidoIndex) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input
                placeholder="Descripción"
                {...register(`clientes.${index}.pedidos.${pedidoIndex}.descripcion` as const)}
              />
              <Input
                type="number"
                placeholder="Cantidad"
                {...register(`clientes.${index}.pedidos.${pedidoIndex}.cantidad` as const, {
                  valueAsNumber: true,
                })}
              />
              {/* 🚨 CORRECCIÓN: Usamos className para el color rojo en lugar de variant="destructive" */}
              <Button 
                type="button" 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removePedido(pedidoIndex)}
              >
                <Trash size={16} />
              </Button>
            </div>
          ))}

          <Button type="button" variant="secondary" onClick={() => append({ descripcion: "", cantidad: 1 })}>
            <Plus size={16} /> Añadir pedido
          </Button>
        </div>

        {/* 🚨 CORRECCIÓN: Igual aquí, color rojo manual */}
        <Button 
            type="button" 
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => remove(index)}
        >
          Eliminar cliente
        </Button>
      </CardContent>
    </Card>
  );
}






