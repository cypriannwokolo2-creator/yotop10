import Link from 'next/link'

export const metadata = {
  title: 'Reputation System',
  description: 'Learn about trust scores and reputation tiers on YoTop10.',
}

export default function ReputationGuide() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Docs
        </Link>

        <h1 className="text-4xl font-bold text-white mt-8 mb-6">
          Reputation System
        </h1>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <p>
            Trust is everything on YoTop10. Your reputation score reflects how much the community can rely on you, and it affects what you can do on the platform.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            How Trust Works
          </h2>

          <p>
            Everyone starts with a neutral trust score. From there, your actions move it up or down. Getting your posts approved, writing helpful comments, and earning community votes all build trust. Trolling, spamming, or posting low-quality content tears it down.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Why It Matters
          </h2>

          <p>
            Higher trust means more posting ability. Trusted contributors can post more frequently, participate in moderation, and have a bigger voice in community decisions. It is a system that rewards people who make the platform better.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            The Tiers
          </h2>

          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-400">Troll</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Lowest tier. Restricted posting. Earned by repeated harmful behavior. It is hard to climb back from here.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-zinc-400">Neutral</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Where everyone starts. Basic posting ability. Build your reputation from here by contributing quality content.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-emerald-400">Trusted</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Earned through consistent good contributions. More posting power and a stronger voice in the community.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-amber-400">Scholar</h3>
              <p className="text-sm text-zinc-400 mt-1">
                The highest tier. Reserved for the most reliable and valued contributors. Full access and moderation privileges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
