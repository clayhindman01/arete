import { useTheme } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

type PulseTextProps = {
  onAnimationComplete?: () => void;
};

const phases = [
  "Arete = Excellence through Action",
  "Become who you want to be through consistent action.",
];

export default function PulseText({ onAnimationComplete }: PulseTextProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [phase, setPhase] = useState(0);
  const { colors } = useTheme();

  useEffect(() => {
    let isCancelled = false;

    const startPhase = (index: number) => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.delay(1400),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished || isCancelled) {
          return;
        }

        if (index === 0) {
          opacity.setValue(0);
          setPhase(1);
          startPhase(1);
          return;
        }

        onAnimationComplete?.();
      });
    };

    startPhase(0);

    return () => {
      isCancelled = true;
    };
  }, [onAnimationComplete, opacity]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, { opacity, color: colors.text }]}>
        {phases[phase]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // width: "80%",
  },
  text: {
    width: "80%",
    fontSize: 28,
    fontWeight: "800",
    // color: "#00ffcc",
    textAlign: "center",
    lineHeight: 36,
  },
});
