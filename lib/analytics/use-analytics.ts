'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  PrintStoreItem,
  ViewItemEvent,
  AddToCartEvent,
  RemoveFromCartEvent,
  ViewCartEvent,
  BeginCheckoutEvent,
  PurchaseEvent,
  RefundEvent,
  ImageZoomEvent,
  SizeSelectionEvent,
  FrameSelectionEvent,
  PrintCustomizationEvent,
  SearchEvent,
  FilterAppliedEvent,
  WishlistEvent,
  NewsletterSignupEvent,
  SocialShareEvent,
  LeadEvent,
  ContactFormEvent,
  PageViewEvent,
  QueuedEvent,
  GA4EventNames,
  AnalyticsError
} from './types';

interface UseAnalyticsConfig {
  enableOfflineQueue?: boolean;
  enableErrorTracking?: boolean;
  debugMode?: boolean;
  queueMaxSize?: number;
  retryAttempts?: number;
}

/**
 * Enhanced Analytics Hook for Print Store
 * 
 * Provides comprehensive tracking capabilities including:
 * - E-commerce events (view, add to cart, purchase, etc.)
 * - Custom print store events (zoom, size selection, etc.)
 * - User engagement events
 * - Performance tracking
 * - Offline event queuing
 * - Error handling and retry logic
 */
