import { makeItemCollectionRoute } from "@/lib/itemCrud";

export const dynamic = "force-dynamic";

export const { GET, POST } = makeItemCollectionRoute("improvements");
