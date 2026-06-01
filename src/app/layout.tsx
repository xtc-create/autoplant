import type { ReactNode } from "react";

export const metadata = {
  title: "AutoPlant",
  description: "ESP32 plant monitoring dashboard with live sensor data and plant AI.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
