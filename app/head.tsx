/**
 * Metadata global por defecto. Los layouts anidados pueden
 * ampliar/sobrescribir esta información.
 */
export default function Head() {
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content="Recogida de paquetes — app" />
      <link rel="icon" href="/favicon.ico" />
      <title>Recogida de paquetes</title>
    </>
  )
}