import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";

// Display: Fraunces — a characterful, slightly old-style serif for the wordmark
// and hero moments. Body/UI: Hanken Grotesk — clean, warm, not Inter.
const display = Fraunces({
  variable: "--font-display-var",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const sans = Hanken_Grotesk({
  variable: "--font-sans-var",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-mono-var",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Handoff — the client workspace that kills the email chase",
  description: "One link, everything you need from your clients, in your brand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="bg-grain min-h-full flex flex-col">{children}</body>
    </html>
  );
}
