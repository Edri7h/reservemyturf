// // utils/redisClient.ts
// import { createClient } from "redis";

// const redis = createClient();
// redis.connect().catch(console.error);

// export default redis;


// utils/redisClient.ts
import { createClient } from "redis";

const redis = createClient({
  url: "redis://localhost:6379", // Explicitly set for clarity
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

(async () => {
  try {
    await redis.connect();
  } catch (err) {
    console.error("Redis failed to connect:", err);
  }
})();

export default redis;
