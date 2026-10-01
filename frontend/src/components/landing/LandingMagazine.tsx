import { Fragment } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/icons/Icon';
import { useLandingShare } from './share-context';
import type { LandingItem } from './types';

const IMG_FALLBACK =
  'linear-gradient(135deg, rgba(219, 37, 37, 0.35), rgba(255, 142, 83, 0.35))';

interface LandingMagazineProps {
  featured: LandingItem[];
  mini: LandingItem[];
  large: LandingItem[];
  small: LandingItem[];
  sidebar: LandingItem[];
}

function PostImage({
  item,
  className,
}: {
  item: LandingItem;
  className: string;
}) {
  if (item.image) {
    return (
      <Image
        src={item.image}
        alt={item.title}
        className={className}
        width={1200}
        height={675}
        loading="lazy"
        style={{ color: 'inherit' }}
      />
    );
  }
  return (
    <div
      className={className}
      role="img"
      aria-label={item.title}
      style={{ background: IMG_FALLBACK }}
    />
  );
}

function ShareAction({ item }: { item: LandingItem }) {
  const share = useLandingShare();
  return (
    <button
      className="action-btn share-btn"
      type="button"
      data-title={item.title}
      data-url={item.href}
      onClick={() => share(item.title, item.href)}
    >
      <Icon name="Share2" size={13} />
      <span>Share</span>
    </button>
  );
}

function MiniShareAction({ item }: { item: LandingItem }) {
  const share = useLandingShare();
  return (
    <button
      className="mini-action-btn share-btn"
      type="button"
      data-title={item.title}
      data-url={item.href}
      aria-label={`Share ${item.title}`}
      onClick={() => share(item.title, item.href)}
    >
      <Icon name="Share2" size={14} />
    </button>
  );
}

