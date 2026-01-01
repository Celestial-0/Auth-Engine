import Fastify from "fastify";
import cors from "@fastify/cors";
import { auth, applicationContext, getUserByEmailAndApplication } from "./auth.js";
import dotenv from "dotenv";
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
  allowedHeaders: ['Content-Type', 'x-application-name', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

/**
 * Better Auth integration 
 * Give Better Auth the raw request stream
 */

fastify.all("/api/auth/*", async (request, reply) => {
  const url = new URL(
    request.url,
    `${request.protocol}://${request.headers.host}`
  );

  const application = request.headers["x-application-name"] as string | undefined;

  if (!application) {
    reply.status(400);
    reply.send({
      error: "BAD_REQUEST",
      message: "x-application-name header is required",
    });
    return;
  }

  // Check for application header requirement on sign-up and sign-in
  if (url.pathname.includes("/sign-up") || url.pathname.includes("/sign-in")) {
    // For sign-up, inject the application field into the body
    if (url.pathname.includes("/sign-up") && request.body && typeof request.body === "object") {
      (request.body as any).application = application;
    }

    if (url.pathname.includes("/sign-in")) {
      const body = request.body;
      const email =
        body && typeof body === "object" && "email" in body
          ? (body as Record<string, unknown>).email
          : undefined;

      if (!email || typeof email !== "string") {
        reply.status(400);
        reply.send({
          error: "BAD_REQUEST",
          message: "email is required for sign-in",
        });
        return;
      }

      const user = await getUserByEmailAndApplication(email, application);

      if (!user) {
        reply.status(403);
        reply.send({
          error: "APPLICATION_MISMATCH",
          message: "User is not registered for this application",
        });
        return;
      }
    }
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

  const applicationContextValue = application ?? null;

  const response = await applicationContext.run(
    applicationContextValue,
    () => auth.handler(authRequest)
  );

  reply.status(response.status);

  response.headers.forEach((value, key) => {
    reply.header(key, value);
  });

  // ✅ Safe: consume once, send once
  const text = await response.text();
  reply.send(text);
});

/**
 * Custom session endpoint
 * Better Auth doesn't expose /api/auth/session by default, so we create it
 */
fastify.get("/api/auth/session", async (request, reply) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session) {
      reply.status(404);
      return reply.send({ message: "No session found" });
    }

    return reply.send(session);
  } catch (error) {
    reply.status(500);
    return reply.send({ error: "Failed to get session" });
  }
});

/**
 * OTP Endpoints
 */
import { sendOTP, verifyOTP, resendOTP, SendOTPSchema, VerifyOTPSchema } from "./otp.js";

// Send OTP
fastify.post("/api/auth/send-otp", async (request, reply) => {
  try {
    const application = request.headers["x-application-name"] as string | undefined;

    if (!application) {
      reply.status(400);
      return reply.send({
        success: false,
        message: "x-application-name header is required",
      });
    }

    const body = request.body as any;
    const result = await sendOTP({
      email: body.email,
      application,
    });

    reply.status(result.success ? 200 : 400);
    return reply.send(result);
  } catch (error) {
    console.error("Error in send-otp endpoint:", error);
    reply.status(500);
    return reply.send({
      success: false,
      message: "Internal server error",
    });
  }
});

// Verify OTP
fastify.post("/api/auth/verify-otp", async (request, reply) => {
  try {
    const application = request.headers["x-application-name"] as string | undefined;

    if (!application) {
      reply.status(400);
      return reply.send({
        success: false,
        message: "x-application-name header is required",
      });
    }

    const body = request.body as any;
    const result = await verifyOTP({
      email: body.email,
      otp: body.otp,
      application,
    });

    reply.status(result.success ? 200 : 400);
    return reply.send(result);
  } catch (error) {
    console.error("Error in verify-otp endpoint:", error);
    reply.status(500);
    return reply.send({
      success: false,
      message: "Internal server error",
    });
  }
});

// Resend OTP
fastify.post("/api/auth/resend-otp", async (request, reply) => {
  try {
    const application = request.headers["x-application-name"] as string | undefined;

    if (!application) {
      reply.status(400);
      return reply.send({
        success: false,
        message: "x-application-name header is required",
      });
    }

    const body = request.body as any;
    const result = await resendOTP({
      email: body.email,
      application,
    });

    reply.status(result.success ? 200 : 400);
    return reply.send(result);
  } catch (error) {
    console.error("Error in resend-otp endpoint:", error);
    reply.status(500);
    return reply.send({
      success: false,
      message: "Internal server error",
    });
  }
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
