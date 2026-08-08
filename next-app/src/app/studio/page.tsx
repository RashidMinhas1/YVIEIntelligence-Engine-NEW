import { getDb, libraryItemsTable } from "@/db";
import { localDb } from "@/lib/local-db";
import { StudioWorkspace } from "@/components/studio/studio-workspace";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  let libraryItems: any[] = [];
  try {
    const db = getDb();
    libraryItems = await db.select().from(libraryItemsTable);
  } catch (err) {
    // If the primary DB fails, fall back to the local in‑memory DB without noisy warnings
    libraryItems = localDb.getAll("libraryItems");
  }

  // Pass existing library items to the studio so it can render the Knowledge Panel
  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full bg-background">
      <StudioWorkspace libraryItems={libraryItems} />
    </div>
  );
}
