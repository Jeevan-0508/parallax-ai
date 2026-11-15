import type { Metadata } from "next";
import "./globals.css";
import "./immersive.css";
import "./phase4.css";

export const metadata: Metadata = { title: "PARALLAX//AI — The Reality Fork Engine", description: "A fictional, deterministic resilience simulation." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
