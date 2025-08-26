import { AnalyticsConfig, ConsentSettings } from './types';

/**
 * Analytics Configuration Module
 * 
 * Centralizes all analytics configuration including:
 * - GA4 settings
 * - Environment variables
 * - Default configurations
 * - Feature flags
 */

// Environment Variables Interface
interface AnalyticsEnv {
  GA4_MEASUREMENT_ID?: string;
  GA4_API_SECRET?: string;
  ENABLE_ANALYTICS?: string;
  ENABLE_ENHANCED_ECOMMERCE?: string;
  ENABLE_DEBUG_MODE?: string;
  ANALYTICS_SAMPLE_RATE?: string;
  COOKIE_DOMAIN?: string;
  COOKIE_PREFIX?: string;
}

/**
 * Get analytics environment variables with fallbacks
 */
function getAnalyticsEnv(): AnalyticsEnv {
  if (typeof process === 'undefined' || !process.env) {
    return {};
  }

  return {
    GA4_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
    GA4_API_SECRET: process.env.GA4_API_SECRET,
    ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    ENABLE_ENHANCED_ECOMMERCE: process.env.NEXT_PUBLIC_ENABLE_ENHANCED_ECOMMERCE,
    ENABLE_DEBUG_MODE: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_DEBUG,
    ANALYTICS_SAMPLE_RATE: process.env.NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE,
    COOKIE_DOMAIN: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
    COOKIE_PREFIX: process.env.NEXT_PUBLIC_COOKIE_PREFIX
  };
}

/**
 * Default analytics configuration
 */
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  ga4MeasurementId: '',
  debugMode: false,
  enableEcommerce: true,
  enableEnhancedEcommerce: true,
  enableUserProperties: true,
  enableCustomDimensions: true,
  cookiePrefix: '_ga',
  cookieDomain: 'auto',
  cookieExpires: 365 * 24 * 60 * 60, // 1 year in seconds
  sampleRate: 100,
  sendPageView: true,
  allowAdFeatures: true,
  allowGoogleSignals: true
};

/**
 * Get complete analytics configuration
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  const env = getAnalyticsEnv();
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    ...DEFAULT_ANALYTICS_CONFIG,
    ga4MeasurementId: env.GA4_MEASUREMENT_ID || '',
    debugMode: env.ENABLE_DEBUG_MODE === 'true' || isDevelopment,
    enableEcommerce: env.ENABLE_ANALYTICS !== 'false',
    enableEnhancedEcommerce: env.ENABLE_ENHANCED_ECOMMERCE !== 'false',
    sampleRate: env.ANALYTICS_SAMPLE_RATE ? parseInt(env.ANALYTICS_SAMPLE_RATE, 10) : 100,
    cookieDomain: env.COOKIE_DOMAIN || (typeof window !== 'undefined' ? window.location.hostname : 'auto'),
    cookiePrefix: env.COOKIE_PREFIX || '_ga',
    // Disable ad features in development unless explicitly enabled
    allowAdFeatures: isProduction || env.ENABLE_DEBUG_MODE === 'true',
    allowGoogleSignals: isProduction || env.ENABLE_DEBUG_MODE === 'true'
  };
}

/**
 * Server-side analytics configuration
 */
export function getServerAnalyticsConfig() {
  const env = getAnalyticsEnv();
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    measurementId: env.GA4_MEASUREMENT_ID || '',
    apiSecret: env.GA4_API_SECRET || '',
    debugMode: env.ENABLE_DEBUG_MODE === 'true' || !isProduction,
    enableRetries: true,
    maxRetries: 3,
    timeout: 5000
  };
}

/**
 * Default consent settings (restrictive by default for GDPR compliance)
 */
export const DEFAULT_CONSENT_SETTINGS: ConsentSettings = {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted', // Required for basic functionality
  personalization_storage: 'denied',
  security_storage: 'granted', // Required for security
  ad_user_data: 'denied',
  ad_personalization: 'denied'
};

/**
 * Consent settings after user accepts all cookies
 */
export const FULL_CONSENT_SETTINGS: ConsentSettings = {
  ad_storage: 'granted',
  analytics_storage: 'granted',
  functionality_storage: 'granted',
  personalization_storage: 'granted',
  security_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted'
};

/**
 * Check if analytics is enabled based on configuration and environment
 */
export function isAnalyticsEnabled(): boolean {
  const env = getAnalyticsEnv();
  
  // Explicitly disabled
  if (env.ENABLE_ANALYTICS === 'false') {
    return false;
  }

  // Require measurement ID
  if (!env.GA4_MEASUREMENT_ID) {
    console.warn('Analytics: GA4 Measurement ID not configured');
    return false;
  }

  return true;
}

/**
 * Check if server-side analytics is available
 */
export function isServerAnalyticsEnabled(): boolean {
  const env = getAnalyticsEnv();
  
  return !!(env.GA4_MEASUREMENT_ID && env.GA4_API_SECRET);
}

/**
 * Get cookie configuration for analytics
 */
export function getCookieConfig() {
  const config = getAnalyticsConfig();
  
  return {
    prefix: config.cookiePrefix,
    domain: config.cookieDomain,
    expires: config.cookieExpires,
    secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : true,
    sameSite: 'strict' as const
  };
}