export function LandingMagazine({
  featured,
  mini,
  large,
  small,
  sidebar,
}: LandingMagazineProps) {
  const share = useLandingShare();

  return (
    <section className="magazine-section">
      <div className="container">
        <div className="magazine-grid">
          {/* Main Content Column */}
          <main className="magazine-main">
            {/* Don't Miss Section */}
            {(featured.length > 0 || mini.length > 0) && (
              <section className="dont-miss-section">
                <div className="section-header">
                  <h2 className="section-title">FEARTURED POST</h2>
                </div>

                <div className="dont-miss-content">
                  {featured.length > 0 && (
                    <article className="featured-post">
                      {featured.map(item => (
                        <Fragment key={item.href}>
                          <a href={item.href} className="post-link">
                            <div className="post-image-container">
                              <PostImage item={item} className="post-image" />
                              <div className="post-overlay">
                                <span className="post-category">
                                  {item.category}
                                </span>
                              </div>
                            </div>
                            <div className="post-content">
                              <h3 className="post-title">{item.title}</h3>
                              <div className="post-meta">
                                <span className="post-author">
                                  {item.author}
                                </span>
                                <span className="post-date">{item.date}</span>
                              </div>
                              <p className="post-excerpt">{item.excerpt}</p>
                            </div>
                          </a>
                          <div className="post-actions">
                            <ShareAction item={item} />
                          </div>
                        </Fragment>
                      ))}
                    </article>
                  )}

                  {mini.length > 0 && (
                    <div className="mini-posts">
                      {mini.map(item => (
                        <article className="mini-post" key={item.href}>
                          <a href={item.href} className="mini-post-link">
                            <PostImage
                              item={item}
                              className="mini-post-image"
                            />
                            <div className="mini-post-content">
                              <h4 className="mini-post-title">{item.title}</h4>
                              <div className="mini-post-meta">
                                <span className="mini-post-author">
                                  {item.author}
                                </span>
                                <span className="mini-post-date">
                                  {item.date}
                                </span>
                              </div>
                            </div>
                          </a>
                          <div className="mini-post-actions">
                            <MiniShareAction item={item} />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Others Section */}
            {(large.length > 0 || small.length > 0) && (
              <section className="lifestyle-section">
                <div className="section-header">
                  <h2 className="section-title">OTHERS</h2>
                </div>

                <div className="lifestyle-content">
                  {large.length > 0 && (
                    <div className="large-posts">
                      {large.map(item => (
                        <article className="large-post" key={item.href}>
                          <a href={item.href} className="large-post-link">
                            <div className="large-post-image-container">
                              <PostImage
                                item={item}
                                className="large-post-image"
                              />
                              <div className="large-post-overlay">
                                <span className="large-post-category">
                                  {item.category}
                                </span>
                              </div>
                            </div>
                            <div className="large-post-content">
                              <h3 className="large-post-title">{item.title}</h3>
                              <div className="large-post-meta">
                                <span className="large-post-author">
                                  {item.author}
                                </span>
                                <span className="large-post-date">
                                  {item.date}
                                </span>
                              </div>
                              <p className="large-post-excerpt">
                                {item.excerpt}
                              </p>
                            </div>
                          </a>
                          <div className="large-post-actions">
                            <ShareAction item={item} />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {small.length > 0 && (
                    <div className="small-posts">
                      {small.map(item => (
                        <article className="small-post" key={item.href}>
                          <a href={item.href} className="small-post-link">
                            <PostImage
                              item={item}
                              className="small-post-image"
                            />
                            <div className="small-post-content">
                              <h4 className="small-post-title">{item.title}</h4>
                              <div className="small-post-meta">
                                <span className="small-post-date">
                                  {item.date}
                                </span>
                              </div>
                            </div>
                          </a>
                          <div className="small-post-actions">
                            <MiniShareAction item={item} />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="magazine-sidebar">
            {/* Stay Connected Widget */}
            <div className="sidebar-widget stay-connected">
              <h3 className="widget-title">STAY CONNECTED</h3>
              <a
                href="https://facebook.com/yotop10s"
                className="social-connection facebook-platform"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect with Facebook"
              >
                <div className="social-icon">
                  <Image
                    src="/brand/facebook.svg"
                    alt=""
                    aria-hidden
                    width={24}
                    height={24}
                  />
                </div>
                <div className="social-info">
                  <span className="social-name">Facebook</span>
                </div>
              </a>

              <a
                href="https://x.com/yotop10s"
                className="social-connection x-platform"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect with X"
              >
                <div className="social-icon">
                  <Image
                    src="/brand/x.svg"
                    alt=""
                    aria-hidden
                    width={24}
                    height={24}
                  />
                </div>
                <div className="social-info">
                  <span className="social-name">X</span>
                </div>
              </a>

              <a
                href="https://youtube.com/@yotop10"
                className="social-connection youtube-platform"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect with YouTube"
              >
                <div className="social-icon">
                  <Image
                    src="/brand/youtube.svg"
                    alt=""
                    aria-hidden
                    width={24}
                    height={24}
                  />
                </div>
                <div className="social-info">
                  <span className="social-name">YouTube</span>
                </div>
              </a>

              <a
                href="https://instagram.com/yotop10s"
                className="social-connection instagram-platform"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect with Instagram"
              >
                <div className="social-icon">
                  <Image
                    src="/brand/instagram.svg"
                    alt=""
                    aria-hidden
                    width={24}
                    height={24}
                  />
                </div>
                <div className="social-info">
                  <span className="social-name">Instagram</span>
                </div>
              </a>
            </div>
          </aside>
        </div>

        {/* Advertisements Widget */}
        {sidebar.length > 0 && (
          <div className="sidebar-widget make-it-modern">
            <h3 className="widget-title">
              ADVERTISEMENTS{' '}
              <p
                style={{
                  fontFamily: 'impact',
                  fontSize: '15px',
                  fontWeight: 900,
                }}
              >
                check Out These Services!
              </p>
            </h3>
            <div className="trending-posts">
              {sidebar.map(item => (
                <article className="trending-post" key={item.href}>
                  <a href={item.href} className="trending-post-link">
                    <PostImage item={item} className="trending-post-image" />
                    <div className="trending-post-content">
                      <h4 className="trending-post-title">{item.title}</h4>
                    </div>
                  </a>
                  <div className="trending-post-actions">
                    <button
                      className="mini-action-btn share-btn"
                      type="button"
                      data-title={item.title}
                      data-url={item.href}
                      aria-label={`Share ${item.title}`}
                      onClick={() => share(item.title, item.href)}
                    >
                      <Icon name="Share2" size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
