import React, { ReactNode, useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    Pressable,
    StyleSheet,
    View,
    type DimensionValue,
} from "react-native";

type SlideUpMenuProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  height?: DimensionValue;
};

export default function SlideUpMenu({
  visible,
  onClose,
  children,
  height = "70%",
}: SlideUpMenuProps) {
  const screenHeight = Dimensions.get("window").height;
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const panOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: screenHeight,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start();
    }
  }, [screenHeight, translateY, visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.dy > 10 && gestureState.dy > Math.abs(gestureState.dx)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panOffset.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          panOffset.setValue(0);
          onClose();
          return;
        }

        Animated.spring(panOffset, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }).start();
      },
    }),
  ).current;

  const animatedTranslateY = Animated.add(translateY, panOffset);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            typeof height === "number" ? { height } : { height },
            {
              transform: [{ translateY: animatedTranslateY }],
            },
          ]}
        >
          <View style={styles.dragArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(5, 7, 12, 0.65)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#111318",
    paddingHorizontal: 18,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "#232833",
  },
  dragArea: {
    alignItems: "center",
    paddingVertical: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#4b5563",
  },
});
