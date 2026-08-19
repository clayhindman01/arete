import { ThemedText } from "@/components/themed-text";
import Card from "@/components/ui/Card";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Modal as RNModal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  showCloseIcon: boolean;
};

export default function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseIcon,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.98,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity]);

  return (
    <RNModal transparent visible={visible} animationType="none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity }]} />
      </TouchableWithoutFeedback>

      <View style={styles.center} pointerEvents={visible ? "box-none" : "none"}>
        <Animated.View
          style={[styles.container, { opacity, transform: [{ scale }] }]}
        >
          <Card style={styles.cardOverride}>
            <View style={styles.headerRow}>
              {title ? (
                <ThemedText type="title" style={styles.headerTitle}>
                  {title}
                </ThemedText>
              ) : null}
              {showCloseIcon && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                  hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                >
                  <View style={styles.closeIconBackground}>
                    <MaterialIcons name="close" size={18} color="#A1A1AA" />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.content}>{children}</View>
          </Card>
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 600,
    // spacing and sizing handled by Card; keep container for animation and layout
    padding: 0,
  },
  cardOverride: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: "#111318",
    borderColor: "#232833",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginRight: 8,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 0,
  },
  closeIconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  content: {
    marginTop: 6,
  },
});
