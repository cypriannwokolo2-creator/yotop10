import Link from 'next/link'

export const metadata = {
  title: 'Categories',
  description: 'Learn how categories help organize content on YoTop10.',
}

export default function CategoriesGuide() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Docs
        </Link>

        <h1 className="text-4xl font-bold text-white mt-8 mb-6">
          Categories
        </h1>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <p>
            Categories keep YoTop10 organized. Instead of scrolling through everything, you can jump straight to the topics you care about.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            How Categories Work
          </h2>

          <p>
            Every post is tagged with a category when it is created. This makes it easy to filter and browse content by subject. Whether you are into technology, food, sports, or pop culture, there is a place for it.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Subcategories
          </h2>

          <p>
            Many categories have subcategories. A Technology category might break down into phones, laptops, software, and more. This lets you narrow your browsing even further and find exactly what interests you.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Discovering Trending Content
          </h2>

          <p>
            Each category page shows what is trending within that topic. You can see the most popular lists, debates, and articles in your favorite areas without wading through unrelated posts.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Browsing by Topic
          </h2>

          <p>
            Use the category browser from the main navigation to explore. Start broad with a main category, then drill down into subcategories. It is the best way to find new content that matches your interests.
          </p>
        </div>
      </div>
    </main>
  )
}
