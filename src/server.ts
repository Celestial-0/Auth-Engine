import Fastify from "fastify";
import cors from "@fastify/cors";
import { auth } from "./auth.js";
import dotenv from "dotenv";
import { Buffer } from "node:buffer";
dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

const fastify = Fastify({
  logger: true,
});

/**
 * CORS
 */
await fastify.register(cors, {
  origin: (origin, cb) => {
    const allowed = process.env.ALLOWED_ORIGINS?.split(",") ?? [];
    if (!origin || allowed.includes(origin)) {
      cb(null, true);
      return;
    }
    cb(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
});


/**
 * Better Auth integration (FINAL & CORRECT)
 * Give Better Auth the raw request stream
 */

fastify.all("/api/auth/*", async (request, reply) => {
  const url = new URL(
    request.url,
    `${request.protocol}://${request.headers.host}`
  );

  // Check for application header requirement on sign-up and sign-in
  if (url.pathname.includes("/sign-up") || url.pathname.includes("/sign-in")) {
    const application = request.headers["x-application-name"] as string;
    
    if (!application) {
      reply.status(400);
      reply.send({
        error: "BAD_REQUEST",
        message: "x-application-name header is required"
      });
      return;
    }

    // For sign-up, inject the application field into the body
    if (url.pathname.includes("/sign-up") && request.body && typeof request.body === "object") {
      (request.body as any).application = application;
    }

    // For sign-in, we'll verify the application matches after authentication
    // This will be handled in a different way - we need to query the user first
  }

  // ✅ Safely convert body to JSON string if it exists
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : request.body !== undefined
        ? JSON.stringify(request.body)
        : undefined;

  const authRequest = new Request(url, {
    method: request.method,
    headers: request.headers as HeadersInit,
    body,
  });

  const response = await auth.handler(authRequest);

  reply.status(response.status);

  response.headers.forEach((value, key) => {
    reply.header(key, value);
  });

  // ✅ Safe: consume once, send once
  const text = await response.text();
  reply.send(text);
});


/**
 * Health check
 */
fastify.get("/health", async () => ({
  status: "ok",
  service: "auth-engine",
  timestamp: new Date().toISOString(),
}));

await fastify.ready();
console.log(fastify.printRoutes());


/**
 * Start server
 */
try {
  await fastify.listen({ port: PORT, host: "0.0.0.0" });
  fastify.log.info(`🔐 Auth service running on port ${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
