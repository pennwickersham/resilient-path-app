/**
 * Subscription Service — RevenueCat Integration
 * 
 * Handles all RevenueCat interactions for the Resilient Path app.
 * Product: resilient.path.app ($3.99/month with 7-day free trial)
 */
import { Capacitor } from '@capacitor/core';

// ─── CONFIGURATION ───────────────────────────────────────────────
// Replace with your RevenueCat Public SDK API keys from:
// RevenueCat Dashboard → Project Settings → API Keys
const REVENUECAT_API_KEY_APPLE = 'appl_UjGQPFdDQoVvqOlLOVwglfkZqrG';
const REVENUECAT_API_KEY_GOOGLE = 'goog_rsFTBscYVROFrHgGivMAhhRwiEn';

const PRODUCT_ID = 'resilient.path.app';

// ─── STATE ───────────────────────────────────────────────────────
let purchasesModule = null;
let isInitialized = false;

/**
 * Helper: race a promise against a timeout.
 * Rejects with 'TIMEOUT' if the promise doesn't resolve in time.
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ]);
}

/**
 * Dynamically import RevenueCat only on native platforms.
 * Returns null on web/desktop where native IAP isn't available.
 */
async function getPurchasesModule() {
  if (purchasesModule) return purchasesModule;
  if (!Capacitor.isNativePlatform()) return null;
  
  try {
    const mod = await import('@revenuecat/purchases-capacitor');
    purchasesModule = mod.Purchases;
    return purchasesModule;
  } catch (err) {
    console.warn('[SubscriptionService] Failed to load RevenueCat:', err);
    return null;
  }
}

/**
 * Initialize RevenueCat SDK. Call once on app startup.
 */
export async function initializeRevenueCat() {
  if (isInitialized) return;
  
  const Purchases = await getPurchasesModule();
  if (!Purchases) {
    console.log('[SubscriptionService] Skipping init — not on native platform');
    isInitialized = true;
    return;
  }

  const platform = Capacitor.getPlatform();
  const apiKey = platform === 'ios' ? REVENUECAT_API_KEY_APPLE : REVENUECAT_API_KEY_GOOGLE;

  try {
    await withTimeout(Purchases.configure({ apiKey }), 5000);
    isInitialized = true;
    console.log('[SubscriptionService] RevenueCat initialized for', platform);
  } catch (err) {
    console.error('[SubscriptionService] Init failed:', err);
    // Mark as initialized even on failure to prevent retries that hang
    isInitialized = true;
  }
}

/**
 * Check the current subscription status.
 * @returns {{ isActive: boolean, isTrialing: boolean, expirationDate: string|null }}
 */
export async function checkSubscriptionStatus() {
  // On web/desktop, auto-unlock everything
  if (!Capacitor.isNativePlatform()) {
    return { isActive: true, isTrialing: false, expirationDate: null };
  }

  const Purchases = await getPurchasesModule();
  if (!Purchases) {
    return { isActive: true, isTrialing: false, expirationDate: null };
  }

  try {
    const { customerInfo } = await withTimeout(Purchases.getCustomerInfo(), 5000);
    const entitlements = customerInfo.entitlements.active;
    
    // Check if any entitlement is active
    const hasActive = Object.keys(entitlements).length > 0;
    
    // Check trial status from the first active entitlement
    let isTrialing = false;
    let expirationDate = null;
    
    if (hasActive) {
      const firstEntitlement = Object.values(entitlements)[0];
      isTrialing = firstEntitlement.periodType === 'TRIAL';
      expirationDate = firstEntitlement.expirationDate || null;
    }

    return { isActive: hasActive, isTrialing, expirationDate };
  } catch (err) {
    console.error('[SubscriptionService] Status check failed:', err);
    // On error (including timeout), grant access to avoid locking out users
    return { isActive: true, isTrialing: false, expirationDate: null };
  }
}

/**
 * Fetch available subscription offerings from RevenueCat.
 * Retries up to 3 times with exponential backoff for resilience in sandbox.
 * @returns {Object|null} The current offering, or null if unavailable.
 */
