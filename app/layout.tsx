import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import CookieConsent from '@/components/CookieConsent';
import { getAnalyticsConfig, DEFAULT_CONSENT_SETTINGS } from '@/lib/analytics/config';

export const metadata: Metadata = {
  title: 'Next.js SaaS Starter',
  description: 'Get started quickly with Next.js, Postgres, and Stripe.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const analyticsConfig = getAnalyticsConfig();

  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        {/* Google Analytics 4 */}
        <GoogleAnalytics
          measurementId={analyticsConfig.ga4MeasurementId}
          debugMode={analyticsConfig.debugMode}
          enableEcommerce={analyticsConfig.enableEcommerce}
          enableEnhancedEcommerce={analyticsConfig.enableEnhancedEcommerce}
          consent={DEFAULT_CONSENT_SETTINGS}
        />

        <SWRConfig
          value={{
            fallback: {
              // We do NOT await here
              // Only components that read this data will suspend
              '/api/user': getUser(),
              '/api/team': getTeamForUser()
            }
          }}
        >
          {children}
        </SWRConfig>

        {/* Cookie Consent Banner */}
        <CookieConsent
          companyName="Print Store"
          privacyPolicyUrl="/privacy"
          cookiePolicyUrl="/cookies"
          enableGranularConsent={true}
          debugMode={analyticsConfig.debugMode}
        />
      </body>
    </html>
  );
}
