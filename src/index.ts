import { app } from "./app";

app.listen({
  hostname: "0.0.0.0",
  port: process.env.PORT || 3000,
});

console.log(`📖 Quran API running at http://localhost:${app.server?.port}`);
