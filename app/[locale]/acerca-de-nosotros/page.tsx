import AboutClient from './AboutClient';

// 👇 AQUÍ SÍ FUNCIONARÁ.
// Al ser un Server Component, Next.js obedece esta instrucción antes de renderizar nada.
export const dynamic = 'force-dynamic';

export default function AboutPage() {
    return <AboutClient />;
}