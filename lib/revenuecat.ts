import Purchases, {
  type CustomerInfo,
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

export const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS!;
export const ENTITLEMENT_ID = "Aspyr Pro";
export const OFFERING_IDENTIFIER = "default";

let isConfigured = false;

export async function initializeRevenueCat(appUserID?: string) {
  if (isConfigured) {
    if (appUserID) {
      await Purchases.logIn(appUserID);
    }
    return;
  }

  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID,
    });
    isConfigured = true;
  } catch (error) {
    console.error("Failed to configure RevenueCat", error);
    throw error;
  }
}

export async function syncRevenueCatUser(appUserID?: string) {
  if (!appUserID) return;

  try {
    const currentUserId = await Purchases.getAppUserID();
    if (currentUserId !== appUserID) {
      await Purchases.logIn(appUserID);
    }
  } catch (error) {
    console.error("Failed to sync RevenueCat user", error);
    throw error;
  }
}

export function hasActiveEntitlement(
  customerInfo: CustomerInfo | null | undefined,
) {
  return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();

  if (offerings.current) {
    return offerings.current;
  }

  const offering = offerings.all[OFFERING_IDENTIFIER];
  return offering ?? null;
}

export async function purchasePackage(packageToPurchase: PurchasesPackage) {
  return Purchases.purchasePackage(packageToPurchase);
}

export async function restorePurchases() {
  return Purchases.restorePurchases();
}

export async function openCustomerCenter() {
  const { default: RevenueCatUI } = await import("react-native-purchases-ui");
  return RevenueCatUI.presentCustomerCenter();
}
