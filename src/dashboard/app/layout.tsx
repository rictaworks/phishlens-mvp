import type { ReactNode } from 'react';

export const metadata = {
  title: 'PhishLens ダッシュボード',
  description: 'PhishLens MVP 判定履歴・KPIダッシュボード',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
