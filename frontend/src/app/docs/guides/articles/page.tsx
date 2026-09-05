import Link from 'next/link'

export const metadata = {
  title: 'Articles',
  description: 'Learn about long-form articles on YoTop10.',
}

export default function ArticlesGuide() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Docs
        </Link>

        <h1 className="text-4xl font-bold text-white mt-8 mb-6">
          Articles
        </h1>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <p>
            Not everything fits into a list. Sometimes you need room to explore an idea, analyze a trend, or make a case for something you believe in. That is what articles are for.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            What Articles Are
          </h2>

          <p>
            Articles on YoTop10 are long-form content pieces. They are more like blog posts or essays than lists. You get space to develop your argument, provide context, and dig deep into a topic.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Cover Images
          </h2>

          <p>
            Every article can have a cover image. A good cover image draws readers in and gives them a visual sense of what the article is about before they start reading.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Fact-Checked and Sourced
          </h2>

          <p>
            Articles on YoTop10 are held to a high standard. Claims should be backed up with sources. This keeps the quality high and helps readers trust what they are reading.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Deep Dives and Opinions
          </h2>

          <p>
            Use articles for deep dives into subjects, detailed analyses of trends, or opinion pieces where you want to persuade readers. They are the platform&apos;s space for serious, thoughtful writing.
          </p>
        </div>
      </div>
    </main>
  )
}
