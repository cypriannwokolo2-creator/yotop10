import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "YoTop10 Terms of Use — rules, rights, and responsibilities for using the platform.",
};

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <nav className="mb-12 max-w-3xl mx-auto">
        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Docs
        </Link>
      </nav>

      <article className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Use</h1>
          <p className="text-sm text-zinc-500">Last updated: September 2026</p>
        </header>

        <div className="prose prose-invert max-w-none space-y-6 text-zinc-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using YoTop10 (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Use.
              If you do not agree, do not use the Platform. We may update these terms at any time; continued use
              constitutes acceptance of any changes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. User Conduct</h2>
            <p>
              You are responsible for your activity on YoTop10. Treat other users with respect. Do not harass,
              threaten, bully, or intimidate anyone. Do not post content that is hateful, discriminatory, sexually
              explicit, or that promotes violence or illegal activity. You must be at least 13 years old to use
              the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Content Ownership</h2>
            <p>
              You retain ownership of original content you post on YoTop10. By posting content, you grant
              YoTop10 a non-exclusive, worldwide, royalty-free license to display, distribute, and promote your
              content in connection with the Platform. You represent that you have the rights to any content you
              submit.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Content Moderation</h2>
            <p>
              YoTop10 reserves the right to remove content that violates these terms or that we find objectionable
              for any reason. We may review reported content and take action including removal, warning, or account
              restriction. We are not obligated to monitor all content but will act on reports in good faith.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Prohibited Behavior</h2>
            <p>
              You may not: manipulate votes or rankings through bots, scripting, or coordinated campaigns; create
              fake accounts; attempt to access other users&apos; accounts; reverse-engineer or exploit vulnerabilities
              in the Platform; use the Platform for commercial spam; or violate any applicable law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Account Termination</h2>
            <p>
              We may suspend or terminate your account at our discretion, with or without notice, for conduct that
              violates these terms or is otherwise harmful to the Platform or its users. You may also delete your
              account at any time. Upon termination, your content may remain visible in anonymized form.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Intellectual Property</h2>
            <p>
              All trademarks, logos, and branding associated with YoTop10 are our property. You may not use our
              intellectual property without written permission. Third-party content on the Platform is subject to
              its own licensing terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. Limitation of Liability</h2>
            <p>
              YoTop10 is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any
              indirect, incidental, or consequential damages arising from your use of the Platform. Our total
              liability shall not exceed the amount you paid us in the past twelve months, or $100, whichever is
              greater.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">9. Dispute Resolution</h2>
            <p>
              Any disputes arising from these terms shall be resolved through binding arbitration under the rules of
              the American Arbitration Association, unless you opt out within 30 days of account creation. Class
              action waivers apply to the maximum extent permitted by law. Governing law is the State of Delaware,
              United States.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
