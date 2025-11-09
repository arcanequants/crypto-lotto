import React from 'react';

interface MatrixDrawEmailProps {
  drawId: number;
  drawDate: string;
  drawTime: string;
  winningNumber: number;
  userNumber: number;
  ticketId: number;
}

export const MatrixDrawEmail: React.FC<MatrixDrawEmailProps> = ({
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
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Source+Code+Pro:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: '40px', background: '#050811', fontFamily: "'Inter', sans-serif" }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ background: '#050811' }}>
          <tr>
            <td align="center" style={{ padding: '40px 20px' }}>
              <table width="600" cellPadding="0" cellSpacing="0" style={{ maxWidth: '600px', background: 'linear-gradient(135deg, #0a0e27 0%, #050811 100%)', border: '2px solid #00ff00', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0, 255, 0, 0.3)' }}>

                {/* Header */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 240, 255, 0.05))', padding: '40px', textAlign: 'center', borderBottom: '2px solid rgba(0, 255, 0, 0.3)' }}>
                    <h1 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '32px', background: 'linear-gradient(90deg, #00ff00 0%, #00f0ff 50%, #ffd700 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '2px' }}>
                      CryptoLotto
                    </h1>
                  </td>
                </tr>

                {/* Matrix Code Header */}
                <tr>
                  <td align="center" style={{ padding: '40px 40px 30px', background: 'rgba(0, 255, 0, 0.02)' }}>
                    <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: '12px', color: '#00ff00', lineHeight: '1.6', marginBottom: '20px', opacity: 0.6, letterSpacing: '1px' }}>
                      &gt; INITIATING DRAW #{drawId}...<br />
                      &gt; RANDOMNESS VERIFIED ✓<br />
                      &gt; BLOCKCHAIN CONFIRMED ✓
                    </div>
                    <div style={{ fontSize: '60px', marginBottom: '15px' }}>🎰</div>
                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: "'Source Code Pro', monospace" }}>
                      [{drawDate} • {drawTime}]
                    </p>
                  </td>
                </tr>

                {/* Terminal-Style Results */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: '#000000', border: '2px solid #00ff00', borderRadius: '12px', padding: '25px', fontFamily: "'Source Code Pro', monospace" }}>

                      {/* Command Prompt */}
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ margin: '0 0 15px', fontSize: '11px', color: '#00ff00', opacity: 0.7 }}>
                          $ lottery.getWinningNumber()
                        </p>
                        <div style={{ background: 'rgba(0, 255, 0, 0.1)', borderLeft: '3px solid #00ff00', padding: '15px', marginBottom: '20px' }}>
                          <p style={{ margin: '0 0 5px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                            &gt; WINNING_NUMBER:
                          </p>
                          <p style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '48px', fontWeight: 900, color: '#00ff00', lineHeight: '1', textShadow: '0 0 20px rgba(0, 255, 0, 0.8)' }}>
                            {winningNumber}
                          </p>
                        </div>
                      </div>

                      {/* Second Command */}
                      <div>
                        <p style={{ margin: '0 0 15px', fontSize: '11px', color: '#00ff00', opacity: 0.7 }}>
                          $ lottery.getUserNumber(0x...)
                        </p>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderLeft: '3px solid rgba(255, 255, 255, 0.2)', padding: '15px' }}>
                          <p style={{ margin: '0 0 5px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                            &gt; YOUR_NUMBER:
                          </p>
                          <p style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '48px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.4)', lineHeight: '1' }}>
                            {userNumber}
                          </p>
                        </div>
                      </div>

                      {/* Match Result */}
                      <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255, 100, 100, 0.1)', border: '1px solid rgba(255, 100, 100, 0.3)', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#ff6464', fontWeight: 600 }}>
                          &gt; MATCH: FALSE
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>

                {/* Hacker Quote */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 240, 255, 0.05))', border: '2px solid rgba(0, 255, 0, 0.3)', borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '18px', color: '#00ff00', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, lineHeight: '1.4', textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}>
                        "The best hackers never quit."
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'Source Code Pro', monospace", lineHeight: '1.6' }}>
                        Every attempt brings you closer to cracking the code.
                      </p>
                    </div>
                  </td>
                </tr>

                {/* CTA */}
                <tr>
                  <td align="center" style={{ padding: '0 40px 50px' }}>
                    <a href="https://cryptolotto.app" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #00ff00, #00cc00)', color: '#000000', textDecoration: 'none', padding: '20px 50px', borderRadius: '12px', fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 900, letterSpacing: '2px', boxShadow: '0 10px 30px rgba(0, 255, 0, 0.4)', textTransform: 'uppercase' }}>
                      &gt; RETRY
                    </a>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ background: 'rgba(0, 255, 0, 0.05)', padding: '30px', textAlign: 'center', borderTop: '2px solid rgba(0, 255, 0, 0.2)' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', fontFamily: "'Source Code Pro', monospace" }}>
                      [TICKET_ID: {ticketId}] [DRAW_ID: {drawId}]
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontFamily: "'Source Code Pro', monospace" }}>
                      PERSISTENCE === SUCCESS
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
