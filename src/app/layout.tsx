import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

export const metadata: Metadata = {
  title: { default: "Padamshree Garments", template: "%s · Padamshree Garments" },
  description: "Choose clothes, receive a pickup token, and pay at collection.",
  icons: { icon: "/brand/padamshree-garments.png", apple: "/brand/padamshree-garments.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#8f1d2c" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
