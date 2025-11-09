/**
 * Structured Data (JSON-LD) for SEO and AI Discoverability
 * This helps Google, ChatGPT, Perplexity, and other AIs understand your site
 */

export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      // Website
      {
        "@type": "WebSite",
        "@id": "https://cryptolotto.app/#website",
        "url": "https://cryptolotto.app",
        "name": "CryptoLotto",
        "description": "Transparent blockchain lottery with daily and weekly draws",
        "publisher": {
          "@id": "https://cryptolotto.app/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://cryptolotto.app/search?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },

      // Organization
      {
        "@type": "Organization",
        "@id": "https://cryptolotto.app/#organization",
        "name": "CryptoLotto",
        "url": "https://cryptolotto.app",
        "logo": {
          "@type": "ImageObject",
          "url": "https://cryptolotto.app/logo.png",
          "width": 512,
          "height": 512
        },
        "sameAs": [
          "https://twitter.com/CryptoLotto",
          "https://t.me/cryptolotto",
          "https://github.com/cryptolotto"
        ]
      },

      // WebApplication
      {
        "@type": "WebApplication",
        "name": "CryptoLotto",
        "url": "https://cryptolotto.app",
        "description": "Play transparent blockchain lottery with daily and weekly draws. $0.25 tickets, quantum-random numbers, instant crypto prizes.",
        "applicationCategory": "GameApplication",
        "operatingSystem": "Any",
        "offers": {
          "@type": "Offer",
          "price": "0.25",
          "priceCurrency": "USD",
          "description": "Lottery ticket price"
        },
        "featureList": [
          "Daily lottery draws at 8 PM UTC",
          "Weekly lottery draws every Sunday",
          "Quantum random number generation",
          "100% on-chain verification",
          "Instant prize claims",
          "Transparent smart contracts",
          "Dual participation (daily + weekly)"
        ],
        "screenshot": {
          "@type": "ImageObject",
          "url": "https://cryptolotto.app/screenshot.png"
        }
      },

      // Service
      {
        "@type": "Service",
        "name": "CryptoLotto Blockchain Lottery",
        "provider": {
          "@id": "https://cryptolotto.app/#organization"
        },
        "serviceType": "Blockchain Lottery Service",
        "description": "Decentralized lottery service with provably fair quantum random number generation",
        "areaServed": "Worldwide",
        "availableChannel": {
          "@type": "ServiceChannel",
          "serviceUrl": "https://cryptolotto.app",
          "serviceType": "Online"
        }
      },

      // FAQ Page (helps with "People Also Ask" in Google)
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How much does a CryptoLotto ticket cost?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Each lottery ticket costs $0.25 (0.00015625 ETH). When you buy one ticket, you automatically participate in both the daily and weekly draws."
            }
          },
          {
            "@type": "Question",
            "name": "When are the lottery draws?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Daily draws happen every day at 8 PM UTC. Weekly draws happen every Sunday at 8 PM UTC. If you buy a ticket after 8 PM, it participates in the next day's draw."
            }
          },
          {
            "@type": "Question",
            "name": "Is CryptoLotto provably fair?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! CryptoLotto uses API3 Quantum Random Number Generator (QRNG) from Australian National University. All draws are 100% on-chain and verifiable on the blockchain."
            }
          },
          {
            "@type": "Question",
            "name": "How do I claim my prize?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Prizes are claimed directly from the smart contract. Simply connect your wallet and click 'Claim Prize' on your winning ticket. The crypto is transferred instantly to your wallet."
            }
          },
          {
            "@type": "Question",
            "name": "What blockchain does CryptoLotto use?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CryptoLotto is deployed on BASE (Coinbase L2) for low fees and fast transactions. We may expand to Polygon and Ethereum in the future."
            }
          },
          {
            "@type": "Question",
            "name": "Can I verify the lottery draws?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Absolutely! Every draw is recorded on-chain with a transaction hash. You can verify the winning numbers, random seed, and all prize claims on the block explorer."
            }
          }
        ]
      },

      // BreadcrumbList (for navigation)
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://cryptolotto.app"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Play",
            "item": "https://cryptolotto.app/play"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Results",
            "item": "https://cryptolotto.app/results"
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": "How It Works",
            "item": "https://cryptolotto.app/how-it-works"
          }
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
