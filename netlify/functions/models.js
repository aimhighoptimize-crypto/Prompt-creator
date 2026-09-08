import { listAdapters } from "../../server/adapters/index.js";

export default async () => {
  return new Response(JSON.stringify(listAdapters()), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/models" };
