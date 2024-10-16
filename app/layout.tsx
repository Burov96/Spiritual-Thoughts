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
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen max-h-screen bg-slate-300 text-slate-900 dark:bg-slate-900 dark:text-slate-100`}>
        <SessionProviderWrapper>
          <NotificationProvider>
            <div className="flex flex-col h-screen overflow-hidden">
              <NavBar />
              <main className="flex-grow  px-4 py-6 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
              <Footer />
            </div>
          </NotificationProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
