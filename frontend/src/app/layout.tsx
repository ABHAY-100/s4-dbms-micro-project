import type { Metadata } from "next";
import "./globals.css";
import ReactQueryProvider from "@/providers/ReactQueryProvider";

export const metadata: Metadata = {
  title: "DeathSet - Your badass mortuary sidekick!",
  description:
    "Ditch the mess, own the system, and manage it all like a boss. Mortuary management just got a serious upgrade—no fluff, all function.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
