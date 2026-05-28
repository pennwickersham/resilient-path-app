/**
 * Subscription Service — RevenueCat Integration
 * 
 * Handles all RevenueCat interactions for the Resilient Path app.
 * Product: com.resilientpath.app.monthly ($3.99/month with 7-day free trial)
 * 
 * BUILD 43 FIXES:
 * - Removed syncPurchases from purchase path entirely. Even fire-and-forget,
 *   it can cause StoreKit state changes that interfere with an in-progress purchase.
 *   syncPurchases is now only called once during init (background).
 * - Increased product fetch timeouts (10s→20s) for Apple's slow sandbox.
 * - Added automatic single-retry with 2s delay on purchase errors.
 * - Improved error messages to sound like guidance, not bugs.
 * 
 * PREVIOUS FIX (Build 42):
 * - Removed JSON.parse/JSON.stringify deep-cloning of package/product objects.
 * - Primary purchase path uses purchaseStoreProduct with freshly-fetched product.
 */
import { Capacitor } from '@capacitor/core';

// ─── CONFIGURATION ───────────────────────────────────────────────
// RevenueCat Public SDK API keys
const REVENUECAT_API_KEY_APPLE = 'appl_UjGQPFdDQoVvqOlLOVwglfkZqrG';
const REVENUECAT_API_KEY_GOOGLE = 'goog_rsFTBscYVROFrHgGivMAhhRwiEn';

const PRODUCT_ID = 'com.resilientpath.app.monthly';

// ─── STATE ───────────────────────────────────────────────────────
let purchasesModule = null;
let isInitialized = false;
let isConfiguredSuccessfully = false;

/**
 * Helper: race a promise against a timeout.
 * Used only for non-interactive calls (init, status checks, offerings).
 * NEVER wrap purchase calls in a timeout — StoreKit needs user interaction time.
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ]);
}

/**
 * Helper: detect user-initiated purchase cancellation across RevenueCat versions.
 */
function isPurchaseCancelled(err) {
  if (!err) return false;
  // RevenueCat error code 1 = user cancelled
  if (err.code === 1 || err.code === '1') return true;
  if (err.userCancelled === true) return true;
  const msg = (err.message || err.readableErrorCode || '').toLowerCase();
  return msg.includes('cancelled') || msg.includes('canceled') || msg.includes('user cancelled')
    || msg.includes('purchase_cancelled');
}

/**
 * Helper: delay for the given number of milliseconds.
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
 * syncPurchases is called here (and ONLY here) to clear stale sandbox transactions.
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
    // Enable verbose logging for sandbox debugging
    try {
      await Purchases.setLogLevel({ level: 'DEBUG' });
    } catch (_) { /* ignore if not supported */ }

    await withTimeout(Purchases.configure({ apiKey }), 10000);
    isInitialized = true;
    isConfiguredSuccessfully = true;
    console.log('[SubscriptionService] RevenueCat initialized for', platform);

    // Sync purchases once during init — clears stale sandbox transactions.
    // This is the ONLY place we call syncPurchases. Never during a purchase flow.
    Purchases.syncPurchases()
      .then(() => console.log('[SubscriptionService] syncPurchases completed (init)'))
      .catch((e) => console.warn('[SubscriptionService] syncPurchases failed (non-critical):', e.message));
  } catch (err) {
    console.error('[SubscriptionService] Init failed:', err);
    // DO NOT mark as initialized on failure — allow retries via ensureConfigured()
    // This was a critical bug: previously set isInitialized = true on failure,
    // causing ALL subsequent RevenueCat calls to fail silently.
  }
}

/**
 * Ensure RevenueCat SDK is configured before making API calls.
 * This handles the case where initializeRevenueCat() failed at startup
 * (e.g., timing issue, race condition, network error).
 * 
 * Called by purchasePackage and purchaseStoreProduct before any purchase attempt.
 */
