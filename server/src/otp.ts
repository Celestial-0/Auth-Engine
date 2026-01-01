import { z } from "zod";
import { Resend } from "resend";
import { pool } from "./auth.js";
import crypto from "crypto";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Zod Schemas
export const SendOTPSchema = z.object({
    email: z.email("Invalid email address"),
    application: z.string().min(1, "Application name is required"),
});

export const VerifyOTPSchema = z.object({
    email: z.email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    application: z.string().min(1, "Application name is required"),
});

export const OTPResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.any().optional(),
});

// Type exports
export type SendOTPInput = z.infer<typeof SendOTPSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type OTPResponse = z.infer<typeof OTPResponseSchema>;

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send OTP email using Resend
 */
async function sendOTPEmail(email: string, otp: string, application: string): Promise<void> {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    try {
        await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: `Your OTP for ${application}`,
            html: `
        <!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Verification Code</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
        Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="padding: 40px 16px"
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              max-width: 560px;
              background-color: #ffffff;
              border-radius: 14px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
              overflow: hidden;
            "
          >
            <!-- Header -->
            <tr>
              <td
                style="
                  padding: 32px 32px 24px;
                  border-bottom: 1px solid #e5e7eb;
                "
              >
                <h1
                  style="
                    margin: 0;
                    font-size: 22px;
                    font-weight: 600;
                    color: #111827;
                  "
                >
                  Verify your sign-in
                </h1>
                <p
                  style="
                    margin: 8px 0 0;
                    font-size: 14px;
                    color: #6b7280;
                  "
                >
                  ${application}
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 32px">
                <p
                  style="
                    margin: 0 0 16px;
                    font-size: 15px;
                    color: #374151;
                  "
                >
                  Hello,
                </p>

                <p
                  style="
                    margin: 0 0 24px;
                    font-size: 15px;
                    color: #374151;
                  "
                >
                  Use the verification code below to complete your sign-in. This
                  code is valid for the next <strong>10 minutes</strong>.
                </p>

                <!-- OTP Box -->
                <div
                  style="
                    background-color: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    margin: 32px 0;
                  "
                >
                  <div
                    style="
                      font-size: 32px;
                      font-weight: 700;
                      letter-spacing: 6px;
                      color: #111827;
                    "
                  >
                    ${otp}
                  </div>
                </div>

                <p
                  style="
                    margin: 0;
                    font-size: 14px;
                    color: #6b7280;
                  "
                >
                  If you didn’t request this code, you can safely ignore this
                  email. No further action is required.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  padding: 24px 32px;
                  background-color: #f9fafb;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                "
              >
                <p
                  style="
                    margin: 0;
                    font-size: 12px;
                    color: #9ca3af;
                  "
                >
                  This is an automated message. Please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>

      `,
        });
    } catch (error) {
        console.error("Failed to send OTP email:", error);
        throw new Error("Failed to send OTP email");
    }
}

/**
 * Send OTP to user's email
 */
export async function sendOTP(input: SendOTPInput): Promise<OTPResponse> {
    try {
        // Validate input
        const validated = SendOTPSchema.parse(input);
        const { email, application } = validated;

        // Check if user exists for this application
        const userResult = await pool.query(
            'SELECT id, "emailVerified" FROM "user" WHERE email = $1 AND application = $2',
            [email.toLowerCase(), application]
        );

        if (userResult.rows.length === 0) {
            return {
                success: false,
                message: "User not found for this application",
            };
        }

        const user = userResult.rows[0];

        // Check if email is already verified
        if (user.emailVerified) {
            return {
                success: false,
                message: "Email is already verified",
            };
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Delete any existing OTP for this email
        await pool.query(
            'DELETE FROM "verification" WHERE identifier = $1',
            [email.toLowerCase()]
        );

        // Store OTP in verification table
        const verificationId = crypto.randomUUID();
        await pool.query(
            'INSERT INTO "verification" (id, identifier, value, "expiresAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
            [verificationId, email.toLowerCase(), otp, expiresAt]
        );

        // Send OTP via email
        await sendOTPEmail(email, otp, application);

        return {
            success: true,
            message: "OTP sent successfully",
            data: {
                expiresIn: 600, // 10 minutes in seconds
            },
        };
    } catch (error) {
        console.error("Error sending OTP:", error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: error.issues[0].message,
            };
        }

        return {
            success: false,
            message: "Failed to send OTP",
        };
    }
}

/**
 * Verify OTP
 */
export async function verifyOTP(input: VerifyOTPInput): Promise<OTPResponse> {
    try {
        // Validate input
        const validated = VerifyOTPSchema.parse(input);
        const { email, otp, application } = validated;

        // Check if user exists for this application
        const userResult = await pool.query(
            'SELECT id, "emailVerified" FROM "user" WHERE email = $1 AND application = $2',
            [email.toLowerCase(), application]
        );

        if (userResult.rows.length === 0) {
            return {
                success: false,
                message: "User not found for this application",
            };
        }

        const user = userResult.rows[0];

        // Check if email is already verified
        if (user.emailVerified) {
            return {
                success: false,
                message: "Email is already verified",
            };
        }

        // Get OTP from verification table
        const verificationResult = await pool.query(
            'SELECT id, value, "expiresAt" FROM "verification" WHERE identifier = $1',
            [email.toLowerCase()]
        );

        if (verificationResult.rows.length === 0) {
            return {
                success: false,
                message: "No OTP found. Please request a new one.",
            };
        }

        const verification = verificationResult.rows[0];

        // Check if OTP has expired
        if (new Date() > new Date(verification.expiresAt)) {
            // Delete expired OTP
            await pool.query('DELETE FROM "verification" WHERE id = $1', [verification.id]);

            return {
                success: false,
                message: "OTP has expired. Please request a new one.",
            };
        }

        // Verify OTP
        if (verification.value !== otp) {
            return {
                success: false,
                message: "Invalid OTP",
            };
        }

        // Mark email as verified
        await pool.query(
            'UPDATE "user" SET "emailVerified" = true, "updatedAt" = NOW() WHERE id = $1',
            [user.id]
        );

        // Delete used OTP
        await pool.query('DELETE FROM "verification" WHERE id = $1', [verification.id]);

        return {
            success: true,
            message: "Email verified successfully",
        };
    } catch (error) {
        console.error("Error verifying OTP:", error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: error.issues[0].message,
            };
        }

        return {
            success: false,
            message: "Failed to verify OTP",
        };
    }
}

/**
 * Resend OTP (invalidates previous OTP and sends a new one)
 */
export async function resendOTP(input: SendOTPInput): Promise<OTPResponse> {
    try {
        // Validate input
        const validated = SendOTPSchema.parse(input);
        const { email, application } = validated;

        // Check if user exists for this application
        const userResult = await pool.query(
            'SELECT id, "emailVerified" FROM "user" WHERE email = $1 AND application = $2',
            [email.toLowerCase(), application]
        );

        if (userResult.rows.length === 0) {
            return {
                success: false,
                message: "User not found for this application",
            };
        }

        const user = userResult.rows[0];

        // Check if email is already verified
        if (user.emailVerified) {
            return {
                success: false,
                message: "Email is already verified",
            };
        }

        // Delete any existing OTP
        await pool.query(
            'DELETE FROM "verification" WHERE identifier = $1',
            [email.toLowerCase()]
        );

        // Generate and send new OTP
        return await sendOTP(validated);
    } catch (error) {
        console.error("Error resending OTP:", error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: error.issues[0].message,
            };
        }

        return {
            success: false,
            message: "Failed to resend OTP",
        };
    }
}
