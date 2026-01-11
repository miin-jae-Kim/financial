import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Macro Dashboard | Economic Indicators',
  description: 'Real-time macroeconomic indicators dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-terminal-bg antialiased">
        {children}
      </body>
    </html>
  );
}
