import { useTheme } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

type PulseTextProps = {
  onAnimationComplete?: () => void;
  route?: "onboarding" | "home";
};

export default function PulseText({ onAnimationComplete }: PulseTextProps) {
  const { colors } = useTheme();
  const fade = useRef(new Animated.Value(1)).current;
  const logoOffsetX = useRef(new Animated.Value(0)).current;
  const textOffsetX = useRef(new Animated.Value(60)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isCancelled = false;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(textOffsetX, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(logoOffsetX, {
          toValue: -24,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1200),
      Animated.timing(fade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished || isCancelled) {
        return;
      }

      onAnimationComplete?.();
    });

    return () => {
      isCancelled = true;
    };
  }, [fade, logoOffsetX, onAnimationComplete, textOffsetX, textOpacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoRow, { opacity: fade }]}>
        <Animated.View
          style={[
            styles.logoWrap,
            { transform: [{ translateX: logoOffsetX }] },
          ]}
        >
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
          />
        </Animated.View>
        <Animated.Text
          style={[
            styles.text,
            {
              opacity: textOpacity,
              color: colors.text,
              transform: [{ translateX: textOffsetX }],
            },
          ]}
        >
          RETE
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // minWidth: 220,
  },
  logoWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 75,
    height: 75,
    // resizeMode: "contain",
  },
  text: {
    fontSize: 56,
    fontWeight: "700",
    letterSpacing: 12,
    marginLeft: 8,
  },
});
