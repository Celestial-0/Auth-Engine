import { betterAuth } from "better-auth";
import { Pool } from "pg";
import dotenv from "dotenv";
import { AsyncLocalStorage } from "async_hooks";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Holds the current application name for the active request so we can scope Better Auth lookups.
export const applicationContext = new AsyncLocalStorage<string | null>();

export async function getUserByEmailAndApplication(
  email: string,
  application: string
) {
  const { rows } = await pool.query(
    'select id, email, application from "user" where email = $1 and application = $2 limit 1',
    [email, application]
  );

  return rows[0] ?? null;
}

const auth = betterAuth({
  secret: requireEnv("BETTER_AUTH_SECRET"),
  baseURL: requireEnv("BETTER_AUTH_URL"),

  // PostgreSQL adapter (official)
  database: pool,

  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },

  emailVerification: {
    // OTP validity (in seconds)
    expiresIn: 10 * 60, // 10 minutes

    // Called when OTP needs to be sent
    async sendVerificationEmail({ user, url, token }) {
      // Import the sendOTPEmail function from otp.ts
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

      try {
        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: "Your Verification Code",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your Verification Code</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">Verification Code</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
                  <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
                  <p style="font-size: 16px; margin-bottom: 20px;">Your verification token is:</p>
                  <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                    <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #667eea; word-break: break-all;">${token}</span>
                  </div>
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">Alternatively, click the link below to verify your email:</p>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="${url}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
                  </div>
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">This link will expire in <strong>10 minutes</strong>.</p>
                  <p style="font-size: 14px; color: #666; margin-top: 10px;">If you didn't request this code, please ignore this email.</p>
                  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                  <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">This is an automated message, please do not reply.</p>
                </div>
              </body>
            </html>
          `,
        });
        console.log(`Verification email sent to ${user.email}`);
      } catch (error) {
        console.error("Failed to send verification email:", error);
        // Fallback to console logging in development
        console.log(`Verification URL for ${user.email}: ${url}`);
        console.log(`Verification token: ${token}`);
      }
    },
  },

  // Trusted origins for CORS
  trustedOrigins: process.env.ALLOWED_ORIGINS?.split(",") ?? [],

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

// Patch Better Auth's internal findUserByEmail to respect application scoping during sign-up/sign-in.
auth.$context.then((ctx) => {
  const originalFindUserByEmail = ctx.internalAdapter.findUserByEmail;

  ctx.internalAdapter.findUserByEmail = async (email, options) => {
    const application = applicationContext.getStore();

    if (!application) {
      throw new Error("Application context missing; ensure x-application-name is provided");
    }

    const userResult = await pool.query(
      'select * from "user" where email = $1 and application = $2 limit 1',
      [email.toLowerCase(), application]
    );

    const user = userResult.rows[0];
    if (!user) return null;

    let accounts: any[] = [];
    if (options?.includeAccounts) {
      const accountResult = await pool.query(
        'select * from "account" where "userId" = $1',
        [user.id]
      );
      accounts = accountResult.rows;
    }

    return { user, accounts };
  };
});


export { auth };