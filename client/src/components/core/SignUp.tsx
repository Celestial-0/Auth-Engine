import { useState, Activity } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { SignUpRequest } from "@/types/auth";
import { SignUpRequestSchema } from "@/types/auth";

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
import { Lock, Mail, User } from "lucide-react";

export function SignUp() {
  const { client, loading, setLoading, setResponse, config } = useAuth();

  const [form, setForm] = useState<SignUpRequest>({
    email: "",
    password: "",
    name: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    setErrors({});
    try {
      SignUpRequestSchema.parse(form);
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
      const result = await client.signUp(form);
      setResponse(result);

      // Clear form on success
      if (result.success) {
        setForm({ email: "", password: "", name: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Name</FieldLabel>
        <FieldContent>
          <InputGroup>
            <InputGroupAddon>
              <User className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </InputGroup>
        </FieldContent>
      </Field>

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
            Signing Up...
          </>
        ) : (
          <>
            <User className="mr-2 size-4" />
            Sign Up
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
    </FieldGroup>
  );
}
