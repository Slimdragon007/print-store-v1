'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { AnalyticsConfig, ConsentSettings } from '@/lib/analytics/types';

interface GoogleAnalyticsProps {
  measurementId: string;
  debugMode?: boolean;
  enableEcommerce?: boolean;
  enableEnhancedEcommerce?: boolean;
  consent?: ConsentSettings;
  customConfig?: Partial<AnalyticsConfig>;
}

/**
 * Google Analytics 4 Component
 * 
 * Handles GA4 initialization, consent management, and configuration.
 * Includes performance optimization with lazy loading and error handling.
 * 
 * @param measurementId - GA4 Measurement ID (G-XXXXXXXXXX)
 * @param debugMode - Enable debug mode for development
 * @param enableEcommerce - Enable e-commerce tracking
 * @param enableEnhancedEcommerce - Enable enhanced e-commerce features
 * @param consent - Cookie consent settings
 * @param customConfig - Additional GA4 configuration
 */
export default function GoogleAnalytics({
  measurementId,
  debugMode = false,
  enableEcommerce = true,
  enableEnhancedEcommerce = true,
  consent,
  customConfig
}: GoogleAnalyticsProps) {
  // Don't load analytics in development unless debug mode is enabled
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldLoad = isProduction || debugMode;

  useEffect(() => {
    if (!shouldLoad || !measurementId) {
      if (debugMode) {
        console.log('GA4: Analytics not loaded', {
          shouldLoad,
          measurementId: measurementId ? 'present' : 'missing',
          environment: process.env.NODE_ENV
        });
      }
      return;
    }

    // Initialize dataLayer if it doesn't exist
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      
      // Define gtag function
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };

      // Set up initial consent state
      if (consent) {
        window.gtag('consent', 'default', consent);
        
        if (debugMode) {
          console.log('GA4: Consent initialized', consent);
        }
      }

      // Configure GA4 with timestamp
      window.gtag('js', new Date());
      
      // Basic GA4 configuration
      const config: Record<string, any> = {
        debug_mode: debugMode,
        send_page_view: true,
        allow_google_signals: true,
        allow_ad_personalization_signals: true,
        ...customConfig
      };

      // Add e-commerce configuration
      if (enableEcommerce) {
        config.custom_map = {
          'custom_parameter_print_id': 'print_id',
          'custom_parameter_artist_name': 'artist_name',
          'custom_parameter_print_size': 'print_size',
          'custom_parameter_frame_option': 'frame_option',
          'custom_parameter_style_category': 'style_category',
          ...config.custom_map
        };
      }

      window.gtag('config', measurementId, config);

      if (debugMode) {
        console.log('GA4: Initialized', {
          measurementId,
          config,
          enableEcommerce,
          enableEnhancedEcommerce
        });
      }
    }
  }, [measurementId, debugMode, enableEcommerce, enableEnhancedEcommerce, consent, customConfig, shouldLoad]);

  // Handle consent updates
  useEffect(() => {
    if (!shouldLoad || !consent || typeof window === 'undefined') return;

    window.gtag?.('consent', 'update', consent);
    
    if (debugMode) {
      console.log('GA4: Consent updated', consent);
    }
  }, [consent, debugMode, shouldLoad]);

  if (!shouldLoad || !measurementId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => {
          if (debugMode) {
            console.log('GA4: Script loaded successfully');
          }
        }}
        onError={(e) => {
          console.error('GA4: Failed to load script', e);
        }}
      />

      {/* Enhanced E-commerce Script */}
      {enableEnhancedEcommerce && (
        <Script
          id="ga4-enhanced-ecommerce"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              
              // Enhanced E-commerce Configuration
              gtag('config', '${measurementId}', {
                custom_map: {
                  'custom_parameter_print_id': 'print_id',
                  'custom_parameter_artist_name': 'artist_name',
                  'custom_parameter_print_size': 'print_size',
                  'custom_parameter_frame_option': 'frame_option',
                  'custom_parameter_paper_type': 'paper_type',
                  'custom_parameter_style_category': 'style_category',
                  'custom_parameter_color_palette': 'color_palette',
                  'custom_parameter_room_category': 'room_category',
                  'custom_parameter_is_featured': 'is_featured',
                  'custom_parameter_is_limited_edition': 'is_limited_edition',
                  'custom_parameter_collection': 'collection'
                }
              });

              // Error handling for analytics
              window.addEventListener('error', function(e) {
                if (e.filename && e.filename.includes('googletagmanager')) {
                  console.warn('GA4: Analytics error caught', e.message);
                }
              });

              ${debugMode ? `
                // Debug mode logging
                console.log('GA4: Enhanced e-commerce initialized');
                
                // Track dataLayer pushes in debug mode
                const originalPush = window.dataLayer.push;
                window.dataLayer.push = function(...args) {
                  console.log('GA4 DataLayer:', ...args);
                  return originalPush.apply(this, args);
                };
              ` : ''}
            `,
          }}
        />
      )}

      {/* Debug Mode Utilities */}
      {debugMode && (
        <Script
          id="ga4-debug-utilities"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Debug utilities
              window.GA4Debug = {
                // Test event tracking
                testEvent: function(eventName, parameters) {
                  console.log('GA4 Test Event:', eventName, parameters);
                  gtag('event', eventName, parameters);
                },
                
                // View current dataLayer
                viewDataLayer: function() {
                  console.log('GA4 DataLayer:', window.dataLayer);
                },
                
                // Check GA4 status
                checkStatus: function() {
                  console.log('GA4 Status:', {
                    measurementId: '${measurementId}',
                    dataLayer: !!window.dataLayer,
                    gtag: !!window.gtag,
                    gtagLoaded: typeof gtag !== 'undefined'
                  });
                },
                
                // Test e-commerce event
                testPurchase: function() {
                  gtag('event', 'purchase', {
                    transaction_id: 'test_' + Date.now(),
                    value: 25.99,
                    currency: 'USD',
                    items: [{
                      item_id: 'test_print_001',
                      item_name: 'Test Abstract Print',
                      category: 'Abstract Art',
                      quantity: 1,
                      price: 25.99
                    }]
                  });
                  console.log('GA4: Test purchase event sent');
                }
              };
              
              console.log('GA4 Debug utilities available on window.GA4Debug');
            `,
          }}
        />
      )}
    </>
  );
}

/**
 * Lightweight GA4 Provider for pages that need basic tracking
 */
export function GA4Provider({ 
  children, 
  measurementId,
  ...props 
}: GoogleAnalyticsProps & { children: React.ReactNode }) {
  return (
    <>
      <GoogleAnalytics measurementId={measurementId} {...props} />
      {children}
    </>
  );
}