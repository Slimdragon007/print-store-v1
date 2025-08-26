/**
 * Google Analytics 4 Types and Interfaces
 * Comprehensive type definitions for GA4 e-commerce tracking
 */

// GA4 Global Interface Declaration
declare global {
  interface Window {
    gtag: Gtag.Gtag;
    dataLayer: any[];
    ga?: (...args: any[]) => void;
  }
}

// GA4 Configuration Types
export interface GA4Config {
  measurementId: string;
  debugMode: boolean;
  sendPageView: boolean;
  cookieFlags?: string;
  customMap?: Record<string, string>;
}

// E-commerce Item Interface (GA4 Standard)
export interface GA4Item {
  item_id: string;
  item_name: string;
  category?: string;
  category2?: string;
  category3?: string;
  category4?: string;
  category5?: string;
  brand?: string;
  variant?: string;
  price: number;
  quantity?: number;
  coupon?: string;
  discount?: number;
  affiliation?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  index?: number;
}

// Print Store Specific Item
export interface PrintStoreItem extends GA4Item {
  // Core print properties
  print_id: string;
  print_title: string;
  artist_name?: string;
  print_size: string;
  frame_option?: string;
  paper_type?: string;
  orientation: 'portrait' | 'landscape' | 'square';
  
  // Categorization
  style_category: string;
  color_palette: string[];
  room_category?: string;
  
  // Pricing
  base_price: number;
  frame_price?: number;
  shipping_cost?: number;
  
  // Inventory
  stock_level?: number;
  is_featured: boolean;
  is_limited_edition: boolean;
  
  // SEO/Marketing
  tags?: string[];
  collection?: string;
}

// E-commerce Events
export interface ViewItemEvent {
  currency: string;
  value: number;
  items: PrintStoreItem[];
}

export interface AddToCartEvent {
  currency: string;
  value: number;
  items: PrintStoreItem[];
}

export interface RemoveFromCartEvent {
  currency: string;
  value: number;
  items: PrintStoreItem[];
}

export interface ViewCartEvent {
  currency: string;
  value: number;
  items: PrintStoreItem[];
}

export interface BeginCheckoutEvent {
  currency: string;
  value: number;
  items: PrintStoreItem[];
  coupon?: string;
}

export interface PurchaseEvent {
  currency: string;
  value: number;
  transaction_id: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: PrintStoreItem[];
  affiliation?: string;
}

export interface RefundEvent {
  currency: string;
  value: number;
  transaction_id: string;
  items?: PrintStoreItem[];
}

// Custom Print Store Events
export interface ImageZoomEvent {
  item_id: string;
  item_name: string;
  zoom_level: number;
  interaction_type: 'click' | 'hover' | 'pinch';
}

export interface SizeSelectionEvent {
  item_id: string;
  item_name: string;
  selected_size: string;
  previous_size?: string;
  price_change: number;
}

export interface FrameSelectionEvent {
  item_id: string;
  item_name: string;
  frame_type: string;
  frame_color?: string;
  additional_cost: number;
}

export interface PrintCustomizationEvent {
  item_id: string;
  item_name: string;
  customization_type: 'size' | 'frame' | 'paper' | 'matting';
  customization_value: string;
  price_impact: number;
}

export interface SearchEvent {
  search_term: string;
  results_count: number;
  filters_applied?: Record<string, string>;
  sort_order?: string;
}

export interface FilterAppliedEvent {
  filter_type: string;
  filter_value: string;
  results_count: number;
  previous_results_count: number;
}

export interface WishlistEvent {
  action: 'add' | 'remove';
  item_id: string;
  item_name: string;
  wishlist_size: number;
}

// User Engagement Events
export interface NewsletterSignupEvent {
  signup_location: string;
  user_type: 'new' | 'existing';
  incentive_offered?: string;
}

export interface SocialShareEvent {
  item_id: string;
  item_name: string;
  platform: 'facebook' | 'twitter' | 'pinterest' | 'instagram' | 'email';
  share_type: 'product' | 'collection' | 'general';
}

// Conversion Events
export interface LeadEvent {
  lead_type: 'newsletter' | 'contact_form' | 'custom_order_inquiry';
  source: string;
  value?: number;
}

export interface ContactFormEvent {
  form_type: 'general' | 'custom_order' | 'support';
  inquiry_category?: string;
  items_referenced?: string[];
}

// Page View Events
export interface PageViewEvent {
  page_title: string;
  page_location: string;
  page_referrer?: string;
  content_group1?: string;
  content_group2?: string;
  content_group3?: string;
  content_group4?: string;
  content_group5?: string;
}

