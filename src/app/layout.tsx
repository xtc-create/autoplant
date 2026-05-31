import type { ReactNode } from "react";

export const metadata = {
  title: "AutoPlant Dashboard",
  description: "Live ESP32 plant monitoring dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
