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
      <meta name='impact-site-verification' content='1acfc731-03a2-4b79-a466-fe21c9302873' />
      <script type="text/javascript" dangerouslySetInnerHTML={{__html: `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A7700354-b06a-445c-9312-cbc202b77b941.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`}} />
    </>
  )
}