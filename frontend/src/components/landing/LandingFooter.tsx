import Link from 'next/link';
import Image from 'next/image';

interface FooterSocial {
  href: string;
  label: string;
  brand: string;
}

const MOBILE_SOCIALS: FooterSocial[] = [
  { href: 'https://x.com/yotop10s', label: 'X', brand: 'x' },
  { href: 'https://facebook.com/yotop10s', label: 'Facebook', brand: 'facebook' },
  { href: '#', label: 'LinkedIn', brand: 'linkedin' },
  { href: 'https://instagram.com/yotop10s', label: 'Instagram', brand: 'instagram' },
  { href: 'https://reddit.com/r/yotop10', label: 'Reddit', brand: 'reddit' },
];

const DESKTOP_SOCIALS: FooterSocial[] = [
  { href: 'https://facebook.com/yotop10s', label: 'Facebook', brand: 'facebook' },
  { href: 'https://reddit.com/r/yotop10', label: 'Reddit', brand: 'reddit' },
  { href: 'https://x.com/yotop10s', label: 'X', brand: 'x' },
  { href: 'https://youtube.com/@yotop10', label: 'Youtube', brand: 'youtube' },
  { href: 'https://instagram.com/yotop10s', label: 'Instagram', brand: 'instagram' },
];

function SocialIcons({ socials }: { socials: FooterSocial[] }) {
  return (
    <>
      {socials.map(social => (
        <a
          key={`${social.label}-${social.href}`}
          href={social.href}
          className="social-icon"
          aria-label={social.label}
          target={social.href.startsWith('http') ? '_blank' : undefined}
          rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          <Image
            src={`/brand/${social.brand}.svg`}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
          />
        </a>
      ))}
    </>
  );
}

export function LandingFooter() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Mobile Only Top Section */}
        <div className="footer-top-mobile">
          <div className="footer-logo-section">
            <div className="footer-logo">
              <div className="logo-icon-placeholder">
                <Image src="/icon-512.png" alt="footer-icon" width={32} height={32} />
              </div>
              <span className="logo-text">
                <span className="yo-text">Yo</span>
                <span className="top10-text">Top10</span>
              </span>
            </div>
            <p className="footer-description">
              YoTop10 — Your ultimate destination for top 10 lists, rankings,
              and trending content
            </p>
          </div>

          {/* Social Media Icons */}
          <div className="social-media-section">
            <div className="social-icons">
              <SocialIcons socials={MOBILE_SOCIALS} />
            </div>
          </div>
        </div>

        {/* Desktop Top Section & Main Links Section */}
        <div className="footer-main">
          {/* Desktop Logo and Description */}
          <div className="footer-top-desktop">
            <div className="footer-logo">
              <div className="logo-icon-placeholder">
                <Image src="/icon-512.png" alt="footer-icon" width={32} height={32} />
              </div>
              <span className="logo-text">
                <span className="yo-text">Yo</span>
                <span className="top10-text">Top10</span>
              </span>
            </div>
            <p className="footer-description">
              YoTop10 — Your ultimate destination for top 10 lists, rankings,
              and trending content
            </p>
            <div className="social-icons desktop-social">
              <SocialIcons socials={DESKTOP_SOCIALS} />
            </div>
          </div>

          {/* Link Columns */}
          <div className="footer-links">
            <div className="footer-column">
              <h3 className="footer-heading">WHO ARE WE?</h3>
              <ul className="footer-link-list">
                <li>
                  <Link href="/docs" className="footer-link">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/explore" className="footer-link">
                    Authors
                  </Link>
                </li>
                <li>
                  <a
                    href="https://admin.yotop10.com"
                    className="footer-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Write For Us
                  </a>
                </li>
                <li>
                  <Link href="/docs" className="footer-link">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-heading">Pages</h3>
              <ul className="footer-link-list">
                <li>
                  <Link href="/c/business" className="footer-link">
                    Finance
                  </Link>
                </li>
                <li>
                  <Link href="/c/technology" className="footer-link">
                    Technology
                  </Link>
                </li>
                <li>
                  <Link href="/c/lifestyle" className="footer-link">
                    Lifestyle
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="footer-link">
                    OTHERS
                  </Link>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-heading">LEGAL &amp; PRIVACY</h3>
              <ul className="footer-link-list">
                <li>
                  <Link href="/docs/privacy" className="footer-link">
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="footer-link">
                    Copyright Policy
                  </Link>
                </li>
                <li>
                  <Link href="/docs/terms" className="footer-link">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="footer-link">
                    Disclaimer
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>
              &copy;{' '}
              <span id="currentYear" suppressHydrationWarning>
                {new Date().getFullYear()}
              </span>{' '}
              YoTop10. A PRODUCT OF{' '}
              <a
                href="https://o4ainnovations.space"
                target="_blank"
                rel="noopener noreferrer"
              >
                O4A INNOVATIONS
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
