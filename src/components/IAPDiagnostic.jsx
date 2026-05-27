import { useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * IAP Diagnostic Tool — visible in-app diagnostic to pinpoint
 * exactly where the purchase flow breaks.
 * 
 * This shows results on-screen (not console) so it works via TestFlight.
 */
const IAPDiagnostic = ({ onClose }) => {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);

  const log = (msg, status = 'info') => {
    setLogs(prev => [...prev, { msg, status, time: new Date().toLocaleTimeString() }]);
  };

  const runDiagnostic = async () => {
    setLogs([]);
    setRunning(true);

    // Step 1: Platform check
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    log(`Platform: ${platform}, isNative: ${isNative}`, isNative ? 'pass' : 'fail');

    if (!isNative) {
      log('STOP: Not running on native platform. IAP requires iOS/Android device.', 'fail');
      setRunning(false);
      return;
    }

    // Step 2: Load RevenueCat module
    let Purchases;
    try {
      const mod = await import('@revenuecat/purchases-capacitor');
      Purchases = mod.Purchases;
      log('RevenueCat module loaded ✓', 'pass');
    } catch (err) {
      log(`FAIL: Cannot load RevenueCat: ${err.message}`, 'fail');
      setRunning(false);
      return;
    }

    // Step 3: Check if already configured
    try {
      const { customerInfo } = await Promise.race([
        Purchases.getCustomerInfo(),
        new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 5000))
      ]);
      const activeEntitlements = Object.keys(customerInfo?.entitlements?.active || {});
      log(`SDK already configured ✓ (active entitlements: ${activeEntitlements.length})`, 'pass');
      if (activeEntitlements.length > 0) {
        log(`Active: ${activeEntitlements.join(', ')}`, 'info');
      }
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        log('getCustomerInfo timed out (5s) — SDK may not be configured', 'warn');
      } else {
        log(`getCustomerInfo failed: ${err.message} (code: ${err.code})`, 'warn');
      }
      
      // Try configuring
      const apiKey = platform === 'ios' 
        ? 'appl_UjGQPFdDQoVvqOlLOVwglfkZqrG'
        : 'goog_rsFTBscYVROFrHgGivMAhhRwiEn';
      try {
        await Purchases.setLogLevel({ level: 'DEBUG' });
        await Promise.race([
          Purchases.configure({ apiKey }),
          new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 10000))
        ]);
        log(`SDK configured with key: ${apiKey.substring(0, 8)}... ✓`, 'pass');
      } catch (configErr) {
        log(`FAIL: configure() failed: ${configErr.message}`, 'fail');
        setRunning(false);
        return;
      }
    }

    // Step 4: Get products
    const PRODUCT_ID = 'com.resilientpath.app.monthly';
    log(`Fetching product: ${PRODUCT_ID}...`);
    try {
      const { products } = await Promise.race([
        Purchases.getProducts({ productIdentifiers: [PRODUCT_ID] }),
        new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 15000))
      ]);
      if (products && products.length > 0) {
        const p = products[0];
        log(`Product found ✓: ${p.identifier || p.productId}`, 'pass');
        log(`  Title: ${p.title || p.localizedTitle || 'N/A'}`, 'info');
        log(`  Price: ${p.priceString || p.price || 'N/A'}`, 'info');
        log(`  Description: ${p.description || p.localizedDescription || 'N/A'}`, 'info');
      } else {
        log('FAIL: getProducts returned EMPTY array. StoreKit cannot find this product.', 'fail');
        log('This means the product ID does not exist in App Store Connect for this bundle ID.', 'fail');
        log('Or the subscription product has not been approved/is not available in sandbox.', 'fail');
      }
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        log('FAIL: getProducts timed out (15s). StoreKit cannot reach Apple servers.', 'fail');
      } else {
        log(`FAIL: getProducts error: ${err.message} (code: ${err.code})`, 'fail');
      }
    }

    // Step 5: Get offerings
    log('Fetching offerings...');
    try {
      const { offerings } = await Promise.race([
        Purchases.getOfferings(),
        new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 15000))
      ]);
      if (offerings?.current) {
        const pkgs = offerings.current.availablePackages || [];
        log(`Offerings found ✓: "${offerings.current.identifier}" with ${pkgs.length} package(s)`, 'pass');
        pkgs.forEach((pkg, i) => {
          log(`  Package ${i}: ${pkg.identifier} — ${pkg.product?.priceString || 'no price'}`, 'info');
        });
      } else {
        log('WARN: offerings.current is null — no default offering configured in RevenueCat', 'warn');
      }
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        log('WARN: getOfferings timed out (15s)', 'warn');
      } else {
        log(`WARN: getOfferings error: ${err.message}`, 'warn');
      }
    }

    // Step 6: Attempt purchase (only if products were found)
    log('──────────────────────────────');
    log('Ready. Tap "Test Purchase" below to attempt a real purchase.');
    log('If StoreKit is working, Apple\'s payment sheet should appear.');

    setRunning(false);
  };

  const testPurchase = async () => {
    setRunning(true);
    log('──── PURCHASE TEST ────');
    
    let Purchases;
    try {
      const mod = await import('@revenuecat/purchases-capacitor');
      Purchases = mod.Purchases;
    } catch (err) {
      log(`Cannot load RevenueCat: ${err.message}`, 'fail');
      setRunning(false);
      return;
    }

    const PRODUCT_ID = 'com.resilientpath.app.monthly';

    // First fetch fresh product
    log(`Fetching fresh product ${PRODUCT_ID}...`);
    let product = null;
    try {
      const { products } = await Promise.race([
        Purchases.getProducts({ productIdentifiers: [PRODUCT_ID] }),
        new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 15000))
      ]);
      if (products && products.length > 0) {
        product = products[0];
        log(`Product fetched ✓: ${product.identifier || product.productId}`, 'pass');
      } else {
        log('FAIL: No product returned. Cannot attempt purchase.', 'fail');
        setRunning(false);
        return;
      }
    } catch (err) {
      log(`FAIL: getProducts failed: ${err.message}`, 'fail');
      setRunning(false);
      return;
    }

    // Attempt purchase
    log('Calling purchaseStoreProduct... Apple payment sheet should appear NOW.');
    log('(If nothing appears within 10 seconds, StoreKit is broken)');
    const startTime = Date.now();
    
    try {
      const { customerInfo } = await Promise.race([
        Purchases.purchaseStoreProduct({ product }),
        new Promise((_, r) => setTimeout(() => r(new Error('PURCHASE_TIMEOUT_60S')), 60000))
      ]);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const hasActive = Object.keys(customerInfo?.entitlements?.active || {}).length > 0;
      log(`Purchase completed in ${elapsed}s! Active: ${hasActive}`, hasActive ? 'pass' : 'warn');
    } catch (err) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (err.message === 'PURCHASE_TIMEOUT_60S') {
        log(`FAIL: Purchase hung for 60s — no response from StoreKit. Payment sheet never appeared.`, 'fail');
        log('This confirms StoreKit cannot process purchases for this app.', 'fail');
        log('Possible causes:', 'info');
        log('  1. Sandbox account not configured on device', 'info');
        log('  2. Product not available in sandbox', 'info');
        log('  3. StoreKit2 bug on this iOS version', 'info');
      } else if (err.code === 1 || (err.message || '').toLowerCase().includes('cancel')) {
        log(`User cancelled purchase (${elapsed}s) — payment sheet DID appear ✓`, 'pass');
      } else {
        log(`Purchase error after ${elapsed}s: ${err.message} (code: ${err.code})`, 'fail');
        log(`Full error: ${JSON.stringify(err)}`, 'info');
      }
    }

    setRunning(false);
  };

  const statusColor = {
    pass: '#22c55e',
    fail: '#ef4444',
    warn: '#f59e0b',
    info: '#94a3b8',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: '#0f172a', color: '#e2e8f0',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'monospace', fontSize: '12px',
    }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #334155',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>🔧 IAP Diagnostic</span>
        <button onClick={onClose} style={{
          color: '#94a3b8', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer'
        }}>✕</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {logs.map((l, i) => (
          <div key={i} style={{ 
            color: statusColor[l.status] || '#e2e8f0',
            padding: '2px 0', lineHeight: '1.5',
            borderLeft: `2px solid ${statusColor[l.status] || '#334155'}`,
            paddingLeft: '8px', marginBottom: '2px',
          }}>
            <span style={{ color: '#64748b', marginRight: '6px' }}>{l.time}</span>
            {l.msg}
          </div>
        ))}
        {logs.length === 0 && (
          <p style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>
            Tap "Run Diagnostic" to start
          </p>
        )}
      </div>

      <div style={{
        padding: '12px 16px', borderTop: '1px solid #334155',
        display: 'flex', gap: '8px',
      }}>
        <button
          onClick={runDiagnostic}
          disabled={running}
          style={{
            flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
            backgroundColor: running ? '#334155' : '#3b82f6',
            color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
          }}
        >
          {running ? 'Running...' : 'Run Diagnostic'}
        </button>
        <button
          onClick={testPurchase}
          disabled={running}
          style={{
            flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
            backgroundColor: running ? '#334155' : '#22c55e',
            color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
          }}
        >
          Test Purchase
        </button>
      </div>
    </div>
  );
};

export default IAPDiagnostic;
