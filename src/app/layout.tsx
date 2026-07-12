import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const geistSans=Geist({variable:"--font-geist-sans",subsets:["latin"]});
const geistMono=Geist_Mono({variable:"--font-geist-mono",subsets:["latin"]});

export const metadata:Metadata={
  title:{default:"福岡 8/2–8/6｜旅行手冊",template:"%s｜福岡旅行手冊"},
  description:"2026 福岡五天四夜旅行手冊：今日行程、清單、交通與緊急資訊。",
  applicationName:"福岡旅行手冊",
  appleWebApp:{capable:true,statusBarStyle:"default",title:"福岡旅行"},
  formatDetection:{telephone:true},
};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#f4efe5"};

export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-Hant" className={`${geistSans.variable} ${geistMono.variable}`}><body><AppShell>{children}</AppShell></body></html>}
