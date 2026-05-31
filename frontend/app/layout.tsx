import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Feedback Portal',
  description: 'Effortless feedback collection with accurate suggestions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#f7f5f1] text-[#18160f] antialiased">
        {children}
      </body>
    </html>
  );
}