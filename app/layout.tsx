"use client"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import { supabase } from "@/util/supabase/supabase";
import { useAuthStore } from "@/util/auth/auth";
import { useRouter } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Jot",
//   description: "You Ought to Jot it Down",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { setUser } = useAuthStore()
  const router = useRouter()
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session && session.user) {
          setUser(session.user)
        } else {
          setUser(undefined)
          router.push("/")
        }
      }
    )

    return () => {
      // teardown
      listener.subscription.unsubscribe()
    }
  }, [])
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

