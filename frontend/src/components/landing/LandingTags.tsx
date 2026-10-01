import Link from 'next/link';
import Image from 'next/image';
import type { LandingTag } from './types';

export function LandingTags({ tags }: { tags: LandingTag[] }) {
  if (tags.length === 0) return null;

  return (
    <section id="cake" className="popular-tags-section">
      <div className="popular-tags-container">
        <h2 className="section-title">POPULAR TAGS</h2>

        <div className="tags-grid">
          {tags.map(tag => (
            <Link
              key={tag.slug}
              href={`/c/${tag.slug}`}
              className="tag-button"
            >
              <div className="tag-icon">
                <Image src={tag.icon} alt={tag.name} width={24} height={24} />
              </div>
              <div className="tag-content">
                <span className="tag-name">{tag.name}</span>
                <span className="tag-count">{tag.count} posts</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="see-all-container">
          <Link href="/categories" className="see-all-button">
            See all tags
            <svg className="arrow-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
