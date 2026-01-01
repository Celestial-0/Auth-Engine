import type {
    SignUpRequest,
    SignInRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    Config,
    ApiResponse,
    AuthResponse,
    Session,
} from "@/types/auth";

/**
 * AuthEngine API Client
 * Handles all authentication-related API calls with cookie-based authentication
 */
export class AuthEngineClient {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    /**
     * Update client configuration
     */
    updateConfig(config: Partial<Config>) {
        this.config = { ...this.config, ...config };
    }

    /**
     * Base fetch wrapper with common headers and error handling
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.config.baseUrl}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    "x-application-name": this.config.applicationName,
                    ...options.headers,
                },
                credentials: "include", // Important for cookie-based auth
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data,
                    raw: data,
                };
            }

            return {
                success: true,
                data: data as T,
                raw: data,
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    error: "NETWORK_ERROR",
                    message:
                        error instanceof Error ? error.message : "Unknown network error",
                },
                raw: error,
            };
        }
    }

    /**
     * Sign up a new user
     */
    async signUp(data: SignUpRequest): Promise<ApiResponse<AuthResponse>> {
        return this.request<AuthResponse>("/api/auth/sign-up/email", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    /**
     * Sign in an existing user
     */
    async signIn(data: SignInRequest): Promise<ApiResponse<AuthResponse>> {
        return this.request<AuthResponse>("/api/auth/sign-in/email", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    /**
     * Get current session
     */
    async getSession(): Promise<ApiResponse<Session>> {
        return this.request<Session>("/api/auth/session", {
            method: "GET",
        });
    }

    /**
     * Sign out current user
     */
    async signOut(): Promise<ApiResponse<{ success: boolean }>> {
        return this.request<{ success: boolean }>("/api/auth/sign-out", {
            method: "POST",
        });
    }

    /**
     * Send OTP to user's email
     */
    async sendOTP(data: SendOTPRequest): Promise<ApiResponse<{ success: boolean; message: string; data?: { expiresIn: number } }>> {
        return this.request<{ success: boolean; message: string; data?: { expiresIn: number } }>("/api/auth/send-otp", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    /**
     * Verify OTP code
     */
    async verifyOTP(data: VerifyOTPRequest): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return this.request<{ success: boolean; message: string }>("/api/auth/verify-otp", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    /**
     * Resend OTP to user's email
     */
    async resendOTP(data: SendOTPRequest): Promise<ApiResponse<{ success: boolean; message: string; data?: { expiresIn: number } }>> {
        return this.request<{ success: boolean; message: string; data?: { expiresIn: number } }>("/api/auth/resend-otp", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }
}
