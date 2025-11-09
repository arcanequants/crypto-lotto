import React from 'react';

interface FortuneDrawEmailProps {
  drawId: number;
  drawDate: string;
  drawTime: string;
  winningNumber: number;
  userNumber: number;
  ticketId: number;
}

export const FortuneDrawEmail: React.FC<FortuneDrawEmailProps> = ({
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
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Cinzel:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: '40px', background: '#050811', fontFamily: "'Inter', sans-serif" }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ background: '#050811' }}>
          <tr>
            <td align="center" style={{ padding: '40px 20px' }}>
              <table width="600" cellPadding="0" cellSpacing="0" style={{ maxWidth: '600px', background: 'linear-gradient(135deg, #0a0e27 0%, #050811 100%)', border: '2px solid #9d4edd', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(157, 78, 221, 0.4)' }}>

                {/* Header */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.15), rgba(255, 0, 255, 0.1))', padding: '40px', textAlign: 'center', borderBottom: '2px solid rgba(157, 78, 221, 0.3)' }}>
                    <h1 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '32px', background: 'linear-gradient(90deg, #9d4edd 0%, #ff00ff 50%, #ffd700 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '2px' }}>
                      CryptoLotto
                    </h1>
                  </td>
                </tr>

                {/* Crystal Ball */}
                <tr>
                  <td align="center" style={{ padding: '50px 40px 30px', background: 'radial-gradient(circle at center, rgba(157, 78, 221, 0.2), transparent 70%)' }}>
                    <div style={{ fontSize: '100px', lineHeight: '1', marginBottom: '20px', filter: 'drop-shadow(0 0 30px rgba(157, 78, 221, 0.8))' }}>🔮</div>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', color: 'rgba(157, 78, 221, 0.8)', fontFamily: "'Cinzel', serif", letterSpacing: '3px', textTransform: 'uppercase' }}>
                      The stars have spoken
                    </p>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#9d4edd', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                      Draw #{drawId} • {drawDate}
                    </h2>
                  </td>
                </tr>

                {/* Mystical Revelation */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.15), rgba(255, 0, 255, 0.1))', border: '2px solid rgba(157, 78, 221, 0.4)', borderRadius: '15px', padding: '35px', position: 'relative' }}>

                      {/* Destiny Number */}
                      <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#9d4edd', fontFamily: "'Cinzel', serif", letterSpacing: '2px', fontWeight: 600, textTransform: 'uppercase' }}>
                          ✨ The Chosen Number ✨
                        </p>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <div style={{ background: 'linear-gradient(135deg, #9d4edd, #7b2cbf)', width: '130px', height: '130px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 50px rgba(157, 78, 221, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.1)', lineHeight: '130px', textAlign: 'center' }}>
                            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '60px', fontWeight: 900, color: '#ffffff', textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)', verticalAlign: 'middle' }}>{winningNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Mystical Divider */}
                      <div style={{ textAlign: 'center', margin: '30px 0' }}>
                        <div style={{ display: 'inline-block' }}>
                          <span style={{ fontSize: '24px', opacity: 0.4 }}>✦ ✦ ✦</span>
                        </div>
                      </div>

                      {/* Your Path */}
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'rgba(157, 78, 221, 0.6)', fontFamily: "'Cinzel', serif", letterSpacing: '2px', fontWeight: 600, textTransform: 'uppercase' }}>
                          Your Path
                        </p>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', width: '130px', height: '130px', borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: '130px', textAlign: 'center', margin: '0 auto' }}>
                          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '60px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.3)', verticalAlign: 'middle' }}>{userNumber}</span>
                        </div>
                      </div>

                    </div>
                  </td>
                </tr>

                {/* Prophecy */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(157, 78, 221, 0.1))', border: '2px solid rgba(157, 78, 221, 0.3)', borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '18px', color: '#ffd700', fontFamily: "'Cinzel', serif", fontWeight: 600, lineHeight: '1.4', fontStyle: 'italic' }}>
                        "Luck is what happens when preparation meets opportunity."
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'Inter', sans-serif", lineHeight: '1.6' }}>
                        Your destiny is being written. The next chapter awaits.
                      </p>
                    </div>
                  </td>
                </tr>

                {/* CTA */}
                <tr>
                  <td align="center" style={{ padding: '0 40px 50px' }}>
                    <a href="https://cryptolotto.app" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #9d4edd, #7b2cbf)', color: '#ffffff', textDecoration: 'none', padding: '20px 50px', borderRadius: '12px', fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 900, letterSpacing: '2px', boxShadow: '0 10px 30px rgba(157, 78, 221, 0.5)', textTransform: 'uppercase' }}>
                      🔮 TRY AGAIN
                    </a>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ background: 'rgba(157, 78, 221, 0.05)', padding: '30px', textAlign: 'center', borderTop: '2px solid rgba(157, 78, 221, 0.2)' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', fontFamily: "'Cinzel', serif" }}>
                      Ticket #{ticketId} • Draw #{drawId}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontFamily: "'Cinzel', serif", fontStyle: 'italic' }}>
                      Trust the Journey • Believe in Your Fortune
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
