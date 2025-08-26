import 'server-only';

import {
  PurchaseEvent,
  RefundEvent,
  LeadEvent,
  PrintStoreItem,
  GA4EventNames,
  AnalyticsError
} from './types';

interface ServerAnalyticsConfig {
  measurementId: string;
  apiSecret: string;
  debugMode?: boolean;
  enableRetries?: boolean;
  maxRetries?: number;
  timeout?: number;
}

interface MeasurementProtocolEvent {
  name: string;
  params: Record<string, any>;
}

interface MeasurementProtocolPayload {
  client_id: string;
  user_id?: string;
  timestamp_micros?: number;
  user_properties?: Record<string, any>;
  events: MeasurementProtocolEvent[];
}

/**
 * Server-side Google Analytics 4 tracking using Measurement Protocol
 * 
 * Handles server-side events for:
 * - Purchase confirmations
 * - Refund processing
 * - Lead generation
 * - User registration
 * - Server-side conversions
 */
class ServerAnalytics {
  private config: ServerAnalyticsConfig;
  private baseUrl = 'https://www.google-analytics.com';

  constructor(config: ServerAnalyticsConfig) {
    this.config = {
      debugMode: false,
      enableRetries: true,
      maxRetries: 3,
      timeout: 5000,
      ...config
    };

    if (!this.config.measurementId) {
      throw new Error('GA4 Measurement ID is required for server analytics');
    }

    if (!this.config.apiSecret) {
      throw new Error('GA4 API Secret is required for server analytics');
    }
  }

