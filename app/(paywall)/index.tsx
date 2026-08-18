import { useProfile } from "@/lib/ProfileContext";
import {
  getCurrentOffering,
  getCustomerInfo,
  hasActiveEntitlement,
  initializeRevenueCat,
  syncRevenueCatUser,
} from "@/lib/revenuecat";
import { Redirect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { CustomerInfo, PurchasesOffering } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";

export default function PaywallGate() {
  const router = useRouter();
  const { profile, user, loading } = useProfile();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loadError, setLoadError] = useState(false);

  const navigateIfSubscribed = useCallback(
    (info: CustomerInfo | null | undefined) => {
      if (hasActiveEntitlement(info)) {
        router.push({
          pathname: "/(tabs)",
          params: { shouldShowIntro: "false" },
        });
        return true;
      }
      return false;
    },
    [router],
  );

  const refreshAccess = useCallback(async () => {
    setLoadError(false);
    setIsChecking(true);

    try {
      if (!user?.id) {
        setCustomerInfo(null);
        return;
      }

      await initializeRevenueCat(user.id);
      await syncRevenueCatUser(user.id);

      const currentCustomerInfo = await getCustomerInfo();
      setCustomerInfo(currentCustomerInfo);

      if (navigateIfSubscribed(currentCustomerInfo)) {
        return;
      }

      setOffering(await getCurrentOffering());
    } catch (error) {
      console.error("Failed to sync RevenueCat access", error);
      setLoadError(true);
    } finally {
      setIsChecking(false);
    }
  }, [navigateIfSubscribed, user?.id]);

  useEffect(() => {
    if (!loading && profile?.onboarding_complete) {
      void refreshAccess();
    }
  }, [loading, profile?.onboarding_complete, refreshAccess]);

  const handleAccessGranted = useCallback(
    (info: CustomerInfo) => {
      setCustomerInfo(info);
      navigateIfSubscribed(info);
    },
    [navigateIfSubscribed],
  );

  if (loading || isChecking) {
    return <View style={styles.screen} />;
  }

  if (!profile?.onboarding_complete) {
    return <Redirect href="/(onboarding)/Onboarding" />;
  }
  console.log(hasActiveEntitlement(customerInfo));

  if (hasActiveEntitlement(customerInfo)) {
    return <Redirect href="/(tabs)" />;
  }

  if (loadError || !offering) {
    return (
      <View style={[styles.screen, styles.errorScreen]}>
        <Text style={styles.errorTitle}>Subscription unavailable</Text>
        <Text style={styles.errorText}>
          We could not load subscription options. Please try again.
        </Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => void refreshAccess()}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RevenueCatUI.Paywall
        options={{ offering }}
        onPurchaseCompleted={({ customerInfo: info }) =>
          handleAccessGranted(info)
        }
        onRestoreCompleted={({ customerInfo: info }) => {
          handleAccessGranted(info);
          if (!hasActiveEntitlement(info)) {
            Alert.alert(
              "No active subscription found",
              "We didn't find an active Aspyr Pro subscription on this account.",
            );
          }
        }}
        onDismiss={() => {
          void getCustomerInfo().then((info) => {
            setCustomerInfo(info);
            navigateIfSubscribed(info);
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  errorScreen: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    color: "#F4F4F5",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    color: "#D4D4D8",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  retryButton: {
    alignSelf: "center",
    backgroundColor: "#8B5CF6",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  retryButtonText: {
    color: "#F5F3FF",
    fontSize: 16,
    fontWeight: "700",
  },
});
