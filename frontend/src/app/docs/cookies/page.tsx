import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "YoTop10 Cookie Policy — how we use cookies and how to manage them.",
};

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <nav className="mb-12 max-w-3xl mx-auto">
        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Docs
        </Link>
      </nav>

      <article className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Cookie Policy</h1>
          <p className="text-sm text-zinc-500">Last updated: September 2026</p>
        </header>

        <div className="prose prose-invert max-w-none space-y-6 text-zinc-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help us recognize
              your browser, remember your preferences, and understand how you interact with the Platform. Cookies
              can be &ldquo;first-party&rdquo; (set by YoTop10) or &ldquo;third-party&rdquo; (set by other services).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Essential Cookies</h2>
            <p>
              These cookies are necessary for the Platform to function. They maintain your login session, remember
              your authentication token, store your content preferences, and enable security features like CSRF
              protection. Without these cookies, core features like voting, posting, and ranking would not work.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Analytics Cookies</h2>
            <p>
              We use analytics cookies to understand how users engage with the Platform — which lists are viewed
              most, how debates are navigated, and where users spend time. This data helps us improve rankings,
              recommendations, and overall user experience. Analytics data is aggregated and does not personally
              identify you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Advertising Cookies</h2>
            <p>
              Advertising cookies may be used to deliver relevant ads and measure campaign effectiveness. These
              cookies track browsing activity across sites and may be set by advertising partners. We do not sell
              your personal data to advertisers, but ad-supported features may involve third-party tracking.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Managing Cookies</h2>
            <p>
              You can control cookies through your browser settings. Most browsers allow you to block or delete
              cookies, though this may impair functionality. You can opt out of analytics cookies by adjusting your
              preferences. For advertising cookies, you can opt out through industry tools like the{" "}
              <span className="text-zinc-400">Digital Advertising Alliance</span> or your device&apos;s ad tracking
              settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Third-Party Cookies</h2>
            <p>
              Third-party services integrated into YoTop10 (such as analytics providers or embedded content) may
              set their own cookies. We do not control these cookies. Refer to each third party&apos;s privacy policy
              for details on their data practices.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
