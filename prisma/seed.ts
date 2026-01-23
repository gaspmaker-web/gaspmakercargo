import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await hash('123456', 12)

  // 1. ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gaspmakercargo.com' },
    update: { password: passwordHash, role: 'ADMIN' }, // Actualizamos password y rol
    create: {
      email: 'admin@gaspmakercargo.com',
      name: 'Super Admin',
      password: passwordHash, // Usamos la columna NUEVA
      role: 'ADMIN',
      suiteNo: 'GMC-ADMIN',
      countryCode: 'US'
    },
  })
  console.log({ admin })

  // 2. WAREHOUSE
  const warehouse = await prisma.user.upsert({
    where: { email: 'warehouse@gaspmakercargo.com' },
    update: { password: passwordHash, role: 'WAREHOUSE' },
    create: {
      email: 'warehouse@gaspmakercargo.com',
      name: 'Jefe de Almacén',
      password: passwordHash,
      role: 'WAREHOUSE',
      suiteNo: 'GMC-WH',
      countryCode: 'US'
    },
  })
  console.log({ warehouse })

  // 3. DRIVER (CHOFER) - ¡CORREGIDO!
  const driver = await prisma.user.upsert({
    where: { email: 'driver@gaspmakercargo.com' },
    update: { password: passwordHash, role: 'DRIVER' }, // Rol corregido a DRIVER
    create: {
      email: 'driver@gaspmakercargo.com',
      name: 'Chofer Principal',
      password: passwordHash,
      role: 'DRIVER', // <--- AQUI ESTA EL CAMBIO
      suiteNo: 'GMC-DRIVER',
      countryCode: 'US'
    },
  })
  console.log({ driver })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })