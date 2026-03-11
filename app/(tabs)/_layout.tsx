import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="dashboard" color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="Workout"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <Ionicons name="barbell-sharp" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Chat"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={28} name="chat" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="WorkoutLog"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={28} name="notebook" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-circle"
              size={28}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