export function useAnalytics(config: UseAnalyticsConfig = {}) {
  const {
    enableOfflineQueue = true,
    enableErrorTracking = true,
    debugMode = false,
    queueMaxSize = 100,
    retryAttempts = 3
  } = config;

  const eventQueue = useRef<QueuedEvent[]>([]);
  const isOnline = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Initialize online/offline detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      isOnline.current = true;
      processEventQueue();
    };

    const handleOffline = () => {
      isOnline.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process queued events when coming back online
  const processEventQueue = useCallback(() => {
    if (!enableOfflineQueue || eventQueue.current.length === 0) return;

    const queueToProcess = [...eventQueue.current];
    eventQueue.current = [];

    queueToProcess.forEach(({ eventName, parameters, retryCount }) => {
      if (retryCount < retryAttempts) {
        sendEvent(eventName, parameters, retryCount + 1);
      } else {
        logError({
          code: 'MAX_RETRIES_EXCEEDED',
          message: `Failed to send event after ${retryAttempts} attempts`,
          timestamp: Date.now(),
          context: { eventName, parameters }
        });
      }
    });

    if (debugMode) {
      console.log('Analytics: Processed offline queue', queueToProcess.length, 'events');
    }
  }, [enableOfflineQueue, retryAttempts, debugMode]);

  // Core event sending function
  const sendEvent = useCallback((
    eventName: string, 
    parameters: Record<string, any>, 
    retryCount = 0
  ) => {
    if (typeof window === 'undefined' || !window.gtag) {
      if (debugMode) {
        console.warn('Analytics: gtag not available', { eventName, parameters });
      }
      return;
    }

    try {
      // Add timestamp and session info
      const enrichedParameters = {
        ...parameters,
        timestamp: Date.now(),
        session_id: getSessionId(),
        page_url: window.location.href,
        page_referrer: document.referrer || 'direct'
      };

      // Queue event if offline
      if (!isOnline.current && enableOfflineQueue) {
        if (eventQueue.current.length < queueMaxSize) {
          eventQueue.current.push({
            eventName,
            parameters: enrichedParameters,
            timestamp: Date.now(),
            retryCount
          });
          
          if (debugMode) {
            console.log('Analytics: Event queued for offline', eventName);
          }
        }
        return;
      }

      // Send event
      window.gtag('event', eventName, enrichedParameters);

      if (debugMode) {
        console.log('Analytics: Event sent', eventName, enrichedParameters);
      }

    } catch (error) {
      logError({
        code: 'EVENT_SEND_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        context: { eventName, parameters, retryCount }
      });

      // Retry logic
      if (retryCount < retryAttempts && enableOfflineQueue) {
        setTimeout(() => {
          sendEvent(eventName, parameters, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff
      }
    }
  }, [debugMode, enableOfflineQueue, queueMaxSize, retryAttempts]);

  // Error logging function
  const logError = useCallback((error: AnalyticsError) => {
    if (!enableErrorTracking) return;

    console.error('Analytics Error:', error);

    // Send error as custom event
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', 'analytics_error', {
          error_code: error.code,
          error_message: error.message,
          error_timestamp: error.timestamp,
          error_context: JSON.stringify(error.context)
        });
      } catch (e) {
        console.error('Failed to send analytics error event:', e);
      }
    }
  }, [enableErrorTracking]);

  // Get or create session ID
  const getSessionId = useCallback(() => {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Helper function to convert print data to GA4 item format
  const formatPrintItem = useCallback((print: any): PrintStoreItem => {
    return {
      item_id: print.id || print.print_id,
      item_name: print.title || print.name,
      print_id: print.id || print.print_id,
      print_title: print.title || print.name,
      artist_name: print.artist || print.artist_name,
      print_size: print.size || print.selectedSize || 'unknown',
      frame_option: print.frame || print.frame_option,
      paper_type: print.paper || print.paper_type,
      orientation: print.orientation || 'unknown',
      style_category: print.category || print.style_category || 'general',
      color_palette: Array.isArray(print.colors) ? print.colors : [],
      room_category: print.room || print.room_category,
      base_price: print.price || print.base_price || 0,
      frame_price: print.frame_price || 0,
      shipping_cost: print.shipping || print.shipping_cost || 0,
      stock_level: print.stock,
      is_featured: print.featured || print.is_featured || false,
      is_limited_edition: print.limited_edition || print.is_limited_edition || false,
      tags: Array.isArray(print.tags) ? print.tags : [],
      collection: print.collection,
      category: print.category || print.style_category || 'prints',
      brand: 'Print Store',
      price: print.price || print.base_price || 0,
      quantity: print.quantity || 1
    };
  }, []);

  // E-commerce Events
  const trackViewItem = useCallback((item: any) => {
    const formattedItem = formatPrintItem(item);
    const event: ViewItemEvent = {
      currency: 'USD',
      value: formattedItem.price,
      items: [formattedItem]
    };
    sendEvent(GA4EventNames.VIEW_ITEM, event);
  }, [formatPrintItem, sendEvent]);

  const trackAddToCart = useCallback((items: any[]) => {
    const formattedItems = items.map(formatPrintItem);
    const totalValue = formattedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    const event: AddToCartEvent = {
      currency: 'USD',
      value: totalValue,
      items: formattedItems
    };
    sendEvent(GA4EventNames.ADD_TO_CART, event);
  }, [formatPrintItem, sendEvent]);

  const trackRemoveFromCart = useCallback((items: any[]) => {
    const formattedItems = items.map(formatPrintItem);
    const totalValue = formattedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    const event: RemoveFromCartEvent = {
      currency: 'USD',
      value: totalValue,
      items: formattedItems
    };
    sendEvent(GA4EventNames.REMOVE_FROM_CART, event);
  }, [formatPrintItem, sendEvent]);

  const trackViewCart = useCallback((items: any[]) => {
    const formattedItems = items.map(formatPrintItem);
    const totalValue = formattedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    const event: ViewCartEvent = {
      currency: 'USD',
      value: totalValue,
      items: formattedItems
    };
    sendEvent(GA4EventNames.VIEW_CART, event);
  }, [formatPrintItem, sendEvent]);

  const trackBeginCheckout = useCallback((items: any[], coupon?: string) => {
    const formattedItems = items.map(formatPrintItem);
    const totalValue = formattedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    const event: BeginCheckoutEvent = {
      currency: 'USD',
      value: totalValue,
      items: formattedItems,
      coupon
    };
    sendEvent(GA4EventNames.BEGIN_CHECKOUT, event);
  }, [formatPrintItem, sendEvent]);

  const trackPurchase = useCallback((
    transactionId: string,
    items: any[],
    totalValue: number,
    tax?: number,
    shipping?: number,
    coupon?: string,
    affiliation?: string
  ) => {
    const formattedItems = items.map(formatPrintItem);
    
    const event: PurchaseEvent = {
      currency: 'USD',
      value: totalValue,
      transaction_id: transactionId,
      tax,
      shipping,
      coupon,
      items: formattedItems,
      affiliation
    };
    sendEvent(GA4EventNames.PURCHASE, event);
  }, [formatPrintItem, sendEvent]);

  const trackRefund = useCallback((
    transactionId: string,
    totalValue: number,
    items?: any[]
  ) => {
    const event: RefundEvent = {
      currency: 'USD',
      value: totalValue,
      transaction_id: transactionId,
      items: items ? items.map(formatPrintItem) : undefined
    };
    sendEvent(GA4EventNames.REFUND, event);
  }, [formatPrintItem, sendEvent]);

  // Custom Print Store Events
  const trackImageZoom = useCallback((
    itemId: string,
    itemName: string,
    zoomLevel: number,
    interactionType: 'click' | 'hover' | 'pinch'
  ) => {
    const event: ImageZoomEvent = {
      item_id: itemId,
      item_name: itemName,
      zoom_level: zoomLevel,
      interaction_type: interactionType
    };
    sendEvent(GA4EventNames.IMAGE_ZOOM, event);
  }, [sendEvent]);

  const trackSizeSelection = useCallback((
    itemId: string,
    itemName: string,
    selectedSize: string,
    previousSize?: string,
    priceChange: number = 0
  ) => {
    const event: SizeSelectionEvent = {
      item_id: itemId,
      item_name: itemName,
      selected_size: selectedSize,
      previous_size: previousSize,
      price_change: priceChange
    };
    sendEvent(GA4EventNames.SIZE_SELECTION, event);
  }, [sendEvent]);

  const trackFrameSelection = useCallback((
    itemId: string,
    itemName: string,
    frameType: string,
    frameColor?: string,
    additionalCost: number = 0
  ) => {
    const event: FrameSelectionEvent = {
      item_id: itemId,
      item_name: itemName,
      frame_type: frameType,
      frame_color: frameColor,
      additional_cost: additionalCost
    };
    sendEvent(GA4EventNames.FRAME_SELECTION, event);
  }, [sendEvent]);

  const trackPrintCustomization = useCallback((
    itemId: string,
    itemName: string,
    customizationType: 'size' | 'frame' | 'paper' | 'matting',
    customizationValue: string,
    priceImpact: number = 0
  ) => {
    const event: PrintCustomizationEvent = {
      item_id: itemId,
      item_name: itemName,
      customization_type: customizationType,
      customization_value: customizationValue,
      price_impact: priceImpact
    };
    sendEvent(GA4EventNames.PRINT_CUSTOMIZATION, event);
  }, [sendEvent]);

  const trackSearch = useCallback((
    searchTerm: string,
    resultsCount: number,
    filtersApplied?: Record<string, string>,
    sortOrder?: string
  ) => {
    const event: SearchEvent = {
      search_term: searchTerm,
      results_count: resultsCount,
      filters_applied: filtersApplied,
      sort_order: sortOrder
    };
    sendEvent(GA4EventNames.SEARCH, event);
  }, [sendEvent]);

  const trackFilterApplied = useCallback((
    filterType: string,
    filterValue: string,
    resultsCount: number,
    previousResultsCount: number
  ) => {
    const event: FilterAppliedEvent = {
      filter_type: filterType,
      filter_value: filterValue,
      results_count: resultsCount,
      previous_results_count: previousResultsCount
    };
    sendEvent(GA4EventNames.FILTER_APPLIED, event);
  }, [sendEvent]);

  const trackWishlistAction = useCallback((
    action: 'add' | 'remove',
    itemId: string,
    itemName: string,
    wishlistSize: number
  ) => {
    const event: WishlistEvent = {
      action,
      item_id: itemId,
      item_name: itemName,
      wishlist_size: wishlistSize
    };
    sendEvent(GA4EventNames.WISHLIST_ACTION, event);
  }, [sendEvent]);

  const trackNewsletterSignup = useCallback((
    signupLocation: string,
    userType: 'new' | 'existing',
    incentiveOffered?: string
  ) => {
    const event: NewsletterSignupEvent = {
      signup_location: signupLocation,
      user_type: userType,
      incentive_offered: incentiveOffered
    };
    sendEvent(GA4EventNames.NEWSLETTER_SIGNUP, event);
  }, [sendEvent]);

  const trackSocialShare = useCallback((
    itemId: string,
    itemName: string,
    platform: 'facebook' | 'twitter' | 'pinterest' | 'instagram' | 'email',
    shareType: 'product' | 'collection' | 'general'
  ) => {
    const event: SocialShareEvent = {
      item_id: itemId,
      item_name: itemName,
      platform,
      share_type: shareType
    };
    sendEvent(GA4EventNames.SOCIAL_SHARE, event);
  }, [sendEvent]);

  const trackLead = useCallback((
    leadType: 'newsletter' | 'contact_form' | 'custom_order_inquiry',
    source: string,
    value?: number
  ) => {
    const event: LeadEvent = {
      lead_type: leadType,
      source,
      value
    };
    sendEvent(GA4EventNames.GENERATE_LEAD, event);
  }, [sendEvent]);

  const trackContactForm = useCallback((
    formType: 'general' | 'custom_order' | 'support',
    inquiryCategory?: string,
    itemsReferenced?: string[]
  ) => {
    const event: ContactFormEvent = {
      form_type: formType,
      inquiry_category: inquiryCategory,
      items_referenced: itemsReferenced
    };
    sendEvent(GA4EventNames.CONTACT_FORM_SUBMIT, event);
  }, [sendEvent]);

  const trackPageView = useCallback((
    pageTitle: string,
    pageLocation?: string,
    pageReferrer?: string,
    contentGroups?: Record<string, string>
  ) => {
    const event: PageViewEvent = {
      page_title: pageTitle,
      page_location: pageLocation || (typeof window !== 'undefined' ? window.location.href : ''),
      page_referrer: pageReferrer || (typeof document !== 'undefined' ? document.referrer : ''),
      ...contentGroups
    };
    sendEvent(GA4EventNames.PAGE_VIEW, event);
  }, [sendEvent]);

  // Performance tracking
  const trackPerformance = useCallback(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    try {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = window.performance.getEntriesByType('paint');
      
      const metrics = {
        page_load_time: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        dom_content_loaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
        first_contentful_paint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        dns_time: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
        tcp_time: Math.round(navigation.connectEnd - navigation.connectStart),
        server_response_time: Math.round(navigation.responseStart - navigation.requestStart),
        dom_processing_time: Math.round(navigation.domComplete - navigation.domLoading)
      };

      sendEvent('page_performance', metrics);
    } catch (error) {
      logError({
        code: 'PERFORMANCE_TRACKING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown performance tracking error',
        timestamp: Date.now(),
        context: {}
      });
    }
  }, [sendEvent, logError]);

  // Custom event for any additional tracking needs
  const trackCustomEvent = useCallback((
    eventName: string,
    parameters: Record<string, any>
  ) => {
    sendEvent(eventName, parameters);
  }, [sendEvent]);

  return {
    // E-commerce tracking
    trackViewItem,
    trackAddToCart,
    trackRemoveFromCart,
    trackViewCart,
    trackBeginCheckout,
    trackPurchase,
    trackRefund,

    // Print store specific events
    trackImageZoom,
    trackSizeSelection,
    trackFrameSelection,
    trackPrintCustomization,
    trackSearch,
    trackFilterApplied,
    trackWishlistAction,

    // User engagement events
    trackNewsletterSignup,
    trackSocialShare,
    trackLead,
    trackContactForm,
    trackPageView,

    // Performance and custom tracking
    trackPerformance,
    trackCustomEvent,

    // Utility functions
    formatPrintItem,
    getSessionId,
    processEventQueue,

    // Queue management
    queueSize: eventQueue.current.length,
    isOnline: isOnline.current
  };
}