// Custom Dimensions (GA4 Custom Parameters)
export interface CustomDimensions {
  user_type?: 'new' | 'returning' | 'vip';
  customer_lifetime_value?: number;
  preferred_category?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  traffic_source?: string;
  session_engagement_time?: number;
  cart_abandonment_stage?: string;
  purchase_intent_score?: number;
}

// Cookie Consent Types
export interface CookieConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: number;
  version: string;
}

export type ConsentStatus = 'granted' | 'denied';

export interface ConsentSettings {
  ad_storage: ConsentStatus;
  analytics_storage: ConsentStatus;
  functionality_storage: ConsentStatus;
  personalization_storage: ConsentStatus;
  security_storage: ConsentStatus;
  ad_user_data?: ConsentStatus;
  ad_personalization?: ConsentStatus;
}

// Analytics Configuration
export interface AnalyticsConfig {
  ga4MeasurementId: string;
  debugMode: boolean;
  enableEcommerce: boolean;
  enableEnhancedEcommerce: boolean;
  enableUserProperties: boolean;
  enableCustomDimensions: boolean;
  cookiePrefix?: string;
  cookieDomain?: string;
  cookieExpires?: number;
  sampleRate?: number;
  sendPageView?: boolean;
  allowAdFeatures?: boolean;
  allowGoogleSignals?: boolean;
}

// Error Types
export interface AnalyticsError {
  code: string;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
}

// Event Queue for Offline Support
export interface QueuedEvent {
  eventName: string;
  parameters: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

// Performance Metrics
export interface PerformanceMetrics {
  page_load_time: number;
  dom_content_loaded: number;
  first_contentful_paint: number;
  largest_contentful_paint: number;
  first_input_delay: number;
  cumulative_layout_shift: number;
}

// A/B Testing
export interface ABTestVariant {
  experiment_id: string;
  variant_id: string;
  traffic_split: number;
}

export interface ExperimentEvent {
  experiment_id: string;
  variant_id: string;
  event_name: string;
  event_parameters?: Record<string, any>;
}

// Export utility type for all trackable events
export type TrackableEvent = 
  | ViewItemEvent
  | AddToCartEvent
  | RemoveFromCartEvent
  | ViewCartEvent
  | BeginCheckoutEvent
  | PurchaseEvent
  | RefundEvent
  | ImageZoomEvent
  | SizeSelectionEvent
  | FrameSelectionEvent
  | PrintCustomizationEvent
  | SearchEvent
  | FilterAppliedEvent
  | WishlistEvent
  | NewsletterSignupEvent
  | SocialShareEvent
  | LeadEvent
  | ContactFormEvent
  | PageViewEvent;

// Event Names Enum for type safety
export enum GA4EventNames {
  // Standard E-commerce Events
  VIEW_ITEM = 'view_item',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  VIEW_CART = 'view_cart',
  BEGIN_CHECKOUT = 'begin_checkout',
  PURCHASE = 'purchase',
  REFUND = 'refund',
  
  // Standard Engagement Events
  SEARCH = 'search',
  SHARE = 'share',
  LOGIN = 'login',
  SIGN_UP = 'sign_up',
  
  // Custom Print Store Events
  IMAGE_ZOOM = 'image_zoom',
  SIZE_SELECTION = 'size_selection',
  FRAME_SELECTION = 'frame_selection',
  PRINT_CUSTOMIZATION = 'print_customization',
  FILTER_APPLIED = 'filter_applied',
  WISHLIST_ACTION = 'wishlist_action',
  NEWSLETTER_SIGNUP = 'newsletter_signup',
  SOCIAL_SHARE = 'social_share',
  CONTACT_FORM_SUBMIT = 'contact_form_submit',
  CUSTOM_ORDER_INQUIRY = 'custom_order_inquiry',
  
  // Conversion Events
  GENERATE_LEAD = 'generate_lead',
  
  // Content Events
  SELECT_CONTENT = 'select_content',
  VIEW_SEARCH_RESULTS = 'view_search_results',
  VIEW_ITEM_LIST = 'view_item_list',
  SELECT_ITEM = 'select_item',
  
  // Page Events
  PAGE_VIEW = 'page_view',
  SCROLL = 'scroll',
  FILE_DOWNLOAD = 'file_download',
  VIDEO_START = 'video_start',
  VIDEO_PROGRESS = 'video_progress',
  VIDEO_COMPLETE = 'video_complete'
}

export default GA4EventNames;