export async function getOfferings() {
  const Purchases = await getPurchasesModule();
  if (!Purchases) return null;

  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { offerings } = await withTimeout(Purchases.getOfferings(), 6000);
      if (offerings?.current) return offerings.current;
      // If current is null, wait and retry (sandbox can be slow)
      console.warn(`[SubscriptionService] offerings.current is null (attempt ${attempt + 1})`);
    } catch (err) {
      lastErr = err;
      console.warn(`[SubscriptionService] getOfferings attempt ${attempt + 1} failed:`, err.message);
    }
    if (attempt < 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  console.error('[SubscriptionService] Get offerings failed after retries:', lastErr);
  return null;
}

/**
 * Initiate a purchase for the given package.
 * @param {Object} pkg — A RevenueCat package object from getOfferings()
 * @returns {{ success: boolean, customerInfo?: Object, error?: string }}
 */
export async function purchasePackage(pkg) {
  const Purchases = await getPurchasesModule();
  if (!Purchases) {
    return { success: false, error: 'Purchases not available on this platform' };
  }

  try {
    const { customerInfo } = await withTimeout(
      Purchases.purchasePackage({ aPackage: pkg }),
      60000
    );
    const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
    return { success: hasActive, customerInfo };
  } catch (err) {
    // User cancellation is not an error
    if (err.code === 1 || err.message?.includes('cancelled') || err.message?.includes('canceled')) {
      return { success: false, error: 'cancelled' };
    }
    if (err.message === 'TIMEOUT') {
      console.error('[SubscriptionService] purchasePackage timed out');
      return { success: false, error: 'Purchase timed out. Please try again.' };
    }
    console.error('[SubscriptionService] Purchase failed:', err);
    return { success: false, error: err.message || 'Purchase failed' };
  }
}

/**
 * Fallback: purchase by product identifier directly.
 * Used when offerings-based purchase fails (e.g. sandbox environment).
 * @param {string} productId — The StoreKit product identifier
 * @returns {{ success: boolean, customerInfo?: Object, error?: string }}
 */
export async function purchaseStoreProduct(productId) {
  const Purchases = await getPurchasesModule();
  if (!Purchases) {
    return { success: false, error: 'Purchases not available on this platform' };
  }

  try {
    // Fetch products directly by ID
    const { products } = await withTimeout(
      Purchases.getProducts({ productIdentifiers: [productId] }),
      8000
    );
    if (!products || products.length === 0) {
      return { success: false, error: 'Product not found. Please try again later.' };
    }
    const { customerInfo } = await withTimeout(
      Purchases.purchaseStoreProduct({ product: products[0] }),
      60000
    );
    const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
    return { success: hasActive, customerInfo };
  } catch (err) {
    if (err.code === 1 || err.message?.includes('cancelled') || err.message?.includes('canceled')) {
      return { success: false, error: 'cancelled' };
    }
    if (err.message === 'TIMEOUT') {
      console.error('[SubscriptionService] purchaseStoreProduct timed out');
      return { success: false, error: 'Purchase timed out. Please try again.' };
    }
    console.error('[SubscriptionService] purchaseStoreProduct failed:', err);
    return { success: false, error: err.message || 'Purchase failed' };
  }
}

/**
 * Restore previous purchases (for reinstalls or device switches).
 * @returns {{ isActive: boolean }}
 */
export async function restorePurchases() {
  const Purchases = await getPurchasesModule();
  if (!Purchases) {
    return { isActive: true }; // Web fallback
  }

  try {
    const { customerInfo } = await withTimeout(
      Purchases.restorePurchases(),
      15000
    );
    const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
    return { isActive: hasActive };
  } catch (err) {
    if (err.message === 'TIMEOUT') {
      console.error('[SubscriptionService] restorePurchases timed out');
    } else {
      console.error('[SubscriptionService] Restore failed:', err);
    }
    return { isActive: false };
  }
}
