'use client';

import { Metadata } from 'next';
import TokenVoting from '../components/TokenVoting';
import Link from 'next/link';

export default function VotePage() {
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

      {/* FLOATING PARTICLES */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="fixed w-1 h-1 rounded-full pointer-events-none"
          style={{
            background: i % 3 === 0 ? 'rgba(0, 240, 255, 0.6)' : i % 3 === 1 ? 'rgba(255, 0, 255, 0.6)' : 'rgba(255, 215, 0, 0.6)',
            boxShadow: `0 0 10px ${i % 3 === 0 ? 'rgba(0, 240, 255, 0.8)' : i % 3 === 1 ? 'rgba(255, 0, 255, 0.8)' : 'rgba(255, 215, 0, 0.8)'}`,
            top: `${10 + i * 20}%`,
            left: i % 2 === 0 ? `${10 + i * 10}%` : 'auto',
            right: i % 2 === 1 ? `${10 + i * 10}%` : 'auto',
            animation: `floatParticle${i} 15s infinite ease-in-out`,
            animationDelay: `${i * 3}s`,
            opacity: 0
          }}
        />
      ))}

      {/* GLOW ORBS */}
      <div
        className="fixed w-[300px] h-[300px] rounded-full pointer-events-none opacity-30"
        style={{
          top: '10%',
          left: '5%',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.3), transparent)',
          filter: 'blur(60px)',
          animation: 'orbFloat 20s infinite ease-in-out'
        }}
      />
      <div
        className="fixed w-[300px] h-[300px] rounded-full pointer-events-none opacity-30"
        style={{
          bottom: '10%',
          right: '5%',
          background: 'radial-gradient(circle, rgba(255, 0, 255, 0.3), transparent)',
          filter: 'blur(60px)',
          animation: 'orbFloat 20s infinite ease-in-out',
          animationDelay: '7s'
        }}
      />
      <div
        className="fixed w-[300px] h-[300px] rounded-full pointer-events-none opacity-30"
        style={{
          top: '50%',
          right: '10%',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.2), transparent)',
          filter: 'blur(60px)',
          animation: 'orbFloat 20s infinite ease-in-out',
          animationDelay: '14s'
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Premium Header */}
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="group inline-flex items-center gap-3 text-gray-400 hover:text-amber-400 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center group-hover:border-amber-400 transition-all duration-300">
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </div>
                <span className="font-['Orbitron'] text-sm font-semibold tracking-wider">BACK TO HOME</span>
              </Link>

              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-purple-500/20">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm font-['Orbitron'] text-amber-400 font-semibold">VOTING ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Component - Contains everything */}
        <TokenVoting walletAddress={undefined} />

        {/* CTA Section - Premium Design */}
        <div className="container mx-auto px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-12">
              {/* How It Works Button */}
              <Link
                href="/vote/how-it-works"
                className="group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-black/40 to-purple-500/10 backdrop-blur-xl transition-all duration-300 hover:border-purple-400/50 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="text-xl font-['Orbitron'] font-bold text-white mb-2">How It Works</h3>
                  <p className="text-sm text-gray-400">Learn about voting & FAQ</p>
                </div>
              </Link>

              {/* Buy Tickets CTA */}
              <Link
                href="/"
                className="group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-black/40 to-amber-500/10 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/50 hover:scale-105"
                style={{ boxShadow: '0 0 30px rgba(255, 215, 0, 0.15)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 text-center">
                  <div className="text-4xl mb-3">🎫</div>
                  <h3 className="text-xl font-['Orbitron'] font-bold text-amber-400 mb-2">Get More Votes</h3>
                  <p className="text-sm text-gray-400">Buy tickets to increase power</p>
                </div>
              </Link>
            </div>

            {/* Subtitle */}
            <p className="text-center text-gray-500 text-sm mt-6 font-['Inter']">
              More tickets = More votes = More influence
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
