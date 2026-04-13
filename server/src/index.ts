import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";

dotenv.config();

const app = Fastify({ logger: true });

app.register(cors, { origin: true });

app.get("/health", async () => ({ status: "cooking", aura: "immaculate" }));

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: "0.0.0.0" });
    console.log("Aurate API is live fr fr");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
