import Link from 'next/link'

export const metadata = {
  title: 'Arguments & Debates',
  description: 'Learn how debates and arguments work on YoTop10.',
}

export default function ArgumentsGuide() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Docs
        </Link>

        <h1 className="text-4xl font-bold text-white mt-8 mb-6">
          Arguments &amp; Debates
        </h1>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <p>
            Some topics deserve more than a one-sided list. That is where debates come in. On YoTop10, the This vs That format lets two sides go head to head, and the community decides which side wins.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            How This vs That Works
          </h2>

          <p>
            Pick two opposing ideas, places, foods, methods, or whatever you want to compare. Present the case for each side. Then let the community weigh in by voting on which one they think is better.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            The Support and Contradict Bar
          </h2>

          <p>
            When you read a debate, you will see a bar showing how many people support or contradict each side. It gives you a real-time snapshot of where the community stands. Vote to add your voice to the mix.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Velocity
          </h2>

          <p>
            Velocity measures how fast a debate is growing. A debate with high velocity is getting a lot of attention right now. It helps you find the hottest conversations on the platform.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Counter-Lists
          </h2>

          <p>
            Disagree with a list? Create a counter-list. Take the same topic and present your own ranked version with your own reasoning. It is a respectful way to push back and let the community compare perspectives.
          </p>
        </div>
      </div>
    </main>
  )
}
