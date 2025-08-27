'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CookieConsentState, ConsentSettings, ConsentStatus } from '@/lib/analytics/types';

interface CookieConsentProps {
  onConsentChange?: (consent: ConsentSettings) => void;
  position?: 'bottom' | 'top' | 'center';
  theme?: 'light' | 'dark';
  companyName?: string;
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  customMessage?: string;
  enableGranularConsent?: boolean;
  debugMode?: boolean;
}

/**
 * GDPR/CCPA Compliant Cookie Consent Component
 * 
 * Features:
 * - Granular cookie consent options
 * - GDPR and CCPA compliance
 * - Persistent consent storage
 * - GA4 consent integration
 * - Customizable appearance
 * - Accessibility support
 */
export default function CookieConsent({
  onConsentChange,
  position = 'bottom',
  theme = 'light',
  companyName = 'Print Store',
  privacyPolicyUrl = '/privacy',
  cookiePolicyUrl = '/cookies',
  customMessage,
  enableGranularConsent = true,
  debugMode = false
}: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<CookieConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
    timestamp: Date.now(),
    version: '1.0'
  });

  const CONSENT_KEY = 'cookie-consent';
  const CONSENT_VERSION = '1.0';

  // Load saved consent on mount
  useEffect(() => {
    const savedConsent = loadConsentFromStorage();
    
    if (savedConsent) {
      // Check if consent is still valid (not expired and same version)
      const isValid = isConsentValid(savedConsent);
      
      if (isValid) {
        setConsent(savedConsent);
        applyConsent(convertToGA4Consent(savedConsent));
        
        if (debugMode) {
          console.log('CookieConsent: Loaded existing consent', savedConsent);
        }
      } else {
        // Show consent banner if saved consent is invalid
        setIsVisible(true);
        
        if (debugMode) {
          console.log('CookieConsent: Existing consent invalid, showing banner');
        }
      }
    } else {
      // No saved consent, show banner
      setIsVisible(true);
      
      if (debugMode) {
        console.log('CookieConsent: No existing consent, showing banner');
      }
    }
  }, [debugMode]);

  // Load consent from localStorage
  const loadConsentFromStorage = useCallback((): CookieConsentState | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (!saved) return null;
      
      const parsed = JSON.parse(saved) as CookieConsentState;
      return parsed;
    } catch (error) {
      console.warn('Failed to load cookie consent from storage:', error);
      return null;
    }
  }, []);

  // Save consent to localStorage
  const saveConsentToStorage = useCallback((consentState: CookieConsentState) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentState));
      
      if (debugMode) {
        console.log('CookieConsent: Saved consent to storage', consentState);
      }
    } catch (error) {
      console.error('Failed to save cookie consent to storage:', error);
    }
  }, [debugMode]);

  // Check if consent is still valid
  const isConsentValid = useCallback((consentState: CookieConsentState): boolean => {
    const now = Date.now();
    const oneYear = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    
    // Check expiration (1 year)
    const isNotExpired = (now - consentState.timestamp) < oneYear;
    
    // Check version
    const isCurrentVersion = consentState.version === CONSENT_VERSION;
    
    return isNotExpired && isCurrentVersion;
  }, []);

  // Convert internal consent state to GA4 consent format
  const convertToGA4Consent = useCallback((consentState: CookieConsentState): ConsentSettings => {
    return {
      ad_storage: consentState.marketing ? 'granted' : 'denied',
      analytics_storage: consentState.analytics ? 'granted' : 'denied',
      functionality_storage: consentState.preferences ? 'granted' : 'denied',
      personalization_storage: consentState.preferences ? 'granted' : 'denied',
      security_storage: 'granted', // Always granted for security
      ad_user_data: consentState.marketing ? 'granted' : 'denied',
      ad_personalization: consentState.marketing ? 'granted' : 'denied'
    };
  }, []);

  // Apply consent to GA4 and other services
  const applyConsent = useCallback((ga4Consent: ConsentSettings) => {
    // Update GA4 consent
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', ga4Consent);
      
      if (debugMode) {
        console.log('CookieConsent: Applied GA4 consent', ga4Consent);
      }
    }

    // Call callback if provided
    onConsentChange?.(ga4Consent);
  }, [onConsentChange, debugMode]);

  // Handle consent acceptance
  const handleAcceptAll = useCallback(() => {
    const newConsent: CookieConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };

    setConsent(newConsent);
    saveConsentToStorage(newConsent);
    applyConsent(convertToGA4Consent(newConsent));
    setIsVisible(false);

    if (debugMode) {
      console.log('CookieConsent: Accepted all cookies');
    }
  }, [saveConsentToStorage, applyConsent, convertToGA4Consent, debugMode]);

  // Handle consent rejection (only necessary cookies)
  const handleRejectAll = useCallback(() => {
    const newConsent: CookieConsentState = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };

    setConsent(newConsent);
    saveConsentToStorage(newConsent);
    applyConsent(convertToGA4Consent(newConsent));
    setIsVisible(false);

    if (debugMode) {
      console.log('CookieConsent: Rejected all optional cookies');
    }
  }, [saveConsentToStorage, applyConsent, convertToGA4Consent, debugMode]);

  // Handle granular consent save
  const handleSavePreferences = useCallback(() => {
    const newConsent: CookieConsentState = {
      ...consent,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };

    setConsent(newConsent);
    saveConsentToStorage(newConsent);
    applyConsent(convertToGA4Consent(newConsent));
    setIsVisible(false);
    setShowDetails(false);

    if (debugMode) {
      console.log('CookieConsent: Saved granular preferences', newConsent);
    }
  }, [consent, saveConsentToStorage, applyConsent, convertToGA4Consent, debugMode]);

  // Handle individual consent toggle
  const handleConsentToggle = useCallback((type: keyof Omit<CookieConsentState, 'timestamp' | 'version'>) => {
    if (type === 'necessary') return; // Necessary cookies cannot be disabled
    
    setConsent(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);

  // Position classes
  const positionClasses = {
    bottom: 'bottom-0 left-0 right-0',
    top: 'top-0 left-0 right-0',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  // Theme classes
  const themeClasses = {
    light: 'bg-white border-gray-200 text-gray-900',
    dark: 'bg-gray-900 border-gray-700 text-white'
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop for center position */}
      {position === 'center' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" />
      )}
      
      <div 
        className={`fixed ${positionClasses[position]} z-[9999] p-4`}
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
      >
        <Card className={`max-w-4xl mx-auto ${themeClasses[theme]} shadow-lg`}>
          <div className="p-6">
            {!showDetails ? (
              // Simple consent banner
              <>
                <h2 id="cookie-consent-title" className="text-lg font-semibold mb-3">
                  Cookie Preferences
                </h2>
                
                <p id="cookie-consent-description" className="text-sm mb-4">
                  {customMessage || (
                    <>
                      We use cookies to enhance your experience, analyze site traffic, and provide personalized content. 
                      By clicking "Accept All", you consent to our use of cookies as described in our{' '}
                      <a 
                        href={cookiePolicyUrl}
                        className="underline hover:no-underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Cookie Policy
                      </a>.
                    </>
                  )}
                </p>

                <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    onClick={() => setShowDetails(true)}
                    className="text-xs bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 px-3 py-1"
                  >
                    Customize
                  </Button>
                  
                  <Button
                    onClick={handleRejectAll}
                    className="text-xs bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 px-3 py-1"
                  >
                    Reject All
                  </Button>
                  
                  <Button
                    onClick={handleAcceptAll}
                    className="text-xs px-3 py-1"
                  >
                    Accept All
                  </Button>
                </div>
              </>
            ) : (
              // Detailed consent options
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Cookie Preferences</h2>
                  <Button
                    onClick={() => setShowDetails(false)}
                    className="bg-transparent text-gray-600 hover:bg-gray-100 border-0 px-3 py-1"
                    aria-label="Close detailed preferences"
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Necessary Cookies */}
                  <div className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">Necessary Cookies</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Essential cookies for basic site functionality, security, and user authentication. These cannot be disabled.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        aria-label="Necessary cookies (always enabled)"
                      />
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">Analytics Cookies</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={consent.analytics}
                        onChange={() => handleConsentToggle('analytics')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        aria-label="Toggle analytics cookies"
                      />
                    </div>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">Marketing Cookies</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Used to deliver personalized advertisements and track the effectiveness of our marketing campaigns.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={consent.marketing}
                        onChange={() => handleConsentToggle('marketing')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        aria-label="Toggle marketing cookies"
                      />
                    </div>
                  </div>

                  {/* Preference Cookies */}
                  <div className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">Preference Cookies</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Remember your settings and preferences to provide a more personalized experience on future visits.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={consent.preferences}
                        onChange={() => handleConsentToggle('preferences')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        aria-label="Toggle preference cookies"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Learn more about our data practices in our{' '}
                  <a 
                    href={privacyPolicyUrl}
                    className="underline hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a 
                    href={cookiePolicyUrl}
                    className="underline hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cookie Policy
                  </a>.
                </div>

                <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    onClick={handleRejectAll}
                    className="text-xs bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 px-3 py-1"
                  >
                    Reject All
                  </Button>
                  
                  <Button
                    onClick={handleAcceptAll}
                    className="text-xs bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 px-3 py-1"
                  >
                    Accept All
                  </Button>
                  
                  <Button
                    onClick={handleSavePreferences}
                    className="text-xs px-3 py-1"
                  >
                    Save Preferences
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

/**
 * Hook to manage cookie consent state
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentState | null>(null);
  
  useEffect(() => {
    const loadConsent = () => {
      try {
        const saved = localStorage.getItem('cookie-consent');
        if (saved) {
          const parsed = JSON.parse(saved) as CookieConsentState;
          setConsent(parsed);
        }
      } catch (error) {
        console.warn('Failed to load cookie consent:', error);
      }
    };

    loadConsent();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cookie-consent') {
        loadConsent();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateConsent = useCallback((newConsent: Partial<CookieConsentState>) => {
    const updated = {
      ...consent,
      ...newConsent,
      timestamp: Date.now(),
      version: '1.0'
    } as CookieConsentState;

    setConsent(updated);
    localStorage.setItem('cookie-consent', JSON.stringify(updated));
  }, [consent]);

  return {
    consent,
    updateConsent,
    hasConsent: consent !== null,
    hasAnalyticsConsent: consent?.analytics ?? false,
    hasMarketingConsent: consent?.marketing ?? false,
    hasPreferencesConsent: consent?.preferences ?? false
  };
}