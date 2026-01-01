import { z } from "zod";

// ============================================================================
// Request Schemas
// ============================================================================

export const SignUpRequestSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().optional(),
});

export const SignInRequestSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});
export const SendOTPRequestSchema = z.object({
    email: z.email("Invalid email address"),
    application: z.string().min(1, "Application name is required"),
});

export const VerifyOTPRequestSchema = z.object({
    email: z.email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    application: z.string().min(1, "Application name is required"),
});
export const ConfigSchema = z.object({
    baseUrl: z.url("Invalid URL"),
    applicationName: z.string().min(1, "Application name is required"),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    emailVerified: z.boolean(),
    image: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    application: z.string(),
});

export const SessionSchema = z.object({
    session: z.object({
        id: z.string(),
        userId: z.string(),
        expiresAt: z.string(),
        token: z.string(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
    }),
    user: UserSchema,
});

export const AuthResponseSchema = z.object({
    user: UserSchema.optional(),
    session: z
        .object({
            id: z.string(),
            userId: z.string(),
            expiresAt: z.string(),
            token: z.string(),
        })
        .optional(),
    token: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
    error: z.string(),
    message: z.string(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
export type SignInRequest = z.infer<typeof SignInRequestSchema>;
export type SendOTPRequest = z.infer<typeof SendOTPRequestSchema>;
export type VerifyOTPRequest = z.infer<typeof VerifyOTPRequestSchema>;
export type Config = z.infer<typeof ConfigSchema>;
export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================================================
// API Response Type
// ============================================================================

export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: ErrorResponse;
    raw: unknown;
};
