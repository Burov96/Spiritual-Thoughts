import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SessionProviderWrapper from "./components/SessionProviderWrapper";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { NotificationProvider } from "./NotificationProvider";

const geistSans = localFont({
  src: "../public/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../public/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Spiritual Thoughts",
  description: "Share your spiritual thoughts and connect with others.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <SessionProviderWrapper>
          <NotificationProvider>
          <NavBar />
          <main className="flex-grow">{children}</main>
          <Footer />
          </NotificationProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
