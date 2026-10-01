'use client';

import { useState, type FormEvent } from 'react';

type FieldState = 'idle' | 'valid' | 'invalid';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LandingNewsletter() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameState, setNameState] = useState<FieldState>('idle');
  const [emailState, setEmailState] = useState<FieldState>('idle');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateName = (value: string): boolean => value.trim().length >= 2;
  const validateEmail = (value: string): boolean =>
    EMAIL_REGEX.test(value.trim());

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nameOk = validateName(name);
    const emailOk = validateEmail(email);
    setNameState(nameOk ? 'valid' : 'invalid');
    setEmailState(emailOk ? 'valid' : 'invalid');
    if (!nameOk || !emailOk) return;

    setLoading(true);
    setStatus('idle');
    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch('https://formsubmit.co/contact@yotop10.com', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        setStatus('success');
        setName('');
        setEmail('');
        setNameState('idle');
        setEmailState('idle');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="newsletter-section" id="hey">
      <div className="background-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>

      <section className="newsletter-section">
        <div className="background-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="orb orb-4" />
        </div>

        <section className="newsletter-section">
          <div className="background-orbs">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
            <div className="orb orb-4" />
          </div>

          <div className="newsletter-container">
            <div className="newsletter-content">
              <h2 className="section-title">
                Subscribe to Yotop10 newsletter.
              </h2>
              <p className="newsletter-subtitle">
                Don&apos;t miss anything. Get all the latest posts delivered
                straight to your inbox. It&apos;s free!
              </p>

              <form
                className="newsletter-form"
                id="newsletterForm"
                action="https://formsubmit.co/contact@yotop10.com"
                method="POST"
                onSubmit={handleSubmit}
              >
                <div className="form-group">
                  <input
                    type="text"
                    id="userName"
                    name="name"
                    placeholder="Your name"
                    required
                    className={`form-input${nameState !== 'idle' ? ` ${nameState}` : ''}`}
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      setNameState('idle');
                    }}
                    onBlur={() =>
                      setNameState(validateName(name) ? 'valid' : 'invalid')
                    }
                  />
                  <div className="input-glow" />
                </div>

                <div className="form-group">
                  <input
                    type="email"
                    id="userEmail"
                    name="email"
                    placeholder="Your email address"
                    required
                    className={`form-input${emailState !== 'idle' ? ` ${emailState}` : ''}`}
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setEmailState('idle');
                    }}
                    onBlur={() =>
                      setEmailState(validateEmail(email) ? 'valid' : 'invalid')
                    }
                  />
                  <div className="input-glow" />
                </div>

                <button
                  type="submit"
                  className={`subscribe-btn${loading ? ' loading' : ''}`}
                  id="subscribeBtn"
                >
                  <span className="btn-text">Subscribe</span>
                  <div
                    className="btn-loader"
                    style={{ display: loading ? 'flex' : 'none' }}
                  >
                    <div className="spinner" />
                  </div>
                </button>
              </form>

              {/* Success/Error Messages */}
              <div className="message-container">
                <div
                  className="success-message"
                  id="successMessage"
                  style={{ display: status === 'success' ? 'flex' : 'none' }}
                >
                  <svg
                    className="success-icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Successfully subscribed! Check your email for confirmation.
                  </span>
                </div>

                <div
                  className="error-message"
                  id="errorMessage"
                  style={{ display: status === 'error' ? 'flex' : 'none' }}
                >
                  <svg
                    className="error-icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Something went wrong. Please try again.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </section>
  );
}
