import Link from 'next/link'

export const metadata = {
  title: 'How YoTop10 Works',
  description: 'Learn how YoTop10 works as a platform for ranked lists and community debates.',
}

export default function OverviewGuide() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Docs
        </Link>

        <h1 className="text-4xl font-bold text-white mt-8 mb-6">
          How YoTop10 Works
        </h1>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <p>
            YoTop10 is a community-powered platform where people share ranked lists and jump into debates. Think of it as the place where opinions get ranked, facts get shared, and ideas get tested against each other.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            What You Can Do
          </h2>

          <p>
            Create ranked lists like Top 10, Best Of, or Worst Of posts. Start a debate with a This vs That post where two ideas go head to head. Drop a surprising fact or write a full article on something you care about.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            How Content Gets Ranked
          </h2>

          <p>
            Every post lives or dies by the community. People vote on lists, pick sides in debates, and leave comments that sharpen the conversation. The best content rises to the top naturally.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Community-Driven Moderation
          </h2>

          <p>
            Quality matters here. The community flags low-effort or harmful content, and a trust system ensures that reliable contributors have more influence. Good participation earns you more ability to post and shape what the community sees.
          </p>

          <p>
            Whether you are here to discover great lists or to share your own, YoTop10 gives you the tools to contribute and let the community decide what is worth reading.
          </p>
        </div>
      </div>
    </main>
  )
}
