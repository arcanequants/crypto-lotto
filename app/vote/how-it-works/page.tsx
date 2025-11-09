'use client';

import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden" style={{ background: '#050811' }}>
      {/* HOMEPAGE-STYLE ANIMATED BACKGROUND */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(0, 240, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(255, 0, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%)
          `,
          animation: 'bgShift 20s ease-in-out infinite'
        }}
      />

      {/* CYBER GRID */}
      <div className="grid-bg" />

      {/* Navigation Header */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 text-gray-400 hover:text-cyan-400 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400 transition-all duration-300">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <span className="font-['Orbitron'] text-sm font-semibold tracking-wider">HOME</span>
            </Link>

            <Link href="/vote" className="vote-btn-2">
              Back to Voting
              <span className="icon">✨</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content" style={{ paddingTop: '80px' }}>
        {/* Header */}
        <div className="header">
          <h1 className="title">⚡ How It Works</h1>
          <p className="subtitle">Your voice shapes the prize pool</p>
        </div>

        {/* Prize Distribution Banner */}
        <div className="prize-banner">
          <div className="prize-item">
            <div className="prize-percent">70%</div>
            <div className="prize-name">Bitcoin (BTC)</div>
          </div>
          <div className="prize-item">
            <div className="prize-percent">25%</div>
            <div className="prize-name">Ethereum (ETH)</div>
          </div>
          <div className="prize-item">
            <div className="prize-percent">5%</div>
            <div className="prize-name">Your Choice</div>
          </div>
        </div>

        {/* Timeline Steps */}
        <div className="timeline">
          {/* Step 1 */}
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-title">🎫 Buy Tickets</div>
              <div className="step-description">
                Each ticket you purchase = 1 vote. More tickets = more voting power to choose your favorite crypto!
              </div>
            </div>
            <div className="step-visual">🎫</div>
          </div>

          {/* Step 2 */}
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-title">🗳️ Cast Your Vote</div>
              <div className="step-description">
                Voting opens on the 1st of each month. Choose wisely - your vote is final and cannot be changed!
              </div>
            </div>
            <div className="step-visual">🗳️</div>
          </div>

          {/* Step 3 */}
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-title">⏰ Wait for Results</div>
              <div className="step-description">
                Voting closes on the last day of the month. The winner is automatically announced and added to prizes!
              </div>
            </div>
            <div className="step-visual">⏰</div>
          </div>

          {/* Step 4 */}
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <div className="step-title">🏆 Win Big!</div>
              <div className="step-description">
                All prizes now include Bitcoin (70%), Ethereum (25%), and the community-voted token (5%). Good luck!
              </div>
            </div>
            <div className="step-visual">🏆</div>
          </div>
        </div>

        {/* FAQ */}
        <div className="faq-compact">
          <div className="faq-item">
            <div className="faq-q">→ Can I change my vote?</div>
            <div className="faq-a">No, votes are final. Choose carefully!</div>
          </div>
          <div className="faq-item">
            <div className="faq-q">→ What if there is a tie?</div>
            <div className="faq-a">Bitcoin wins by default.</div>
          </div>
          <div className="faq-item">
            <div className="faq-q">→ Vote multiple times?</div>
            <div className="faq-a">Yes! Buy more tickets anytime.</div>
          </div>
          <div className="faq-item">
            <div className="faq-q">→ All tokens available?</div>
            <div className="faq-a">Bitcoin always. Others rotate monthly.</div>
          </div>
        </div>
      </div>
    </main>
  );
}
