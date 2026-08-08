import { DiscoveryProvider } from "@/components/discovery-v2/engine/DiscoveryProvider";

export default function DiscoveryV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <DiscoveryProvider>
      {children}
    </DiscoveryProvider>
  );
}
