import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CometChatProvider as CometChatAppProvider, CometChatProvider } from "@/app/context/CometChatContext";
import '@cometchat/chat-uikit-react/css-variables.css';


export const metadata: Metadata = {
  title: "Therapy Platform - Your Journey to Wellness",
  description: "A calm, welcoming therapy platform for your healing journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CometChatProvider>
          <Navbar />
          {children}
          <Footer />
        </CometChatProvider>
      </body>
    </html>
  );
}

