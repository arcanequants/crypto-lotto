import React from 'react';

interface RocketDrawEmailProps {
  drawId: number;
  drawDate: string;
  drawTime: string;
  winningNumber: number;
  userNumber: number;
  ticketId: number;
}

export const RocketDrawEmail: React.FC<RocketDrawEmailProps> = ({
  drawId,
  drawDate,
  drawTime,
  winningNumber,
  userNumber,
  ticketId,
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
              <table width="600" cellPadding="0" cellSpacing="0" style={{ maxWidth: '600px', background: 'linear-gradient(135deg, #0a0e27 0%, #050811 100%)', border: '2px solid #ff6b35', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(255, 107, 53, 0.4)' }}>

                {/* Header */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 0, 100, 0.1))', padding: '40px', textAlign: 'center', borderBottom: '2px solid rgba(255, 107, 53, 0.3)' }}>
                    <h1 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '32px', background: 'linear-gradient(90deg, #ff6b35 0%, #ffd700 50%, #00f0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '2px' }}>
                      CryptoLotto
                    </h1>
                  </td>
                </tr>

                {/* Rocket Launch Sequence */}
                <tr>
                  <td align="center" style={{ padding: '50px 40px 30px', background: 'radial-gradient(circle at center, rgba(255, 107, 53, 0.15), transparent 70%)' }}>
                    <div style={{ fontSize: '120px', lineHeight: '1', marginBottom: '15px', filter: 'drop-shadow(0 10px 30px rgba(255, 107, 53, 0.8))', transform: 'rotate(-45deg)', display: 'inline-block' }}>🚀</div>
                    <p style={{ margin: '0 0 5px', fontSize: '14px', color: 'rgba(255, 107, 53, 0.9)', fontFamily: "'Orbitron', sans-serif", letterSpacing: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                      Launch Sequence #{drawId}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      {drawDate} • {drawTime}
                    </p>
                  </td>
                </tr>

                {/* Mission Control Display */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 215, 0, 0.05))', border: '2px solid rgba(255, 107, 53, 0.3)', borderRadius: '15px', padding: '30px' }}>

                      {/* Target Number */}
                      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <p style={{ margin: '0 0 15px', fontSize: '12px', color: '#ff6b35', fontFamily: "'Orbitron', sans-serif", letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                          🎯 Target Coordinates
                        </p>
                        <div style={{ background: 'linear-gradient(135deg, #ff6b35, #ff8c42)', padding: '4px', borderRadius: '18px', display: 'inline-block', boxShadow: '0 0 40px rgba(255, 107, 53, 0.6)' }}>
                          <div style={{ background: '#050811', width: '140px', height: '140px', borderRadius: '15px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', lineHeight: '1', textAlign: 'center' }}>
                            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '64px', fontWeight: 900, color: '#ff6b35', textShadow: '0 0 20px rgba(255, 107, 53, 0.8)', display: 'block' }}>{winningNumber}</span>
                            <span style={{ fontSize: '20px', marginTop: '5px', display: 'block' }}>🌙</span>
                          </div>
                        </div>
                      </div>

                      {/* Launch Trail */}
                      <div style={{ textAlign: 'center', margin: '25px 0' }}>
                        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.5), rgba(255, 215, 0, 0.5), transparent)', margin: '0 auto', width: '80%' }} />
                        <div style={{ margin: '10px 0' }}>
                          <span style={{ fontSize: '30px', opacity: 0.3 }}>✦ ✦ ✦</span>
                        </div>
                        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)', margin: '0 auto', width: '80%' }} />
                      </div>

                      {/* Your Launch */}
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 15px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', fontFamily: "'Orbitron', sans-serif", letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                          Your Trajectory
                        </p>
                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '18px', display: 'inline-block', border: '2px solid rgba(255, 255, 255, 0.15)' }}>
                          <div style={{ background: 'rgba(0, 0, 0, 0.3)', width: '140px', height: '140px', borderRadius: '15px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', lineHeight: '1', textAlign: 'center' }}>
                            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '64px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.3)', display: 'block' }}>{userNumber}</span>
                            <span style={{ fontSize: '20px', marginTop: '5px', opacity: 0.3, display: 'block' }}>🌍</span>
                          </div>
                        </div>
                      </div>

                      {/* Mission Status */}
                      <div style={{ marginTop: '25px', padding: '15px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '10px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#ffd700', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                          🔄 RECALIBRATING FOR NEXT LAUNCH
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>

                {/* Astronaut Wisdom */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 107, 53, 0.1))', borderLeft: '4px solid #ffd700', borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '18px', color: '#ffd700', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, lineHeight: '1.4' }}>
                        "The moon is just the beginning."
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'Inter', sans-serif", lineHeight: '1.6' }}>
                        Every great journey needs multiple launches. Keep aiming higher.
                      </p>
                    </div>
                  </td>
                </tr>

                {/* CTA */}
                <tr>
                  <td align="center" style={{ padding: '0 40px 50px' }}>
                    <a href="https://cryptolotto.app" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ff6b35, #ffd700)', color: '#050811', textDecoration: 'none', padding: '20px 50px', borderRadius: '12px', fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 900, letterSpacing: '2px', boxShadow: '0 10px 30px rgba(255, 107, 53, 0.5)', textTransform: 'uppercase' }}>
                      🚀 LAUNCH AGAIN
                    </a>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ background: 'rgba(255, 107, 53, 0.05)', padding: '30px', textAlign: 'center', borderTop: '2px solid rgba(255, 107, 53, 0.2)' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Mission #{ticketId} • Launch #{drawId}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      To The Moon 🌙 • Never Stop Reaching
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
