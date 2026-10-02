import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Escuta — Qual é a música?', description: 'Reconheça uma música em 0,1 segundo. Ouça, tente e libere mais tempo quando precisar.', icons: {icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR" className="dark"><body>{children}</body></html>}
