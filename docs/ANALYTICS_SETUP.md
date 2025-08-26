# Google Analytics 4 (GA4) Setup Guide

This guide provides comprehensive instructions for setting up Google Analytics 4 with enhanced e-commerce tracking for the Print Store application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Analytics 4 Setup](#google-analytics-4-setup)
3. [Environment Configuration](#environment-configuration)
4. [Implementation Overview](#implementation-overview)
5. [Features](#features)
6. [Testing](#testing)
7. [Privacy Compliance](#privacy-compliance)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configuration](#advanced-configuration)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

- Google Analytics account
- Google Tag Manager (optional but recommended)
- Next.js application (version 13+)
- TypeScript support
- Basic understanding of e-commerce tracking

## Google Analytics 4 Setup

### 1. Create GA4 Property

1. Sign in to [Google Analytics](https://analytics.google.com/)
2. Click "Create" → "Property"
3. Fill in property details:
   - Property name: "Print Store"
   - Reporting time zone: Your local timezone
   - Currency: USD (or your preferred currency)
4. Select "Create a Universal Analytics property" if you want to keep UA alongside GA4
5. Complete the property setup process

### 2. Get Measurement ID

1. In GA4, go to Admin → Data Streams
2. Click "Add stream" → "Web"
3. Enter your website URL and stream name
4. Copy the **Measurement ID** (format: G-XXXXXXXXXX)

### 3. Create Measurement Protocol API Secret

For server-side tracking:

1. In GA4, go to Admin → Data Streams → [Your Web Stream]
2. Click "Measurement Protocol API secrets"
3. Click "Create"
4. Enter nickname (e.g., "Print Store Server")
5. Copy the **API Secret**

### 4. Enable Enhanced E-commerce

1. In GA4, go to Admin → Events
2. Mark the following events as conversions:
   - `purchase`
   - `begin_checkout`
   - `add_to_cart`
   - `generate_lead`

## Environment Configuration

### 1. Update Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your_ga4_api_secret

# Analytics Configuration
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ENHANCED_ECOMMERCE=true
NEXT_PUBLIC_ENABLE_ANALYTICS_DEBUG=false
NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE=100

# Cookie Configuration
NEXT_PUBLIC_COOKIE_DOMAIN=auto
NEXT_PUBLIC_COOKIE_PREFIX=_ga
```

### 2. Environment Variable Descriptions

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Your GA4 Measurement ID | Yes | - |
| `GA4_API_SECRET` | API secret for server-side tracking | No | - |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable/disable analytics | No | true |
| `NEXT_PUBLIC_ENABLE_ENHANCED_ECOMMERCE` | Enable enhanced e-commerce | No | true |
| `NEXT_PUBLIC_ENABLE_ANALYTICS_DEBUG` | Enable debug mode | No | false |
| `NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE` | Sampling rate (1-100) | No | 100 |
| `NEXT_PUBLIC_COOKIE_DOMAIN` | Cookie domain | No | auto |
| `NEXT_PUBLIC_COOKIE_PREFIX` | Cookie prefix | No | _ga |

## Implementation Overview

The analytics implementation consists of several key components:

### Core Files Structure

```
lib/analytics/
├── types.ts                    # TypeScript definitions
├── config.ts                   # Configuration management
├── use-analytics.ts            # Client-side hooks
└── server-analytics.ts         # Server-side tracking

components/
├── analytics/
│   ├── GoogleAnalytics.tsx     # GA4 script loader
│   └── AnalyticsDashboard.tsx  # Development dashboard
└── CookieConsent.tsx           # GDPR/CCPA compliance
```

### 1. Client-Side Implementation

The `useAnalytics` hook provides comprehensive tracking capabilities:

```typescript
import { useAnalytics } from '@/lib/analytics/use-analytics';

function MyComponent() {
  const analytics = useAnalytics({ debugMode: true });

  const handlePurchase = () => {
    analytics.trackPurchase(
      'order_123',
      [{ id: 'print_1', title: 'Abstract Art', price: 29.99 }],
      29.99
    );
  };

  return <button onClick={handlePurchase}>Buy Now</button>;
}
```

### 2. Server-Side Implementation

Server-side tracking for API routes:

```typescript
import { trackServerPurchase } from '@/lib/analytics/server-analytics';

export async function POST(request: Request) {
  // Process purchase...
  
  await trackServerPurchase({
    transactionId: 'order_123',
    items: [{ id: 'print_1', title: 'Abstract Art', price: 29.99 }],
    totalValue: 29.99,
    userId: 'user_456'
  });

  return Response.json({ success: true });
}
```

## Features

### E-commerce Tracking

#### Standard E-commerce Events

- ✅ `view_item` - Product page views
- ✅ `add_to_cart` - Items added to cart
- ✅ `remove_from_cart` - Items removed from cart
- ✅ `view_cart` - Cart page views
- ✅ `begin_checkout` - Checkout initiated
- ✅ `purchase` - Successful purchases
- ✅ `refund` - Order refunds

#### Print Store Specific Events

- ✅ `image_zoom` - Product image zoom interactions
- ✅ `size_selection` - Print size changes
- ✅ `frame_selection` - Frame option changes
- ✅ `print_customization` - Any customization changes
- ✅ `wishlist_action` - Add/remove from wishlist
- ✅ `newsletter_signup` - Email subscriptions
- ✅ `social_share` - Social media sharing
- ✅ `search` - Site search usage
- ✅ `filter_applied` - Product filtering

### User Engagement Events

- ✅ Page views with content groups
- ✅ Scroll depth tracking
- ✅ File downloads
- ✅ Form submissions
- ✅ Video interactions

### Privacy & Compliance

- ✅ GDPR compliant cookie consent
- ✅ CCPA compliance
- ✅ Granular consent options
- ✅ Consent state persistence
- ✅ GA4 consent mode integration

### Performance Features

- ✅ Lazy loading of analytics scripts
- ✅ Offline event queuing
- ✅ Automatic retry logic
- ✅ Performance monitoring
- ✅ Error tracking

## Testing

### 1. Debug Mode

Enable debug mode in development:

```typescript
// In your component
const analytics = useAnalytics({ debugMode: true });
```

Or set environment variable:
```bash
NEXT_PUBLIC_ENABLE_ANALYTICS_DEBUG=true
```

### 2. GA4 DebugView

1. In GA4, go to Configure → DebugView
2. Your debug events will appear in real-time
3. Verify event parameters and user properties

### 3. Browser Console

With debug mode enabled, all events are logged to console:

```javascript
// Example console output
GA4: Event sent purchase {
  currency: 'USD',
  value: 29.99,
  transaction_id: 'order_123',
  items: [...]
}
```

### 4. Test Events

Use the development dashboard to test events:

```typescript
// Access debug utilities in browser console
window.GA4Debug.testPurchase();
window.GA4Debug.checkStatus();
```

### 5. Measurement Protocol Testing

For server-side events, use GA4's debug endpoint:

```bash
# The implementation automatically uses debug endpoint in development
NEXT_PUBLIC_ENABLE_ANALYTICS_DEBUG=true
```

## Privacy Compliance

### GDPR Compliance

The implementation includes comprehensive GDPR compliance:

1. **Cookie Consent Banner**: Appears for new users
2. **Granular Consent**: Separate options for analytics, marketing, etc.
3. **Consent Persistence**: Saves user preferences for 1 year
4. **GA4 Consent Mode**: Automatically adjusts tracking based on consent

### CCPA Compliance

- Consent banner includes CCPA-compliant language
- Users can opt-out of data collection
- Privacy policy links provided

### Cookie Categories

| Category | Required | Purpose |
|----------|----------|---------|
| Necessary | Yes | Essential site functionality |
| Analytics | No | Usage statistics and improvements |
| Marketing | No | Personalized advertisements |
| Preferences | No | User customization settings |

## Troubleshooting

### Common Issues

#### 1. Events Not Appearing in GA4

**Symptoms**: Events sent but not visible in GA4 reports

**Solutions**:
- Check Measurement ID is correct
- Verify events in DebugView (Configure → DebugView)
- Wait up to 24 hours for reports (real-time events appear faster)
- Check browser ad blockers aren't blocking requests

#### 2. Server-Side Tracking Not Working

**Symptoms**: Server events not appearing

**Solutions**:
- Verify `GA4_API_SECRET` is configured correctly
- Check server logs for error messages
- Ensure Measurement Protocol API secret is active
- Validate client_id generation

#### 3. Cookie Consent Issues

**Symptoms**: Consent banner not appearing or settings not persisting

**Solutions**:
- Clear browser localStorage and cookies
- Check browser's local storage quota
- Verify consent component is properly mounted
- Ensure no conflicting cookie consent libraries

#### 4. Performance Issues

**Symptoms**: Slow page load or high analytics overhead

**Solutions**:
- Verify lazy loading is enabled
- Check offline queue isn't growing too large
- Reduce sampling rate if needed
- Monitor bundle size impact

### Debug Checklist

1. ✅ Environment variables configured correctly
2. ✅ GA4 property set up with web stream
3. ✅ Enhanced e-commerce enabled in GA4
4. ✅ Debug mode enabled for testing
5. ✅ Console shows event logging (debug mode)
6. ✅ GA4 DebugView shows incoming events
7. ✅ Cookie consent working properly
8. ✅ Both client and server tracking functional

## Advanced Configuration

### Custom Dimensions

Add custom dimensions in GA4:

1. Go to Admin → Custom Definitions → Custom Dimensions
2. Add dimensions:
   - `print_artist` - Text
   - `print_size` - Text  
   - `frame_option` - Text
   - `user_type` - Text
   - `customer_ltv` - Number

### Audience Configuration

Create audiences for:
- High-value customers (LTV > $100)
- Frequent buyers (>3 purchases)
- Cart abandoners
- Newsletter subscribers

### Conversion Events

Mark these events as conversions:
- `purchase` (automatic)
- `begin_checkout`
- `generate_lead`
- `newsletter_signup`

### Enhanced E-commerce Setup

In GA4, enable:
1. Enhanced measurement (Admin → Data Streams → Enhanced Measurement)
2. Google Signals (Admin → Data Settings → Data Collection)
3. Attribution settings (Admin → Attribution Settings)

## Monitoring and Maintenance

### Regular Tasks

#### Weekly
- [ ] Check GA4 reports for data accuracy
- [ ] Monitor error rates in server logs
- [ ] Review performance impact metrics

#### Monthly
- [ ] Audit conversion rates and goal completions
- [ ] Review custom event performance
- [ ] Check for new GA4 features/updates
- [ ] Validate privacy compliance

#### Quarterly
- [ ] Review and update custom dimensions
- [ ] Analyze user journey and optimize tracking
- [ ] Update documentation for any changes
- [ ] Train team on new features

### Key Metrics to Monitor

1. **Data Quality**:
   - Event volume consistency
   - Parameter completeness
   - Server vs client event ratios

2. **Performance**:
   - Page load impact
   - Event queue sizes
   - Error rates

3. **Privacy**:
   - Consent rates by category
   - Opt-out rates
   - Data retention compliance

### Alerts Setup

Consider setting up alerts for:
- Sudden drops in event volume
- High error rates in analytics
- Performance degradation
- Privacy compliance issues

## Integration with Other Tools

### Google Tag Manager (Optional)

If using GTM alongside this implementation:

1. Disable automatic page view tracking in GTM
2. Use custom events to trigger GTM tags
3. Avoid duplicate tracking

### Google Ads

For conversion tracking:
1. Import GA4 conversions to Google Ads
2. Set up audience sharing
3. Configure attribution models

### Other Analytics Platforms

The implementation supports:
- Dual tracking with other platforms
- Custom event forwarding
- Unified consent management

## Support and Resources

### Documentation
- [GA4 Developer Guide](https://developers.google.com/analytics/devguides/collection/ga4)
- [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Enhanced E-commerce](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)

### Community
- [GA4 Community Forum](https://support.google.com/analytics/community)
- [Google Analytics Blog](https://blog.google/products/marketingplatform/analytics/)

### Contact
For implementation-specific questions, please refer to the development team or create an issue in the project repository.

---

## Quick Start Summary

1. **Setup GA4**: Create property, get Measurement ID and API Secret
2. **Configure Environment**: Add variables to `.env.local`
3. **Deploy**: The implementation is already integrated
4. **Test**: Enable debug mode and verify events in GA4 DebugView
5. **Privacy**: Customize cookie consent banner as needed
6. **Monitor**: Check reports regularly and maintain data quality

The implementation provides a comprehensive, privacy-compliant, and performance-optimized analytics solution for your print store with both client-side and server-side tracking capabilities.