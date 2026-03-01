import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "ClipVault - Automate Your Gaming Highlights",
  description: "Automatically deliver gaming highlights from CS2, Dota 2, League of Legends, and Fortnite directly to your Discord. Link your accounts and never miss a highlight again.",
  keywords: ["gaming", "highlights", "clips", "Discord", "CS2", "Dota 2", "League of Legends", "Fortnite", "automation"],
  authors: [{ name: "ClipVault" }],
  openGraph: {
    title: "ClipVault - Automate Your Gaming Highlights",
    description: "Automatically deliver gaming highlights directly to your Discord.",
    type: "website",
    siteName: "ClipVault",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipVault - Automate Your Gaming Highlights",
    description: "Automatically deliver gaming highlights directly to your Discord.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          poppins.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
