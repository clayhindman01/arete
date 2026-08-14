import Button from "@/components/ui/Button";
import PulseText from "@/components/ui/PulseText";
import { signIn } from "@/lib/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function LoginScreen() {
  const { shouldShowIntro } = useLocalSearchParams<{
    shouldShowIntro: string;
  }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ErrorType | null>(null);
  const [showIntro, setShowIntro] = useState<string>(
    shouldShowIntro === undefined ? "true" : shouldShowIntro,
  );

  const router = useRouter();

  const logIn = () => {
    signIn(email, password)
      .then(() => {
        router.replace({
          pathname: "/(tabs)",
          params: {
            shouldShowIntro: "false",
          },
        });
      })
      .catch((error) => {
        setError(
          handleError({
            error: error.error,
            message: error.message,
          }),
        );
      });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {showIntro === "true" ? (
        <PulseText onAnimationComplete={() => setShowIntro("false")} />
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <Text style={styles.title}>ASPYR</Text>
            <Text style={styles.subtitle}>
              Small Commitments. Sustained Growth.
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

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#64748b"
              secureTextEntry
            />

            {error && <ErrorComponent label={error.message} />}
            {error ? (
              <Text
                style={styles.forgotPassword}
                onPress={() => router.navigate("/(auth)/ResetPassword")}
              >
                Forgot your password?
              </Text>
            ) : null}

            <Button type="primary" onPress={logIn} label="Log In" />
            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <Button
              label="Create New Account"
              type="secondary"
              onPress={() => router.navigate("/(auth)/Signup")}
            />

            <Text style={styles.footer}>
              By continuing you agree to Aspyr Terms & Privacy Policy
            </Text>
          </View>
        </TouchableWithoutFeedback>
      )}
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
  card: {
    borderRadius: 16,
    padding: 24,
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
  label: {
    fontSize: 13,
    color: "#cbd5e1",
    marginBottom: 6,
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
  primaryButton: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(148,163,184,0.2)",
  },
  dividerText: {
    color: "#64748b",
    marginHorizontal: 10,
    fontSize: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: "#e2e8f0",
  },
  forgotPassword: {
    color: "#93c5fd",
    textAlign: "center",
    marginBottom: 14,
    textDecorationLine: "underline",
  },
  footer: {
    marginTop: 16,
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
  },
});