/**
 * Feature flags for analytics functionality
 */
export const ANALYTICS_FEATURES = {
  // Core features
  GA4_TRACKING: isAnalyticsEnabled(),
  ENHANCED_ECOMMERCE: isAnalyticsEnabled(),
  SERVER_SIDE_TRACKING: isServerAnalyticsEnabled(),
  
  // Advanced features
  USER_PROPERTIES: true,
  CUSTOM_DIMENSIONS: true,
  CONVERSION_TRACKING: true,
  AUDIENCE_TRACKING: true,
  
  // Privacy features
  COOKIE_CONSENT: true,
  GDPR_COMPLIANCE: true,
  CCPA_COMPLIANCE: true,
  
  // Development features
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  EVENT_VALIDATION: true,
  OFFLINE_QUEUE: true,
  
  // Performance features
  LAZY_LOADING: true,
  BATCH_EVENTS: true,
  PERFORMANCE_MONITORING: true
} as const;

/**
 * Analytics endpoints configuration
 */
export const ANALYTICS_ENDPOINTS = {
  GA4_COLLECT: 'https://www.google-analytics.com/mp/collect',
  GA4_DEBUG: 'https://www.google-analytics.com/debug/mp/collect',
  GA4_CONFIG: 'https://www.googletagmanager.com/gtag/js'
} as const;

/**
 * Event configuration and limits
 */
export const EVENT_CONFIG = {
  // Event queue limits
  MAX_QUEUE_SIZE: 100,
  QUEUE_FLUSH_INTERVAL: 30000, // 30 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000, // 1 second base delay
  RETRY_BACKOFF_MULTIPLIER: 2,
  
  // Event validation
  MAX_EVENT_NAME_LENGTH: 40,
  MAX_PARAMETER_NAME_LENGTH: 40,
  MAX_PARAMETER_VALUE_LENGTH: 500,
  MAX_PARAMETERS_PER_EVENT: 25,
  
  // Rate limiting
  MAX_EVENTS_PER_SECOND: 10,
  MAX_EVENTS_PER_MINUTE: 100
} as const;

/**
 * Custom dimensions mapping for GA4
 */
export const CUSTOM_DIMENSIONS = {
  USER_TYPE: 'user_type',
  CUSTOMER_LIFETIME_VALUE: 'customer_lifetime_value',
  PREFERRED_CATEGORY: 'preferred_category',
  DEVICE_TYPE: 'device_type',
  TRAFFIC_SOURCE: 'traffic_source',
  CART_ABANDONMENT_STAGE: 'cart_abandonment_stage',
  PURCHASE_INTENT_SCORE: 'purchase_intent_score',
  PRINT_ARTIST: 'print_artist',
  PRINT_STYLE: 'print_style',
  FRAME_PREFERENCE: 'frame_preference',
  SIZE_PREFERENCE: 'size_preference'
} as const;

/**
 * Validation functions
 */
export function validateMeasurementId(measurementId: string): boolean {
  return /^G-[A-Z0-9]{10}$/.test(measurementId);
}

export function validateApiSecret(apiSecret: string): boolean {
  return /^[A-Za-z0-9_-]{20,}$/.test(apiSecret);
}

/**
 * Environment setup validation
 */
export function validateAnalyticsSetup(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const env = getAnalyticsEnv();

  // Check measurement ID
  if (!env.GA4_MEASUREMENT_ID) {
    errors.push('GA4_MEASUREMENT_ID is not configured');
  } else if (!validateMeasurementId(env.GA4_MEASUREMENT_ID)) {
    errors.push('GA4_MEASUREMENT_ID format is invalid (should be G-XXXXXXXXXX)');
  }

  // Check API secret for server-side tracking
  if (!env.GA4_API_SECRET) {
    warnings.push('GA4_API_SECRET is not configured (server-side tracking will be disabled)');
  } else if (!validateApiSecret(env.GA4_API_SECRET)) {
    warnings.push('GA4_API_SECRET format appears invalid');
  }

  // Check environment consistency
  if (process.env.NODE_ENV === 'production' && env.ENABLE_DEBUG_MODE === 'true') {
    warnings.push('Debug mode is enabled in production environment');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get analytics configuration summary for debugging
 */
export function getAnalyticsConfigSummary() {
  const config = getAnalyticsConfig();
  const validation = validateAnalyticsSetup();
  
  return {
    measurementId: config.ga4MeasurementId ? 
      `${config.ga4MeasurementId.slice(0, 5)}...` : 
      'Not configured',
    serverSideEnabled: isServerAnalyticsEnabled(),
    debugMode: config.debugMode,
    environment: process.env.NODE_ENV,
    features: Object.entries(ANALYTICS_FEATURES)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature),
    validation: {
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length
    }
  };
}

export default {
  getAnalyticsConfig,
  getServerAnalyticsConfig,
  isAnalyticsEnabled,
  isServerAnalyticsEnabled,
  validateAnalyticsSetup,
  getAnalyticsConfigSummary,
  ANALYTICS_FEATURES,
  DEFAULT_CONSENT_SETTINGS,
  FULL_CONSENT_SETTINGS
};