"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { ProviderContextProvider } from "@/context/ProviderContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30000 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProviderContextProvider>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ProviderContextProvider>
    </QueryClientProvider>
  );
}
