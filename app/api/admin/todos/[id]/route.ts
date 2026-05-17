import { makeItemIdRoute } from "@/lib/itemCrud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = makeItemIdRoute("todos");
