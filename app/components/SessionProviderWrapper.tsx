"use client"

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

interface SessionProviderWrapperProps {
  children: ReactNode;
}

export default function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
