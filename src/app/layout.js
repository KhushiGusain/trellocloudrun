import { Geist, Geist_Mono } from "next/font/google";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { PresenceProvider } from '@/contexts/PresenceContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Mini Trello",
  description: "A modern task management app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nunitoSans.variable} antialiased`}
      >
        <AuthProvider>
          <PresenceProvider>
            <WorkspaceProvider>
              {children}
            </WorkspaceProvider>
          </PresenceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
