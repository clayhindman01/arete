import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function ProgressRing({
  size = 56,
  strokeWidth = 6,
  progress = 0,
  color = "#b89b5e",
  bgColor = "#1A1D24",
  text,
}: {
  size?: number;
  strokeWidth?: number;
  progress?: number; // 0..1
  color?: string;
  bgColor?: string;
  text?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      {text ? (
        <View style={styles.centerText} pointerEvents="none">
          <Text style={styles.text}>{text}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centerText: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
  },
});
