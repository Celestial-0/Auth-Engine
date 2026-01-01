import { useState, Activity } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { SignUp } from "./SignUp";
import { SignIn } from "./SignIn";
import { Session } from "./Session";
import { Otp } from "./Otp";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Settings, Shield } from "lucide-react";

type TabType = "signup" | "signin" | "session" | "otp";

function DashboardContent() {
  const { config, setConfig, response, setResponse } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("signup");

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setResponse(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Shield className="size-10 text-foreground" />
            <h1 className="text-4xl font-bold text-foreground">
              AuthEngine Testing Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Test authentication microservice endpoints with real-time responses
          </p>
        </div>

        {/* Configuration Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>API Base URL</FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <span className="text-base">🌐</span>
                    </InputGroupAddon>
                    <InputGroupInput
                      type="url"
                      placeholder="http://localhost:4000"
                      value={config.baseUrl}
                      onChange={(e) =>
                        setConfig({ ...config, baseUrl: e.target.value })
                      }
                    />
                  </InputGroup>
                  <FieldDescription>
                    Base URL of the AuthEngine backend server
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Application Name</FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <span className="text-base">📱</span>
                    </InputGroupAddon>
                    <InputGroupInput
                      type="text"
                      placeholder="MyApp"
                      value={config.applicationName}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          applicationName: e.target.value,
                        })
                      }
                    />
                  </InputGroup>
                  <FieldDescription>
                    Application identifier for multi-tenant authentication
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Operations Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Authentication Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg flex-wrap">
                <button
                  onClick={() => handleTabChange("signup")}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${activeTab === "signup"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50"
                    }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => handleTabChange("signin")}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${activeTab === "signin"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50"
                    }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleTabChange("otp")}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${activeTab === "otp"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50"
                    }`}
                >
                  OTP
                </button>
                <button
                  onClick={() => handleTabChange("session")}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${activeTab === "session"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50"
                    }`}
                >
                  Session
                </button>

              </div>

              {/* Tab Content */}
              <Activity mode={activeTab === "signup" ? "visible" : "hidden"}>
                <SignUp />
              </Activity>
              <Activity mode={activeTab === "signin" ? "visible" : "hidden"}>
                <SignIn />
              </Activity>
              <Activity mode={activeTab === "session" ? "visible" : "hidden"}>
                <Session />
              </Activity>

              <Activity mode={activeTab === "otp" ? "visible" : "hidden"}>
                <Otp />
              </Activity>
            </CardContent>
          </Card>

          {/* Response Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Response</CardTitle>
                <Activity mode={response ? "visible" : "hidden"}>
                  <Badge variant={response?.success ? "default" : "destructive"}>
                    {response?.success ? "Success" : "Error"}
                  </Badge>
                </Activity>
              </div>
            </CardHeader>
            <CardContent>
              <Activity mode={!response ? "visible" : "hidden"}>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Shield className="size-12 mb-4 opacity-20" />
                  <p className="text-sm">No response yet</p>
                  <p className="text-xs mt-1">
                    Execute an operation to see the response
                  </p>
                </div>
              </Activity>
              <Activity mode={response ? "visible" : "hidden"}>
                <div className="space-y-4">
                  {/* Response metadata */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Status:</span>
                    <Badge
                      variant={response?.success ? "default" : "destructive"}
                    >
                      {response?.success ? "✓ Success" : "✗ Failed"}
                    </Badge>
                  </div>

                  {/* Raw JSON Response */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Raw JSON:</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(response?.raw, null, 2)
                          );
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <pre className="p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto border  dark:text-green-300 text-green-500">
                      {JSON.stringify(response?.raw, null, 2)}
                    </pre>
                  </div>

                  {/* Error details if present */}
                  <Activity mode={!response?.success && response?.error ? "visible" : "hidden"}>
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
                      <div className="font-medium text-destructive">
                        Error: {response?.error?.error}
                      </div>
                      <div className="text-sm text-destructive/80">
                        {response?.error?.message}
                      </div>
                    </div>
                  </Activity>
                </div>
              </Activity>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            AuthEngine Testing Dashboard • Cookie-based Authentication •{" "}
            <code className="px-2 py-1 bg-muted rounded">
              x-application-name
            </code>{" "}
            header required
          </p>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
