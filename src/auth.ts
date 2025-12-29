import { betterAuth } from "better-auth";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,

  // PostgreSQL adapter (official)
  database: pool,

  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },

  // Define the custom user fields
  user: {
    additionalFields: {
      application: {
        type: "string",
        required: true,
        input: true, // Allow this to be set from input
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },
});
