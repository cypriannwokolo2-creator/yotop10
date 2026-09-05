import Link from 'next/link'

export const metadata = {
  title: 'Saved Posts',
  description: 'Learn how to bookmark and manage saved posts on YoTop10.',
}

export default function SavedGuide() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Docs
        </Link>

        <h1 className="text-4xl font-bold text-white mt-8 mb-6">
          Saved Posts
        </h1>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <p>
            Found something interesting but do not have time to read it right now? Save it for later. YoTop10 lets you bookmark any post so you can come back to it whenever you want.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            How to Save a Post
          </h2>

          <p>
            Every post on the platform has a save button. Click it and the post gets added to your personal reading list. It is quick and stays right where you left it.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Accessing Your Saved Posts
          </h2>

          <p>
            Find all your saved posts in the sidebar. They are organized in one place so you can browse through them whenever you are ready to read. No digging through your history needed.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Managing Your Reading List
          </h2>

          <p>
            Read something and want to clear it off your list? Remove it with a single click. Your saved posts stay organized and clean so you always know what you still want to check out.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Your List, Your Way
          </h2>

          <p>
            Think of saved posts as your personal reading queue. Whether you are collecting lists to read on a lazy Sunday or saving a debate for later, it is your curated collection of the best stuff on YoTop10.
          </p>
        </div>
      </div>
    </main>
  )
}
