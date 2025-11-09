import React from 'react';

export interface PrizeAsset {
  symbol: string;
  emoji: string;
  amount: string;
  usdValue: string;
  color: string;
}

export interface PrizeWonPremiumEmailProps {
  drawId: number;
  drawDate: string;
  ticketId: number;
  winningNumber: number;
  totalValueUSD: string;
  assets: PrizeAsset[];
}

export const PrizeWonPremiumEmail: React.FC<PrizeWonPremiumEmailProps> = ({
  drawId,
  drawDate,
  ticketId,
  winningNumber,
  totalValueUSD,
  assets,
}) => {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: '40px', background: '#050811', fontFamily: "'Inter', sans-serif" }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ background: '#050811' }}>
          <tr>
            <td align="center" style={{ padding: '40px 20px' }}>
              <table width="600" cellPadding="0" cellSpacing="0" style={{ maxWidth: '600px', background: 'linear-gradient(135deg, #0a0e27 0%, #050811 100%)', border: '2px solid #ffd700', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 50px rgba(255, 215, 0, 0.5)' }}>

                {/* Header */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.1))', padding: '40px', textAlign: 'center', borderBottom: '2px solid rgba(255, 215, 0, 0.3)' }}>
                    <h1 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '32px', background: 'linear-gradient(90deg, #ffd700 0%, #00f0ff 50%, #ff00ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '2px' }}>
                      CryptoLotto
                    </h1>
                  </td>
                </tr>

                {/* Hero Section */}
                <tr>
                  <td style={{ padding: '50px 40px 40px', textAlign: 'center', background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.1), transparent 70%)' }}>
                    <div style={{ fontSize: '70px', marginBottom: '20px', lineHeight: '1' }}>🎊</div>
                    <h2 style={{ margin: '0 0 5px', fontFamily: "'Orbitron', sans-serif", fontSize: '14px', color: 'rgba(255, 215, 0, 0.8)', letterSpacing: '3px', textTransform: 'uppercase' }}>
                      Congratulations
                    </h2>
                    <h3 style={{ margin: '0 0 15px', fontFamily: "'Orbitron', sans-serif", fontSize: '42px', color: '#ffd700', letterSpacing: '2px', textShadow: '0 0 30px rgba(255, 215, 0, 0.8)', fontWeight: 900 }}>
                      YOU WON!
                    </h3>
                    <p style={{ margin: 0, fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      Draw #{drawId} • {drawDate}
                    </p>
                  </td>
                </tr>

                {/* Prize Display */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05))', border: '2px solid rgba(255, 215, 0, 0.3)', borderRadius: '15px', padding: '30px' }}>
                      <p style={{ margin: '0 0 25px', textAlign: 'center', fontSize: '13px', color: '#ffd700', fontFamily: "'Orbitron', sans-serif", letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                        Your Prize
                      </p>

                      {/* Total Value Banner */}
                      <div style={{ background: 'rgba(0, 240, 255, 0.1)', borderRadius: '12px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 5px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Total Value
                        </p>
                        <p style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '32px', fontWeight: 900, background: 'linear-gradient(135deg, #ffd700, #00f0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          ≈ ${totalValueUSD}
                        </p>
                      </div>

                      {/* Asset List */}
                      <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '10px', padding: '20px' }}>
                        {assets.map((asset, index) => (
                          <div key={asset.symbol} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 0',
                            borderBottom: index < assets.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '24px' }}>{asset.emoji}</span>
                              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '0.5px' }}>
                                {asset.symbol}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 700, color: asset.color }}>
                                {asset.amount}
                              </p>
                              <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                ≈ ${asset.usdValue}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Warning */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'rgba(255, 100, 100, 0.1)', borderLeft: '4px solid #ff6b6b', borderRadius: '10px', padding: '18px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>
                        <strong style={{ color: '#ff6b6b' }}>⚠️ Time Sensitive:</strong> Claim within 30 days or forfeit your prize
                      </p>
                    </div>
                  </td>
                </tr>

                {/* CTA */}
                <tr>
                  <td align="center" style={{ padding: '0 40px 50px' }}>
                    <a href="https://cryptolotto.app/claim" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ffd700, #ffa500)', color: '#050811', textDecoration: 'none', padding: '22px 60px', borderRadius: '12px', fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 900, letterSpacing: '2px', boxShadow: '0 10px 30px rgba(255, 215, 0, 0.5)', textTransform: 'uppercase' }}>
                      🎁 CLAIM PRIZE
                    </a>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ background: 'rgba(255, 215, 0, 0.05)', padding: '30px', textAlign: 'center', borderTop: '2px solid rgba(255, 215, 0, 0.2)' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Ticket #{ticketId} • Winning Number: {winningNumber}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      The Future of Global Lottery • 100% On-Chain
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};
