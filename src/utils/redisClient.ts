import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL, // Keep it secure using .env
  socket: {
    tls: true,
    host:"current-shepherd-17388.upstash.io" // Important for Upstash
  },
});

redis.on("connect", () => {
  console.log(" Redis connected (Upstash)");
});

redis.on("error", (err) => {
  console.error(" Redis connection error:", err);
});

(async () => {
  try {
    await redis.connect();
  } catch (err) {
    console.error("Redis failed to connect:", err);
  }
})();

export default redis;
