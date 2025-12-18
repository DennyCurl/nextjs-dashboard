import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Філія ЦОЗ ДКВС України у Харківській та Луганській областях',
    default: 'Філія ЦОЗ ДКВС України у Харківській та Луганській областях',
  },
  description: 'The official Next.js Learn Dashboard built with App Router.',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
};

import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import ErrorHandler from '@/app/ui/error-handler';
import { RBACProvider } from '@/app/ui/rbac/rbac-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <RBACProvider>
          <ErrorHandler />
          {children}
        </RBACProvider>
      </body>
    </html>
  );
}