  /**
   * Send event to GA4 Measurement Protocol
   */
  private async sendEvent(payload: MeasurementProtocolPayload, retryCount = 0): Promise<boolean> {
    const endpoint = this.config.debugMode 
      ? `/debug/mp/collect`
      : `/mp/collect`;

    const url = `${this.baseUrl}${endpoint}?measurement_id=${this.config.measurementId}&api_secret=${this.config.apiSecret}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // In debug mode, log the response
      if (this.config.debugMode) {
        const responseText = await response.text();
        console.log('GA4 Server Response:', responseText);
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('GA4 Server Analytics Error:', {
        error: errorMessage,
        payload: this.config.debugMode ? payload : 'payload hidden',
        retryCount
      });

      // Retry logic
      if (this.config.enableRetries && retryCount < this.config.maxRetries!) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendEvent(payload, retryCount + 1);
      }

      return false;
    }
  }

  /**
   * Generate client ID from various sources
   */
  private generateClientId(
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): string {
    // Use user ID if available
    if (userId) {
      return `user_${userId}`;
    }

    // Use session ID if available
    if (sessionId) {
      return `session_${sessionId}`;
    }

    // Generate from IP and User Agent
    if (ipAddress && userAgent) {
      const hash = this.simpleHash(ipAddress + userAgent);
      return `generated_${hash}`;
    }

    // Fallback to timestamp-based ID
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simple hash function for generating consistent IDs
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Format print item for server-side tracking
   */
  private formatServerPrintItem(item: any): PrintStoreItem {
    return {
      item_id: item.id || item.print_id || item.item_id,
      item_name: item.title || item.name || item.item_name,
      print_id: item.id || item.print_id,
      print_title: item.title || item.name,
      artist_name: item.artist || item.artist_name,
      print_size: item.size || item.print_size || 'unknown',
      frame_option: item.frame || item.frame_option,
      paper_type: item.paper || item.paper_type,
      orientation: item.orientation || 'unknown',
      style_category: item.category || item.style_category || 'general',
      color_palette: Array.isArray(item.colors) ? item.colors : item.color_palette || [],
      room_category: item.room || item.room_category,
      base_price: Number(item.price || item.base_price || 0),
      frame_price: Number(item.frame_price || 0),
      shipping_cost: Number(item.shipping || item.shipping_cost || 0),
      stock_level: item.stock || item.stock_level,
      is_featured: Boolean(item.featured || item.is_featured),
      is_limited_edition: Boolean(item.limited_edition || item.is_limited_edition),
      tags: Array.isArray(item.tags) ? item.tags : [],
      collection: item.collection,
      category: item.category || item.style_category || 'prints',
      brand: 'Print Store',
      price: Number(item.price || item.base_price || 0),
      quantity: Number(item.quantity || 1)
    };
  }

  /**
   * Track server-side purchase event
   */
  async trackPurchase(options: {
    transactionId: string;
    items: any[];
    totalValue: number;
    currency?: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
    affiliation?: string;
    userId?: string;
    clientId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    userProperties?: Record<string, any>;
  }): Promise<boolean> {
    const {
      transactionId,
      items,
      totalValue,
      currency = 'USD',
      tax,
      shipping,
      coupon,
      affiliation,
      userId,
      clientId,
      sessionId,
      ipAddress,
      userAgent,
      userProperties
    } = options;

    const formattedItems = items.map(item => this.formatServerPrintItem(item));
    
    const event: PurchaseEvent = {
      currency,
      value: totalValue,
      transaction_id: transactionId,
      tax,
      shipping,
      coupon,
      items: formattedItems,
      affiliation
    };

    const payload: MeasurementProtocolPayload = {
      client_id: clientId || this.generateClientId(userId, sessionId, ipAddress, userAgent),
      user_id: userId,
      timestamp_micros: Date.now() * 1000,
      user_properties: userProperties,
      events: [{
        name: GA4EventNames.PURCHASE,
        params: event
      }]
    };

    const success = await this.sendEvent(payload);

    if (this.config.debugMode) {
      console.log('Server Purchase Tracking:', {
        success,
        transactionId,
        totalValue,
        itemCount: items.length
      });
    }

    return success;
  }

  /**
   * Track server-side refund event
   */
  async trackRefund(options: {
    transactionId: string;
    totalValue: number;
    currency?: string;
    items?: any[];
    userId?: string;
    clientId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    userProperties?: Record<string, any>;
  }): Promise<boolean> {
    const {
      transactionId,
      totalValue,
      currency = 'USD',
      items,
      userId,
      clientId,
      sessionId,
      ipAddress,
      userAgent,
      userProperties
    } = options;

    const event: RefundEvent = {
      currency,
      value: totalValue,
      transaction_id: transactionId,
      items: items ? items.map(item => this.formatServerPrintItem(item)) : undefined
    };

    const payload: MeasurementProtocolPayload = {
      client_id: clientId || this.generateClientId(userId, sessionId, ipAddress, userAgent),
      user_id: userId,
      timestamp_micros: Date.now() * 1000,
      user_properties: userProperties,
      events: [{
        name: GA4EventNames.REFUND,
        params: event
      }]
    };

    const success = await this.sendEvent(payload);

    if (this.config.debugMode) {
      console.log('Server Refund Tracking:', {
        success,
        transactionId,
        totalValue,
        itemCount: items?.length || 0
      });
    }

    return success;
  }

  /**
   * Track server-side lead generation
   */
  async trackLead(options: {
    leadType: 'newsletter' | 'contact_form' | 'custom_order_inquiry';
    source: string;
    value?: number;
    currency?: string;
    userId?: string;
    clientId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    userProperties?: Record<string, any>;
    additionalParams?: Record<string, any>;
  }): Promise<boolean> {
    const {
      leadType,
      source,
      value,
      currency = 'USD',
      userId,
      clientId,
      sessionId,
      ipAddress,
      userAgent,
      userProperties,
      additionalParams
    } = options;

    const event: LeadEvent = {
      lead_type: leadType,
      source,
      value
    };

    const payload: MeasurementProtocolPayload = {
      client_id: clientId || this.generateClientId(userId, sessionId, ipAddress, userAgent),
      user_id: userId,
      timestamp_micros: Date.now() * 1000,
      user_properties: userProperties,
      events: [{
        name: GA4EventNames.GENERATE_LEAD,
        params: {
          ...event,
          currency: value ? currency : undefined,
          ...additionalParams
        }
      }]
    };

    const success = await this.sendEvent(payload);

    if (this.config.debugMode) {
      console.log('Server Lead Tracking:', {
        success,
        leadType,
        source,
        value
      });
    }

    return success;
  }

  /**
   * Track user registration/sign up
   */
  async trackSignUp(options: {
    method?: string;
    userId?: string;
    clientId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    userProperties?: Record<string, any>;
  }): Promise<boolean> {
    const {
      method = 'email',
      userId,
      clientId,
      sessionId,
      ipAddress,
      userAgent,
      userProperties
    } = options;

    const payload: MeasurementProtocolPayload = {
      client_id: clientId || this.generateClientId(userId, sessionId, ipAddress, userAgent),
      user_id: userId,
      timestamp_micros: Date.now() * 1000,
      user_properties: userProperties,
      events: [{
        name: GA4EventNames.SIGN_UP,
        params: {
          method
        }
      }]
    };

    const success = await this.sendEvent(payload);

    if (this.config.debugMode) {
      console.log('Server Sign Up Tracking:', {
        success,
        method,
        userId: userId ? 'present' : 'missing'
      });
    }

    return success;
  }

  /**
   * Track user login
   */
  async trackLogin(options: {
    method?: string;
    userId?: string;
    clientId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    userProperties?: Record<string, any>;
  }): Promise<boolean> {
    const {
      method = 'email',
      userId,
      clientId,
      sessionId,
      ipAddress,
      userAgent,
      userProperties
    } = options;

    const payload: MeasurementProtocolPayload = {
      client_id: clientId || this.generateClientId(userId, sessionId, ipAddress, userAgent),
      user_id: userId,
      timestamp_micros: Date.now() * 1000,
      user_properties: userProperties,
      events: [{
        name: GA4EventNames.LOGIN,
        params: {
          method
        }
      }]
    };

    const success = await this.sendEvent(payload);

    if (this.config.debugMode) {
      console.log('Server Login Tracking:', {
        success,
        method,
        userId: userId ? 'present' : 'missing'
      });
    }

    return success;
  }

  /**
   * Track custom server-side event
   */
  async trackCustomEvent(options: {
    eventName: string;
    eventParams: Record<string, any>;
    userId?: string;
    clientId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    userProperties?: Record<string, any>;
  }): Promise<boolean> {
    const {
      eventName,
      eventParams,
      userId,
      clientId,
      sessionId,
      ipAddress,
      userAgent,
      userProperties
    } = options;

    const payload: MeasurementProtocolPayload = {
      client_id: clientId || this.generateClientId(userId, sessionId, ipAddress, userAgent),
      user_id: userId,
      timestamp_micros: Date.now() * 1000,
      user_properties: userProperties,
      events: [{
        name: eventName,
        params: eventParams
      }]
    };

    const success = await this.sendEvent(payload);

    if (this.config.debugMode) {
      console.log('Server Custom Event Tracking:', {
        success,
        eventName,
        paramsCount: Object.keys(eventParams).length
      });
    }

    return success;
  }

  /**
   * Batch track multiple events
   */
  async trackBatch(events: Array<{
    name: string;
    params: Record<string, any>;
  }>, options: {
    userId?: string;
    clientId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    userProperties?: Record<string, any>;
  }): Promise<boolean> {
    const {
      userId,
      clientId,
      sessionId,
      ipAddress,
      userAgent,
      userProperties
    } = options;

    const payload: MeasurementProtocolPayload = {
      client_id: clientId || this.generateClientId(userId, sessionId, ipAddress, userAgent),
      user_id: userId,
      timestamp_micros: Date.now() * 1000,
      user_properties: userProperties,
      events: events.map(event => ({
        name: event.name,
        params: event.params
      }))
    };

    const success = await this.sendEvent(payload);

    if (this.config.debugMode) {
      console.log('Server Batch Tracking:', {
        success,
        eventCount: events.length,
        eventNames: events.map(e => e.name)
      });
    }

    return success;
  }
}

// Singleton instance management
let serverAnalyticsInstance: ServerAnalytics | null = null;

/**
 * Initialize server analytics with configuration
 */
export function initializeServerAnalytics(config: ServerAnalyticsConfig): ServerAnalytics {
  serverAnalyticsInstance = new ServerAnalytics(config);
  return serverAnalyticsInstance;
}

/**
 * Get the current server analytics instance
 */
export function getServerAnalytics(): ServerAnalytics | null {
  return serverAnalyticsInstance;
}

/**
 * Convenience functions for common server-side tracking
 */
export async function trackServerPurchase(options: Parameters<ServerAnalytics['trackPurchase']>[0]): Promise<boolean> {
  const analytics = getServerAnalytics();
  if (!analytics) {
    console.warn('Server analytics not initialized');
    return false;
  }
  return analytics.trackPurchase(options);
}

export async function trackServerRefund(options: Parameters<ServerAnalytics['trackRefund']>[0]): Promise<boolean> {
  const analytics = getServerAnalytics();
  if (!analytics) {
    console.warn('Server analytics not initialized');
    return false;
  }
  return analytics.trackRefund(options);
}

export async function trackServerLead(options: Parameters<ServerAnalytics['trackLead']>[0]): Promise<boolean> {
  const analytics = getServerAnalytics();
  if (!analytics) {
    console.warn('Server analytics not initialized');
    return false;
  }
  return analytics.trackLead(options);
}

export async function trackServerSignUp(options: Parameters<ServerAnalytics['trackSignUp']>[0]): Promise<boolean> {
  const analytics = getServerAnalytics();
  if (!analytics) {
    console.warn('Server analytics not initialized');
    return false;
  }
  return analytics.trackSignUp(options);
}

export async function trackServerLogin(options: Parameters<ServerAnalytics['trackLogin']>[0]): Promise<boolean> {
  const analytics = getServerAnalytics();
  if (!analytics) {
    console.warn('Server analytics not initialized');
    return false;
  }
  return analytics.trackLogin(options);
}

export default ServerAnalytics;