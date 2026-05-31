import type { ReactNode } from "react";

export const metadata = {
  title: "Paneli AutoPlant",
  description: "Panel i drejtpërdrejtë për monitorimin e bimës me ESP32",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sq">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
