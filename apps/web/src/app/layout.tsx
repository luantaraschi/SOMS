import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Unbounded } from 'next/font/google';
import './globals.css';

// Configuração em sync com tokens.css — DESIGN.md §3 e §8.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const unbounded = Unbounded({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'SOMS',
  description: 'todo mundo acha que sabe.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  // Body styling (background, color, font-family) vem de tokens.css — não duplicar.
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${unbounded.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
