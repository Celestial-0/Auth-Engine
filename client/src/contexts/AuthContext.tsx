import { useState, useMemo, type ReactNode } from "react";
import { AuthEngineClient } from "@/lib/auth-client";
import type { Config, ApiResponse } from "@/types/auth";
import { AuthContext } from "./AuthContext.types";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<Config>({
        baseUrl: "http://localhost:4000",
        applicationName: "MyApp",
    });

    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<ApiResponse | null>(null);

    // Create client instance that updates when config changes
    const client = useMemo(() => new AuthEngineClient(config), [config]);

    return (
        <AuthContext.Provider
            value={{
                config,
                setConfig,
                client,
                loading,
                setLoading,
                response,
                setResponse,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
