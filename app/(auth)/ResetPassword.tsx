import Button from "@/components/ui/Button";
import { resetPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { ErrorComponent, ErrorType, handleError } from "../../lib/auth.util";

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const parseHashParams = (hash: string) => {
  const sanitized = hash.replace(/^#/, "");
  return new URLSearchParams(sanitized);
};

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ErrorType | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    const queryError = params.error_description || params.error;
    const queryType = params.type;

    let errorMessage = queryError ? String(queryError).replace(/\+/g, " ") : "";

    async function handleRecoveryUrl() {
      if (typeof window === "undefined") {
        return;
      }

      const hashParams = parseHashParams(window.location.hash);
      const hashError =
        hashParams.get("error_description") || hashParams.get("error");
      const hashType = hashParams.get("type");

      if (hashError) {
        errorMessage = String(hashError).replace(/\+/g, " ");
      }

      if (hashType === "recovery" || queryType === "recovery") {
        setRecoveryMode(true);

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSessionFromUrl({ storeSession: true });

        if (sessionError) {
          setError(
            handleError({
              error: "session restoration error",
              message:
                sessionError.message ||
                "Unable to restore session from the reset link.",
            }),
          );
          return;
        }

        if (sessionData?.session?.user) {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      }
    }

    handleRecoveryUrl();

    if (queryType === "recovery") {
      setRecoveryMode(true);
    }

    if (errorMessage) {
      setError(
        handleError({
          error: "reset password callback error",
          message: errorMessage,
        }),
      );
    }
  }, [params]);

  const handleResetPassword = async () => {
    setError(null);
    setMessage("");

    if (!isValidEmail(email)) {
      setError(
        handleError({
          error: "invalid email",
          message: "Please enter a valid email address.",
        }),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setMessage(
        "If an account exists for that email, you will receive an email with instructions to reset your password.",
      );
    } catch (error: any) {
      setError(
        handleError({
          error: error?.error ?? "reset password error",
          message:
            error?.message ||
            "Unable to send password reset email. Please try again later.",
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    setMessage("");

    if (password.length < 8) {
      setError(
        handleError({
          error: "invalid password",
          message: "Your new password must be at least 8 characters.",
        }),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage(
        "Your password has been updated. Please sign in with your new password.",
      );
      router.navigate("/(auth)/Login");
    } catch (error: any) {
      setError(
        handleError({
          error: error?.error ?? "update password error",
          message:
            error?.message ||
            "Unable to update your password. Please try again.",
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (recoveryMode) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <Text style={styles.title}>Choose a new password</Text>
            <Text style={styles.subtitle}>
              Enter a new password to complete the password reset process.
            </Text>

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              placeholderTextColor="#64748b"
              secureTextEntry
            />

            {error && <ErrorComponent label={error.message} />}
            {message ? (
              <Text style={styles.successMessage}>{message}</Text>
            ) : null}

            <Button
              type="primary"
              label={isSubmitting ? "Saving..." : "Save new password"}
              onPress={handleChangePassword}
            />

            <Button
              type="secondary"
              label="Back to Login"
              onPress={() => router.navigate("/(auth)/Login")}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the email for your account and we will send password reset
            instructions.
          </Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {error && <ErrorComponent label={error.message} />}
          {message ? (
            <Text style={styles.successMessage}>{message}</Text>
          ) : null}

          <Button
            type="primary"
            label={isSubmitting ? "Sending..." : "Reset Password"}
            onPress={handleResetPassword}
          />

          <Button
            type="secondary"
            label="Back to Login"
            onPress={() => router.navigate("/(auth)/Login")}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#ebc27b",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 5,
    lineHeight: 50,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    marginBottom: 14,
    letterSpacing: 1,
  },
  successMessage: {
    color: "#22c55e",
    marginBottom: 12,
    textAlign: "center",
  },
});