async function ensureConfigured() {
  if (isConfiguredSuccessfully) return true;
  
  const Purchases = await getPurchasesModule();
  if (!Purchases) return false;
  
  const platform = Capacitor.getPlatform();
  const apiKey = platform === 'ios' ? REVENUECAT_API_KEY_APPLE : REVENUECAT_API_KEY_GOOGLE;
  
  console.log('[SubscriptionService] ensureConfigured: SDK not configured, attempting configure...');
  try {
    await Purchases.configure({ apiKey });
    isInitialized = true;
    isConfiguredSuccessfully = true;
    console.log('[SubscriptionService] ensureConfigured: SUCCESS — SDK now configured');
    return true;
  } catch (err) {
    console.error('[SubscriptionService] ensureConfigured: FAILED —', err.message);
    return false;
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

  // Ensure SDK is configured — needed for polling to work after startup init failure
  await ensureConfigured();

  try {
    const { customerInfo } = await withTimeout(Purchases.getCustomerInfo(), 8000);
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

  const MAX_RETRIES = 3;
  const DELAYS = [2000, 4000, 6000]; // exponential backoff
  let lastErr = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { offerings } = await withTimeout(Purchases.getOfferings(), 10000);
      if (offerings?.current) return offerings.current;
      // If current is null, wait and retry (sandbox can be slow)
      console.warn(`[SubscriptionService] offerings.current is null (attempt ${attempt + 1}/${MAX_RETRIES})`);
    } catch (err) {
      lastErr = err;
      console.warn(`[SubscriptionService] getOfferings attempt ${attempt + 1}/${MAX_RETRIES} failed:`, err.message);
    }
    if (attempt < MAX_RETRIES - 1) {
      await new Promise(r => setTimeout(r, DELAYS[attempt]));
    }
  }
  console.error('[SubscriptionService] Get offerings failed after retries:', lastErr);
  return null;
}

/**
 * Core purchase logic — attempts to purchase with retry.
 * 
 * Strategy:
 *   1. Try purchaseStoreProduct with a FRESHLY-FETCHED product (most reliable)
 *   2. Fall back to purchasePackage with the original package (no cloning)
 * 
 * If both strategies fail with a non-cancel error, automatically retries
 * once after a 2-second delay before returning an error.
 * 
 * CRITICAL: No syncPurchases here — it was removed in Build 43 because
 * even fire-and-forget calls can cause StoreKit state mutations that
 * interfere with the purchase flow.
 *
 * NEVER deep-clone (JSON.parse/JSON.stringify) package or product objects.
 * 
 * @param {Object} pkg — A RevenueCat package object from getOfferings()
 * @returns {{ success: boolean, customerInfo?: Object, error?: string }}
 */
export async function purchasePackage(pkg) {
  const Purchases = await getPurchasesModule();
  if (!Purchases) {
    return { success: false, error: 'Purchases not available on this platform' };
  }

  // Ensure SDK is configured — critical fix for startup race condition
  if (!(await ensureConfigured())) {
    return { success: false, error: 'Unable to connect to the subscription service. Please restart the app and try again.' };
  }

  const productId = pkg?.product?.identifier || pkg?.product?.productId || PRODUCT_ID;

  // Attempt purchase with automatic retry on failure
  const attemptPurchase = async () => {
    // ── STRATEGY 1: Fresh product fetch + purchaseStoreProduct ──
    // This is the most reliable path because it ensures the native bridge
    // gets a product object it just created (not one sitting in React state).
    console.log(`[SubscriptionService] Strategy 1: Fetching fresh product for ${productId}...`);
    try {
      const { products } = await withTimeout(
        Purchases.getProducts({ productIdentifiers: [productId] }),
        20000  // 20s — sandbox can be very slow
      );
      
      if (products && products.length > 0) {
        const freshProduct = products[0];
        console.log('[SubscriptionService] Strategy 1: Starting purchaseStoreProduct with fresh product...');
        const { customerInfo } = await Purchases.purchaseStoreProduct({ product: freshProduct });
        console.log('[SubscriptionService] Strategy 1: purchaseStoreProduct completed');
        
        const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
        return { success: hasActive, customerInfo };
      } else {
        console.warn('[SubscriptionService] Strategy 1: No products returned, falling through to Strategy 2');
      }
    } catch (err) {
      if (isPurchaseCancelled(err)) {
        console.log('[SubscriptionService] Purchase cancelled by user');
        return { success: false, error: 'cancelled' };
      }
      console.warn('[SubscriptionService] Strategy 1 failed:', err.message, '— trying Strategy 2');
    }

    // ── STRATEGY 2: Direct purchasePackage with original object ──
    // Pass the original package object directly — DO NOT deep-clone.
    console.log('[SubscriptionService] Strategy 2: Starting purchasePackage with original pkg...');
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    console.log('[SubscriptionService] Strategy 2: purchasePackage completed');
    
    const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
    return { success: hasActive, customerInfo };
  };

  try {
    return await attemptPurchase();
  } catch (err) {
    if (isPurchaseCancelled(err)) {
      console.log('[SubscriptionService] Purchase cancelled by user');
      return { success: false, error: 'cancelled' };
    }

    // First attempt failed — retry once after 2s delay
    console.warn('[SubscriptionService] First purchase attempt failed:', err.message, '— retrying in 2s...');
    console.warn('[SubscriptionService] Error details — code:', err.code, 'readableErrorCode:', err.readableErrorCode);
    
    try {
      await delay(2000);
      return await attemptPurchase();
    } catch (retryErr) {
      if (isPurchaseCancelled(retryErr)) {
        console.log('[SubscriptionService] Purchase cancelled by user (retry)');
        return { success: false, error: 'cancelled' };
      }
      console.error('[SubscriptionService] Purchase failed after retry:', retryErr);
      console.error('[SubscriptionService] Retry error details — code:', retryErr.code, 'message:', retryErr.message);
      return { 
        success: false, 
        error: 'Unable to connect to the App Store right now. Please check your internet connection and payment method in Settings → Apple ID, then try again.' 
      };
    }
  }
}

