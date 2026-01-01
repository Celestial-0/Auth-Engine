import { createContext } from "react";
import type { AuthEngineClient } from "@/lib/auth-client";
import type { Config, ApiResponse } from "@/types/auth";

export interface AuthContextType {
    config: Config;
    setConfig: (config: Config) => void;
    client: AuthEngineClient;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    response: ApiResponse | null;
    setResponse: (response: ApiResponse | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
