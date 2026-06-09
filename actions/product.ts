'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createProduct(formData: FormData) {
  const title = formData.get('title') as string;
  const price = formData.get('price') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const affiliateUrl = formData.get('affiliateUrl') as string;
  const category = formData.get('category') as string;

  await prisma.amazonProduct.create({
    data: {
      title,
      price,
      imageUrl,
      affiliateUrl,
      category,
      isActive: true,
    },
  });

  revalidatePath('/[locale]/miami-locker'); // Esto actualiza tu web automáticamente al guardar
}