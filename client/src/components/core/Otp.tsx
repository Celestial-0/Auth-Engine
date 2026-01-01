import { useState, useEffect, useCallback, Activity } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Alert } from "@/components/ui/alert";
import { Mail, KeyRound, Send, CheckCircle, AlertCircle, Clock, Info } from "lucide-react";

export const Otp = () => {
  const { client, config, setResponse } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Countdown timer effect - runs every second when OTP is sent
  useEffect(() => {
    // Only set up timer if we have expiration time and OTP was sent
    if (!expiresAt || !otpSent) {
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0) {
        setLocalError("OTP has expired. Please request a new one.");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, otpSent]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const resetForm = useCallback(() => {
    setOtpSent(false);
    setEmail("");
    setOtp("");
    setExpiresAt(null);
    setTimeRemaining(null);
    setLocalError(null);
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);

    const response = await client.sendOTP({
      email: email.toLowerCase().trim(),
      application: config.applicationName,
    });

    setResponse(response);
    setLoading(false);

    if (response.success && response.data) {
      // Calculate expiration time (10 minutes from now as per backend)
      const expirationTime = new Date(Date.now() + (response.data.data?.expiresIn || 600) * 1000);
      setExpiresAt(expirationTime);
      setOtpSent(true);
      setOtp(""); // Clear any previous OTP
    } else {
      // Handle specific error cases from backend
      const errorMsg = response.error?.message || "Failed to send OTP";
      setLocalError(errorMsg);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if OTP has expired locally
    if (timeRemaining !== null && timeRemaining === 0) {
      setLocalError("OTP has expired. Please request a new one.");
      return;
    }

    setLoading(true);
    setLocalError(null);

    const response = await client.verifyOTP({
      email: email.toLowerCase().trim(),
      otp: otp.trim(),
      application: config.applicationName,
    });

    setResponse(response);
    setLoading(false);

    if (response.success) {
      // Email verified successfully - reset everything
      resetForm();
    } else {
      // Handle specific error cases from backend
      const errorMsg = response.error?.message || "Failed to verify OTP";
      setLocalError(errorMsg);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setLocalError(null);
    setOtp(""); // Clear OTP input

    const response = await client.resendOTP({
      email: email.toLowerCase().trim(),
      application: config.applicationName,
    });

    setResponse(response);
    setLoading(false);

    if (response.success && response.data) {
      // Calculate new expiration time
      const expirationTime = new Date(Date.now() + (response.data.data?.expiresIn || 600) * 1000);
      setExpiresAt(expirationTime);
    } else {
      // Handle specific error cases from backend
      const errorMsg = response.error?.message || "Failed to resend OTP";
      setLocalError(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Information Alert */}
      <Alert className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
        <Info className="size-4" />
        <div className="ml-2">
          <div className="font-medium">Email Verification</div>
          <div className="text-sm mt-1">
            OTP verification is only available for registered users with unverified emails.
            Sign up first if you don't have an account.
          </div>
        </div>
      </Alert>

      {/* Local Error Alert */}
      <Activity mode={localError ? "visible" : "hidden"}>
        <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertCircle className="size-4" />
          <div className="ml-2">
            <div className="font-medium">Error</div>
            <div className="text-sm mt-1">{localError}</div>
          </div>
        </Alert>
      </Activity>

      {/* Send OTP Form */}
      <Activity mode={!otpSent ? "visible" : "hidden"}>
        <form onSubmit={handleSendOTP} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Email Address</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupAddon>
                    <Mail className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLocalError(null);
                    }}
                    required
                    disabled={loading}
                  />
                </InputGroup>
                <FieldDescription>
                  Enter the email address of a registered user with unverified email
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Spinner className="mr-2" />}
            <Send className="mr-2 size-4" />
            Send OTP
          </Button>
        </form>
      </Activity>

      {/* Verify OTP Form */}
      <Activity mode={otpSent ? "visible" : "hidden"}>
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          {/* Success Alert with Timer */}
          <Alert className={`${timeRemaining !== null && timeRemaining > 0
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            }`}>
            <Activity mode={timeRemaining !== null && timeRemaining > 0 ? "visible" : "hidden"}>
              <CheckCircle className="size-4" />
            </Activity>
            <Activity mode={timeRemaining !== null && timeRemaining === 0 ? "visible" : "hidden"}>
              <AlertCircle className="size-4" />
            </Activity>
            <div className="ml-2 flex-1">
              <div className="font-medium">
                {timeRemaining !== null && timeRemaining > 0 ? "OTP Sent Successfully!" : "OTP Expired"}
              </div>
              <div className="text-sm mt-1">
                <Activity mode={timeRemaining !== null && timeRemaining > 0 ? "visible" : "hidden"}>
                  Check your email at <strong>{email}</strong>.{" "}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    <strong>{formatTime(timeRemaining || 0)}</strong> remaining
                  </span>
                </Activity>
                <Activity mode={timeRemaining === null || timeRemaining === 0 ? "visible" : "hidden"}>
                  The verification code has expired. Please request a new one.
                </Activity>
              </div>
            </div>
          </Alert>

          <FieldGroup>
            <Field>
              <FieldLabel>Verification Code</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupAddon>
                    <KeyRound className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setLocalError(null);
                    }}
                    required
                    maxLength={6}
                    className="tracking-widest text-center text-lg font-semibold"
                    disabled={loading || (timeRemaining !== null && timeRemaining === 0)}
                  />
                </InputGroup>
                <FieldDescription>
                  Enter the 6-digit verification code sent to your email
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || otp.length !== 6 || (timeRemaining !== null && timeRemaining === 0)}
            >
              {loading && <Spinner className="mr-2" />}
              <CheckCircle className="mr-2 size-4" />
              Verify OTP
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResendOTP}
              disabled={loading}
            >
              {loading && <Spinner className="mr-2" />}
              Resend
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={resetForm}
            disabled={loading}
          >
            Use Different Email
          </Button>
        </form>
      </Activity>
    </div>
  );
};
