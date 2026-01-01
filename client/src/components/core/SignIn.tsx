import { useState, Activity } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { SignInRequest } from "@/types/auth";
import { SignInRequestSchema } from "@/types/auth";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Lock, Mail, LogIn, LogOut } from "lucide-react";

export function SignIn() {
  const { client, loading, setLoading, setResponse, config } = useAuth();

  const [form, setForm] = useState<SignInRequest>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    setErrors({});
    try {
      SignInRequestSchema.parse(form);
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setResponse(null);
    try {
      const result = await client.signIn(form);
      setResponse(result);

      // Clear form on success
      if (result.success) {
        setForm({ email: "", password: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const result = await client.signOut();
      setResponse(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FieldGroup>
      <Field data-invalid={!!errors.email}>
        <FieldLabel>Email</FieldLabel>
        <FieldContent>
          <InputGroup>
            <InputGroupAddon>
              <Mail className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              aria-invalid={!!errors.email}
            />
          </InputGroup>
          <FieldError>{errors.email}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.password}>
        <FieldLabel>Password</FieldLabel>
        <FieldContent>
          <InputGroup>
            <InputGroupAddon>
              <Lock className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              aria-invalid={!!errors.password}
            />
          </InputGroup>
          <FieldError>{errors.password}</FieldError>
        </FieldContent>
      </Field>

      <Button
        onClick={handleSubmit}
        disabled={loading || !config.applicationName}
        className="w-full"
      >
        {loading ? (
          <>
            <Spinner className="mr-2" />
            Signing In...
          </>
        ) : (
          <>
            <LogIn className="mr-2 size-4" />
            Sign In
          </>
        )}
      </Button>

      <Activity mode={!config.applicationName ? "visible" : "hidden"}>
        <div className="p-4 bg-muted border border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
            ⚠️ Please set an application name in the configuration above
          </p>
        </div>
      </Activity>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Sign Out Section */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sign out the current user and clear the session.
        </p>
        <Button
          onClick={handleSignOut}
          disabled={loading || !config.applicationName}
          variant="destructive"
          className="w-full"
        >
          {loading ? (
            <>
              <Spinner className="mr-2" />
              Signing Out...
            </>
          ) : (
            <>
              <LogOut className="mr-2 size-4" />
              Sign Out
            </>
          )}
        </Button>
      </div>
    </FieldGroup>
  );
}
