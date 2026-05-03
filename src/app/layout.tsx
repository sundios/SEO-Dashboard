import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AuthBanner from "@/components/layout/AuthBanner";
import { DataProvider } from "@/contexts/DataContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MotionGrid } from "@/components/scrollx/motion-grid-bg";
import { Toaster } from "sonner";

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-background/50 text-zinc-900 dark:text-zinc-50 transition-colors duration-200 overflow-x-hidden overflow-y-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <DataProvider>
            <Toaster position="top-right" richColors />
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
                <main className="flex-1 overflow-auto custom-scrollbar bg-gray-50 dark:bg-background text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
                  {/* <MotionGrid speed="3s" opacity={0.15} enableGlow={true} lineColor="20, 184, 166" className="relative h-[100vh] w-full flex flex-col items-center justify-center z-1"> */}
                  <div id="report-content" className="p-6">
                    {children}
                  </div>
                  {/* </MotionGrid> */}
                </main>
              </div>
            </div>
          </DataProvider>
        </ThemeProvider>
        
      </body>
    </html>
  );
}