/**
 * Fallback: purchase by product identifier directly.
 * Used when offerings-based purchase isn't available.
 * 
 * Fetches a fresh product by ID, then purchases it.
 * No timeout on the purchase call — StoreKit needs user interaction time.
 * NO deep-cloning — pass the fresh product directly to the bridge.
 * NO syncPurchases — removed in Build 43.
 * Automatic single-retry on failure.
 * 
 * @param {string} productId — The StoreKit product identifier
 * @returns {{ success: boolean, customerInfo?: Object, error?: string }}
 */
export async function purchaseStoreProduct(productId = PRODUCT_ID) {
  const Purchases = await getPurchasesModule();
  if (!Purchases) {
    return { success: false, error: 'Purchases not available on this platform' };
  }

  // Ensure SDK is configured — critical fix for startup race condition
  if (!(await ensureConfigured())) {
    return { success: false, error: 'Unable to connect to the subscription service. Please restart the app and try again.' };
  }

  const attemptPurchase = async () => {
    // Fetch a fresh product directly by ID — give sandbox extra time
    console.log(`[SubscriptionService] Fetching product: ${productId}`);
    const { products } = await withTimeout(
      Purchases.getProducts({ productIdentifiers: [productId] }),
      25000  // 25s — extra generous for sandbox
    );
    if (!products || products.length === 0) {
      return { success: false, error: 'The subscription is temporarily unavailable. Please try again in a moment.' };
    }

    // Pass the fresh product directly to the bridge — DO NOT deep-clone
    const product = products[0];
    console.log('[SubscriptionService] Starting purchaseStoreProduct...');
    const { customerInfo } = await Purchases.purchaseStoreProduct({ product });
    console.log('[SubscriptionService] purchaseStoreProduct completed');
    
    const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
    return { success: hasActive, customerInfo };
  };

  try {
    return await attemptPurchase();
  } catch (err) {
    if (isPurchaseCancelled(err)) {
      console.log('[SubscriptionService] Purchase cancelled by user');
      return { success: false, error: 'cancelled' };
    }

    // First attempt failed — retry once after 2s delay
    console.warn('[SubscriptionService] First purchaseStoreProduct attempt failed:', err.message, '— retrying in 2s...');
    
    try {
      await delay(2000);
      return await attemptPurchase();
    } catch (retryErr) {
      if (isPurchaseCancelled(retryErr)) {
        console.log('[SubscriptionService] Purchase cancelled by user (retry)');
        return { success: false, error: 'cancelled' };
      }
      console.error('[SubscriptionService] purchaseStoreProduct failed after retry:', retryErr);
      return { 
        success: false, 
        error: 'Unable to connect to the App Store right now. Please check your internet connection and payment method in Settings → Apple ID, then try again.' 
      };
    }
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
