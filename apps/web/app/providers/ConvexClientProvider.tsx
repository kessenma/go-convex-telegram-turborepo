"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, ReactElement } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps): ReactElement {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
