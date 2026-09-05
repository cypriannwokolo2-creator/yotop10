import Link from 'next/link'

export const metadata = {
  title: 'Posting a List',
  description: 'Step-by-step guide to posting your first list on YoTop10.',
}

export default function PostingGuide() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Docs
        </Link>

        <h1 className="text-4xl font-bold text-white mt-8 mb-6">
          Posting a List
        </h1>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <p>
            Ready to share your take? Posting on YoTop10 is straightforward. Here is how to get your list in front of the community.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Step 1: Click Submit
          </h2>

          <p>
            Hit the Submit button from anywhere on the site. This opens the post creator where you can pick your format and start writing.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Step 2: Choose Your Format
          </h2>

          <p>
            Pick from several formats. Top List is your classic ranked list. Best Of highlights your favorites. Worst Of calls out the worst. This vs That sets up a debate. Fact Drop shares a single interesting fact. Article lets you write a longer piece.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Step 3: Pick a Category
          </h2>

          <p>
            Choose a category that fits your topic. This helps people discover your post when browsing by subject.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Step 4: Write Your Title
          </h2>

          <p>
            Your title must include a number. For example: Top 10 Sci-Fi Movies, Best 5 Budget Laptops, or Worst 3 Airline Experiences. The number tells readers what to expect.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Step 5: Add Items with Justifications
          </h2>

          <p>
            Add each item to your list. For each one, write a short explanation of why it earned that spot. The justification is what makes your list worth reading.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8">
            Step 6: Submit for Review
          </h2>

          <p>
            When you are happy with your post, submit it. It goes through a review process to make sure it meets community standards before it goes live.
          </p>
        </div>
      </div>
    </main>
  )
}
