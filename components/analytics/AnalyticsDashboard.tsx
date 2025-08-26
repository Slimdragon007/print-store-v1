'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/lib/analytics/use-analytics';

interface AnalyticsData {
  pageviews: number;
  users: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversionRate: number;
  revenue: number;
  topPages: Array<{ page: string; views: number }>;
  topProducts: Array<{ product: string; views: number; sales: number }>;
  trafficSources: Array<{ source: string; users: number; percentage: number }>;
  recentEvents: Array<{
    timestamp: number;
    event: string;
    page: string;
    value?: number;
  }>;
}

interface RealTimeMetrics {
  activeUsers: number;
  pageviewsLast30Min: number;
  topActivePages: Array<{ page: string; users: number }>;
  recentConversions: Array<{
    timestamp: number;
    type: string;
    value: number;
    product?: string;
  }>;
}

/**
 * Analytics Dashboard Component
 * 
 * Provides a comprehensive view of:
 * - Real-time metrics
 * - E-commerce performance
 * - User engagement metrics
 * - Conversion tracking
 * - Event monitoring
 * 
 * Note: This is a demo dashboard for development/testing.
 * In production, you would connect to Google Analytics Reporting API
 * or Google Analytics Data API (GA4) for real data.
 */
export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [realTimeData, setRealTimeData] = useState<RealTimeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'ecommerce' | 'realtime' | 'events'>('overview');

  const analytics = useAnalytics({ debugMode: true });

  // Simulate analytics data loading
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock data based on time range
      const mockData: AnalyticsData = generateMockAnalyticsData(selectedTimeRange);
      setAnalyticsData(mockData);
      
      setIsLoading(false);
    };

    loadAnalyticsData();
  }, [selectedTimeRange]);

  // Simulate real-time data updates
  useEffect(() => {
    const updateRealTimeData = () => {
      const mockRealTime: RealTimeMetrics = {
        activeUsers: Math.floor(Math.random() * 50) + 10,
        pageviewsLast30Min: Math.floor(Math.random() * 200) + 50,
        topActivePages: [
          { page: '/prints', users: Math.floor(Math.random() * 20) + 5 },
          { page: '/cart', users: Math.floor(Math.random() * 10) + 2 },
          { page: '/', users: Math.floor(Math.random() * 15) + 3 },
        ],
        recentConversions: [
          {
            timestamp: Date.now() - Math.floor(Math.random() * 300000),
            type: 'purchase',
            value: Math.floor(Math.random() * 100) + 20,
            product: 'Abstract Art Print #' + Math.floor(Math.random() * 100)
          },
          {
            timestamp: Date.now() - Math.floor(Math.random() * 600000),
            type: 'add_to_cart',
            value: Math.floor(Math.random() * 50) + 15
          }
        ]
      };
      
      setRealTimeData(mockRealTime);
    };

    updateRealTimeData();
    const interval = setInterval(updateRealTimeData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const generateMockAnalyticsData = (timeRange: string): AnalyticsData => {
    const multiplier = timeRange === '7d' ? 1 : timeRange === '30d' ? 4 : 12;
    
    return {
      pageviews: Math.floor((Math.random() * 5000) + 1000) * multiplier,
      users: Math.floor((Math.random() * 1500) + 300) * multiplier,
      sessions: Math.floor((Math.random() * 2000) + 400) * multiplier,
      bounceRate: Math.round((Math.random() * 30 + 40) * 100) / 100, // 40-70%
      avgSessionDuration: Math.floor(Math.random() * 180) + 120, // 2-5 minutes
      conversionRate: Math.round((Math.random() * 3 + 1) * 100) / 100, // 1-4%
      revenue: Math.floor((Math.random() * 10000) + 2000) * multiplier,
      topPages: [
        { page: '/prints', views: Math.floor(Math.random() * 1000) + 500 },
        { page: '/', views: Math.floor(Math.random() * 800) + 300 },
        { page: '/cart', views: Math.floor(Math.random() * 400) + 200 },
        { page: '/success', views: Math.floor(Math.random() * 200) + 50 },
      ],
      topProducts: [
        { product: 'Abstract Ocean Print', views: Math.floor(Math.random() * 300) + 100, sales: Math.floor(Math.random() * 50) + 10 },
        { product: 'Mountain Landscape', views: Math.floor(Math.random() * 250) + 80, sales: Math.floor(Math.random() * 40) + 8 },
        { product: 'Geometric Patterns', views: Math.floor(Math.random() * 200) + 60, sales: Math.floor(Math.random() * 30) + 5 },
      ],
      trafficSources: [
        { source: 'Organic Search', users: Math.floor(Math.random() * 500) + 200, percentage: 45 },
        { source: 'Direct', users: Math.floor(Math.random() * 300) + 150, percentage: 30 },
        { source: 'Social Media', users: Math.floor(Math.random() * 200) + 100, percentage: 15 },
        { source: 'Email', users: Math.floor(Math.random() * 100) + 50, percentage: 10 },
      ],
      recentEvents: [
        { timestamp: Date.now() - 60000, event: 'purchase', page: '/success', value: 49.99 },
        { timestamp: Date.now() - 120000, event: 'add_to_cart', page: '/prints' },
        { timestamp: Date.now() - 180000, event: 'view_item', page: '/prints' },
        { timestamp: Date.now() - 240000, event: 'search', page: '/prints' },
      ]
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Test event functions for development
  const testPurchaseEvent = () => {
    analytics.trackPurchase(
      'test_' + Date.now(),
      [{
        id: 'test_print_001',
        title: 'Test Abstract Print',
        price: 29.99,
        category: 'Abstract',
        size: '16x20',
        quantity: 1
      }],
      29.99,
      2.40,
      5.00,
      'TEST10'
    );
  };

  const testAddToCartEvent = () => {
    analytics.trackAddToCart([{
      id: 'test_print_002',
      title: 'Test Landscape Print',
      price: 39.99,
      category: 'Landscape',
      size: '20x24',
      quantity: 1
    }]);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="h-40 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          {/* Time Range Selector */}
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'ecommerce', label: 'E-commerce' },
            { id: 'realtime', label: 'Real-time' },
            { id: 'events', label: 'Events' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analyticsData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Page Views</div>
              <div className="text-2xl font-bold">{analyticsData.pageviews.toLocaleString()}</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Users</div>
              <div className="text-2xl font-bold">{analyticsData.users.toLocaleString()}</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Bounce Rate</div>
              <div className="text-2xl font-bold">{analyticsData.bounceRate}%</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Avg. Session</div>
              <div className="text-2xl font-bold">{formatDuration(analyticsData.avgSessionDuration)}</div>
            </Card>
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
              <div className="space-y-2">
                {analyticsData.topPages.map((page, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{page.page}</span>
                    <span className="text-sm font-medium">{page.views.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Traffic Sources */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
              <div className="space-y-2">
                {analyticsData.trafficSources.map((source, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{source.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{source.users.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">({source.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* E-commerce Tab */}
      {activeTab === 'ecommerce' && analyticsData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Revenue</div>
              <div className="text-2xl font-bold">{formatCurrency(analyticsData.revenue)}</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Conversion Rate</div>
              <div className="text-2xl font-bold">{analyticsData.conversionRate}%</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Avg. Order Value</div>
              <div className="text-2xl font-bold">{formatCurrency(analyticsData.revenue / (analyticsData.users * analyticsData.conversionRate / 100))}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Top Products</h3>
              <div className="space-y-3">
                {analyticsData.topProducts.map((product, index) => (
                  <div key={index} className="border-b pb-2 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium">{product.product}</span>
                      <span className="text-sm text-green-600">{product.sales} sales</span>
                    </div>
                    <div className="text-xs text-gray-500">{product.views} views</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Test Events */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Test Events</h3>
              <div className="space-y-2">
                <Button onClick={testPurchaseEvent} size="sm" className="w-full">
                  Test Purchase Event
                </Button>
                <Button onClick={testAddToCartEvent} size="sm" variant="outline" className="w-full">
                  Test Add to Cart Event
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Click these buttons to test GA4 event tracking. Check your browser console for debug information.
              </p>
            </Card>
          </div>
        </>
      )}

      {/* Real-time Tab */}
      {activeTab === 'realtime' && realTimeData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Active Users</div>
              <div className="text-2xl font-bold text-green-600">{realTimeData.activeUsers}</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Page Views (30min)</div>
              <div className="text-2xl font-bold">{realTimeData.pageviewsLast30Min}</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Active Pages</div>
              <div className="text-2xl font-bold">{realTimeData.topActivePages.length}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Active Pages</h3>
              <div className="space-y-2">
                {realTimeData.topActivePages.map((page, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{page.page}</span>
                    <span className="text-sm font-medium text-green-600">{page.users} users</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Recent Conversions</h3>
              <div className="space-y-2">
                {realTimeData.recentConversions.map((conversion, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div>
                      <div className="font-medium capitalize">{conversion.type.replace('_', ' ')}</div>
                      <div className="text-xs text-gray-500">{formatTimeAgo(conversion.timestamp)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(conversion.value)}</div>
                      {conversion.product && (
                        <div className="text-xs text-gray-500 truncate max-w-20">{conversion.product}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && analyticsData && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Event</th>
                  <th className="text-left p-2">Page</th>
                  <th className="text-left p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.recentEvents.map((event, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 text-gray-500">{formatTimeAgo(event.timestamp)}</td>
                    <td className="p-2 font-medium capitalize">{event.event.replace('_', ' ')}</td>
                    <td className="p-2">{event.page}</td>
                    <td className="p-2">{event.value ? formatCurrency(event.value) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Debug Information */}
      <Card className="p-4 bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
        <p className="text-sm text-gray-600 mb-2">
          This is a demo dashboard with mock data for development and testing purposes.
        </p>
        <div className="text-xs text-gray-500 space-y-1">
          <div>GA4 Measurement ID: {process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'Not configured'}</div>
          <div>Debug Mode: {process.env.NODE_ENV === 'development' ? 'Enabled' : 'Disabled'}</div>
          <div>Analytics Hook: {analytics ? 'Loaded' : 'Not loaded'}</div>
          <div>Queue Size: {analytics?.queueSize || 0}</div>
          <div>Online Status: {analytics?.isOnline ? 'Online' : 'Offline'}</div>
        </div>
      </Card>
    </div>
  );
}