import Button from "@/components/ui/Button";
import { signUp } from "@/lib/auth";
import { useRouter } from "expo-router";
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

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<ErrorType | null>(null);
  const router = useRouter();

  const handleSignUp = () => {
    if (password != confirmPassword) {
      setError(
        handleError({
          error: "sign up error",
          message: "Passwords do not match.",
        }),
      );
    } else {
      setError(null);
      signUp(email, password).then(() =>
        router.navigate("/(onboarding)/Onboarding"),
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.subtitle}>Create your account</Text>

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

          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm Password"
            placeholderTextColor="#64748b"
            secureTextEntry
          />

          {error && <ErrorComponent label={error.message} />}

          <Button
            label="Create Account"
            type="primary"
            onPress={() => handleSignUp()}
          />

          <Text style={styles.footer}>
            By creating an account you agree to Aspyr Terms & Privacy Policy
          </Text>
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
    color: "#fff",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 24,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
    letterSpacing: 2,
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
  footer: {
    marginTop: 16,
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
  },
});
