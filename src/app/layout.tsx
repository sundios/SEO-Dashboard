import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AuthBanner from "@/components/layout/AuthBanner";
import { DataProvider } from "@/contexts/DataContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GSC Analytics Dashboard",
  description: "Google Search Console Analytics Dashboard with Advanced Insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <DataProvider>
          {/* Authentication Banner */}
          <AuthBanner />
          
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <Header />
              
              {/* Page Content */}
              <main className="flex-1 overflow-auto bg-gray-50">
                <div className="p-6">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
