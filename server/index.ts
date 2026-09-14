import { createApp } from "./app";
const { app, db } = createApp();
const server = app.listen(
  Number(process.env.PORT || 3001),
  process.env.HOST || "127.0.0.1",
  () => console.log(`Kotoba API ready on port ${process.env.PORT || 3001}`),
);
function stop() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
