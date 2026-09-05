import Link from 'next/link'

export const metadata = {
  title: 'Hall of Fame',
  description: 'Learn about the Hall of Fame on YoTop10 and how content gets featured.',
}

export default function HallOfFameGuide() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Docs
        </Link>

        <h1 className="text-4xl font-bold text-white mt-8 mb-6">
          Hall of Fame
        </h1>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <p>
            The Hall of Fame is where the best content on YoTop10 lives. These are the posts that rose above the rest, earning recognition from both the community and our editorial team.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            How Posts Get Featured
          </h2>

          <p>
            Featured posts earn their spot through a combination of community votes, quality, and editorial review. The system looks for posts that are well-written, insightful, and genuinely useful to readers.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Editorial Notes
          </h2>

          <p>
            When a post makes it to the Hall of Fame, editors may add notes explaining why it was selected. These notes highlight what makes the post stand out and give readers context on why it deserves attention.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            The Highest Quality Content
          </h2>

          <p>
            Think of the Hall of Fame as the highlight reel of YoTop10. If you want to see the platform at its best, start here. These posts represent the kind of thoughtful, well-crafted content that makes the community great.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Aiming for the Hall of Fame
          </h2>

          <p>
            Want your post featured? Focus on quality over quantity. Write thorough justifications, back up your opinions, and engage with commenters. The community and editors notice effort.
          </p>
        </div>
      </div>
    </main>
  )
}
