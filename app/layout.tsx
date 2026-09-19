import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/newsreader';
import '@fontsource-variable/newsreader/wght-italic.css';
import '@fontsource/instrument-serif';
import '@fontsource-variable/jetbrains-mono';
import { APP_NAME } from '@/lib/brand';
import './globals.css';

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'A calm, general-purpose AI assistant.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full overflow-hidden text-[15px] antialiased">{children}</body>
    </html>
  );
}


