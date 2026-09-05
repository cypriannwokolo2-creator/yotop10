import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "YoTop10 Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <nav className="mb-12 max-w-3xl mx-auto">
        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Docs
        </Link>
      </nav>

      <article className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-zinc-500">Last updated: September 2026</p>
        </header>

        <div className="prose prose-invert max-w-none space-y-6 text-zinc-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Data We Collect</h2>
            <p>
              We collect information you provide directly: your username, email address, profile information, posts,
              lists, votes, comments, and direct messages. We also collect automatic data: IP address, browser type,
              device information, pages visited, time spent on pages, referring URLs, and interaction patterns. We
              use analytics tools to understand how users engage with lists, debates, and rankings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. How We Use Data</h2>
            <p>
              We use your data to: operate and improve the Platform; personalize your feed and recommendations;
              calculate and display rankings; communicate with you about your account and updates; detect and
              prevent spam, fraud, and abuse; generate aggregate, anonymized analytics; and comply with legal
              obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Data Sharing</h2>
            <p>
              We do not sell your personal data. We share information with service providers who assist in operating
              the Platform (hosting, analytics, email delivery), when required by law, to protect the rights and
              safety of YoTop10 and its users, and in connection with a merger or acquisition. Aggregated,
              anonymized data may be shared publicly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Cookies</h2>
            <p>
              We use cookies and similar technologies to maintain your session, remember your preferences, and
              understand usage patterns. See our{" "}
              <Link href="/docs/cookies" className="text-blue-400 hover:text-blue-300 underline">
                Cookie Policy
              </Link>{" "}
              for full details.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide the Platform.
              Deleted content may persist in backups for up to 90 days. Anonymized, aggregated data may be retained
              indefinitely.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to: access, correct, or delete your personal
              data; export your data in a portable format; opt out of targeted advertising; and withdraw consent to
              data processing. Contact us at privacy@yotop10.com to exercise these rights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. GDPR Compliance</h2>
            <p>
              For users in the European Economic Area, UK, and Switzerland, we process data under lawful bases
              including consent, legitimate interest, and contract performance. You have the right to lodge a
              complaint with your local data protection authority. We implement appropriate technical and
              organizational measures to protect your data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. Children&apos;s Privacy</h2>
            <p>
              YoTop10 is not intended for children under 13. We do not knowingly collect data from children under
              13. If we learn that we have collected data from a child under 13, we will delete it promptly. If you
              believe a child has provided us with personal data, please contact us immediately.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
