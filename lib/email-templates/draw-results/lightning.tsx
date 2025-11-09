import React from 'react';

interface LightningDrawEmailProps {
  drawId: number;
  drawDate: string;
  drawTime: string;
  winningNumber: number;
  userNumber: number;
  ticketId: number;
}

export const LightningDrawEmail: React.FC<LightningDrawEmailProps> = ({
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
              <table width="600" cellPadding="0" cellSpacing="0" style={{ maxWidth: '600px', background: 'linear-gradient(135deg, #0a0e27 0%, #050811 100%)', border: '2px solid #ffd700', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(255, 215, 0, 0.5)' }}>

                {/* Header */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05))', padding: '40px', textAlign: 'center', borderBottom: '2px solid rgba(255, 215, 0, 0.3)' }}>
                    <h1 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '32px', background: 'linear-gradient(90deg, #ffd700 0%, #ffed4e 50%, #00f0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '2px' }}>
                      CryptoLotto
                    </h1>
                  </td>
                </tr>

                {/* Lightning Storm */}
                <tr>
                  <td align="center" style={{ padding: '50px 40px 20px', background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.2), transparent 70%)' }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '25px' }}>
                      <div style={{ fontSize: '140px', lineHeight: '1', filter: 'drop-shadow(0 0 40px rgba(255, 215, 0, 1))' }}>⚡</div>
                    </div>
                    <h2 style={{ margin: '0 0 10px', fontFamily: "'Orbitron', sans-serif", fontSize: '24px', color: '#ffd700', letterSpacing: '3px', textTransform: 'uppercase', textShadow: '0 0 20px rgba(255, 215, 0, 0.8)', fontWeight: 900 }}>
                      POWER DRAW #{drawId}
                    </h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      {drawDate} • {drawTime}
                    </p>
                  </td>
                </tr>

                {/* Electric Results */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))', border: '2px solid rgba(255, 215, 0, 0.4)', borderRadius: '15px', padding: '35px', position: 'relative', overflow: 'hidden' }}>

                      {/* Electric Grid Background */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255, 215, 0, 0.3) 0px, rgba(255, 215, 0, 0.3) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(255, 215, 0, 0.3) 0px, rgba(255, 215, 0, 0.3) 1px, transparent 1px, transparent 20px)' }} />

                      {/* Winning Strike */}
                      <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative', zIndex: 1 }}>
                        <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#ffd700', fontFamily: "'Orbitron', sans-serif", letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                          ⚡ Lightning Strike Number ⚡
                        </p>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          {/* Main number */}
                          <div style={{ background: 'linear-gradient(135deg, #ffd700, #ffed4e)', width: '150px', height: '150px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(255, 215, 0, 0.9), 0 0 100px rgba(255, 215, 0, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.3)', position: 'relative', zIndex: 2, lineHeight: '150px', textAlign: 'center' }}>
                            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '70px', fontWeight: 900, color: '#050811', textShadow: '0 2px 5px rgba(0, 0, 0, 0.3)', verticalAlign: 'middle' }}>{winningNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Electric Separator */}
                      <div style={{ textAlign: 'center', margin: '30px 0', position: 'relative', zIndex: 1 }}>
                        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.5), transparent)', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#050811', padding: '0 15px' }}>
                            <span style={{ fontSize: '20px', color: 'rgba(255, 215, 0, 0.5)' }}>⚡</span>
                          </div>
                        </div>
                      </div>

                      {/* Your Charge */}
                      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        <p style={{ margin: '0 0 20px', fontSize: '12px', color: 'rgba(255, 215, 0, 0.6)', fontFamily: "'Orbitron', sans-serif", letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                          Your Number
                        </p>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', width: '150px', height: '150px', borderRadius: '50%', border: '2px solid rgba(255, 215, 0, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)', lineHeight: '150px', textAlign: 'center', margin: '0 auto' }}>
                          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '70px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.25)', verticalAlign: 'middle' }}>{userNumber}</span>
                        </div>
                      </div>

                      {/* Charge Status */}
                      <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '10px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#ffd700', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '1px' }}>
                          ⚡ RECHARGING ENERGY ⚡
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>

                {/* Power Quote */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05))', border: '2px solid rgba(255, 215, 0, 0.4)', borderRadius: '12px', padding: '25px', textAlign: 'center', boxShadow: '0 0 30px rgba(255, 215, 0, 0.2)' }}>
                      <p style={{ margin: '0 0 10px', fontSize: '19px', color: '#ffd700', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, lineHeight: '1.4', textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
                        "Lightning never strikes in the same place... until it does."
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'Inter', sans-serif", lineHeight: '1.6' }}>
                        Your winning strike is charging up. Stay electrified.
                      </p>
                    </div>
                  </td>
                </tr>

                {/* CTA */}
                <tr>
                  <td align="center" style={{ padding: '0 40px 50px' }}>
                    <a href="https://cryptolotto.app" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ffd700, #ffed4e)', color: '#050811', textDecoration: 'none', padding: '20px 50px', borderRadius: '12px', fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 900, letterSpacing: '2px', boxShadow: '0 10px 40px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3)', textTransform: 'uppercase', position: 'relative' }}>
                      ⚡ STRIKE AGAIN
                    </a>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ background: 'rgba(255, 215, 0, 0.05)', padding: '30px', textAlign: 'center', borderTop: '2px solid rgba(255, 215, 0, 0.2)' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Ticket #{ticketId} • Power Draw #{drawId}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      ⚡ Charged & Ready • Your Time Will Come ⚡
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
