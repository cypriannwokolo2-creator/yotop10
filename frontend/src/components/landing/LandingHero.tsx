import { Icon } from '@/components/icons/Icon';

export function LandingHero() {
  return (
    <section className="hero-section" id="heroSection">
      <div className="hero-container">
        {/* Animated Background Elements */}
        <div className="hero-bg-effects">
          <div className="floating-orb orb-1" />
          <div className="floating-orb orb-2" />
          <div className="floating-orb orb-3" />
          <div className="grid-overlay" />
        </div>

        {/* Main Hero Content */}
        <div className="hero-content">
          {/* Welcome Header */}
          <div className="hero-header">
            <h1 className="hero-title">
              <span className="yo-text">Yo!</span> Welcome to
              <span className="brand-name">
                <span className="yo-text">Yo</span>
                <span className="top10-text">Top10</span>
              </span>
            </h1>
          </div>

          {/* Tagline */}
          <div className="hero-tagline">
            <p>
              Where the internet&apos;s{' '}
              <span className="highlight-text">wildest Arguments</span> come out
              to play.
            </p>
          </div>

          {/* Confirmation */}
          <div className="hero-confirmation">
            <p className="hero-motto">We rank it all. We rate it raw.</p>
          </div>

          {/* Features */}
          <div className="hero-features">
            <div className="feature-item">
              <Icon name="Rocket" size={19} className="feature-icon" />
              <span>Fast facts</span>
            </div>
            <div className="feature-item">
              <Icon name="Target" size={19} className="feature-icon" />
              <span>No fluff</span>
            </div>
            <div className="feature-item">
              <Icon name="Brain" size={19} className="feature-icon" />
              <span>Maximum scroll addiction</span>
            </div>
          </div>

          {/* Call to Action */}
          <div className="hero-cta">
            <blockquote className="hero-quote">
              So grab your curiosity, click something weird, and lose yourself
              in the best kind of rabbit hole.
            </blockquote>
            <p className="hero-promise">
              Your next favorite list is just one click away.
            </p>
            <a className="countdown-text" href="#cake">
              <span>Let the countdowns begin.</span>
              <Icon name="Hourglass" size={16} className="countdown-icon" />
            </a>
          </div>

          {/* Action Button */}
          <div className="hero-action">
            <a href="#cake">
              <button
                className="start-journey-btn"
                id="startJourneyBtn"
                type="button"
              >
                <span className="btn-text">Start Journey</span>
                <Icon name="ArrowRight" size={16} className="btn-icon" />
                <div className="btn-ripple" />
              </button>
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
          <span className="scroll-text">Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}
