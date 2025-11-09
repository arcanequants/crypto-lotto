import React from 'react';

interface UnstoppableDrawEmailProps {
  drawId: number;
  drawDate: string;
  drawTime: string;
  winningNumber: number;
  userNumber: number;
  ticketId: number;
}

export const UnstoppableDrawEmail: React.FC<UnstoppableDrawEmailProps> = ({
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
              <table width="600" cellPadding="0" cellSpacing="0" style={{ maxWidth: '600px', background: 'linear-gradient(135deg, #0a0e27 0%, #050811 100%)', border: '2px solid #00f0ff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0, 240, 255, 0.3)' }}>

                {/* Header */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(255, 0, 255, 0.1))', padding: '40px', textAlign: 'center', borderBottom: '2px solid rgba(0, 240, 255, 0.3)' }}>
                    <h1 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '32px', background: 'linear-gradient(90deg, #00f0ff 0%, #ff00ff 50%, #ffd700 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '2px' }}>
                      CryptoLotto
                    </h1>
                  </td>
                </tr>

                {/* Energy Burst Icon */}
                <tr>
                  <td align="center" style={{ padding: '50px 40px 20px', background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.15), transparent 70%)' }}>
                    <div style={{ fontSize: '100px', lineHeight: '1', marginBottom: '20px', filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))' }}>⚡</div>
                    <h2 style={{ margin: '0 0 10px', fontFamily: "'Orbitron', sans-serif", fontSize: '16px', color: 'rgba(255, 215, 0, 0.9)', letterSpacing: '4px', textTransform: 'uppercase' }}>
                      Draw #{drawId}
                    </h2>
                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      {drawDate} • {drawTime}
                    </p>
                  </td>
                </tr>

                {/* Numbers Display */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(255, 0, 255, 0.05))', border: '2px solid rgba(0, 240, 255, 0.3)', borderRadius: '15px', padding: '30px', position: 'relative' }}>

                      {/* Winning Number */}
                      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <p style={{ margin: '0 0 15px', fontSize: '13px', color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                          🎯 Winning Number
                        </p>
                        <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ffd700, #ffa500)', width: '120px', height: '120px', borderRadius: '20px', boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), 0 10px 30px rgba(255, 215, 0, 0.4)', lineHeight: '120px', textAlign: 'center' }}>
                          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '56px', fontWeight: 900, color: '#050811', verticalAlign: 'middle' }}>{winningNumber}</span>
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div style={{ textAlign: 'center', margin: '25px 0' }}>
                        <div style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.1)', padding: '8px 25px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700, letterSpacing: '2px' }}>VS</span>
                        </div>
                      </div>

                      {/* Your Number */}
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 15px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', fontFamily: "'Orbitron', sans-serif", letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                          Your Number
                        </p>
                        <div style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.05)', width: '120px', height: '120px', borderRadius: '20px', border: '2px solid rgba(255, 255, 255, 0.15)', lineHeight: '120px', textAlign: 'center' }}>
                          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '56px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.4)', verticalAlign: 'middle' }}>{userNumber}</span>
                        </div>
                      </div>

                    </div>
                  </td>
                </tr>

                {/* Motivational Quote */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05))', borderLeft: '4px solid #ffd700', borderRadius: '12px', padding: '25px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '18px', color: '#ffd700', fontFamily: "'Inter', sans-serif", fontWeight: 700, lineHeight: '1.4' }}>
                        "Fortune favors the bold."
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'Inter', sans-serif", lineHeight: '1.6' }}>
                        Your moment is coming. Stay in the game.
                      </p>
                    </div>
                  </td>
                </tr>

                {/* CTA */}
                <tr>
                  <td align="center" style={{ padding: '0 40px 50px' }}>
                    <a href="https://cryptolotto.app" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ffd700, #ffa500)', color: '#050811', textDecoration: 'none', padding: '20px 50px', borderRadius: '12px', fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 900, letterSpacing: '2px', boxShadow: '0 10px 30px rgba(255, 215, 0, 0.5)', textTransform: 'uppercase' }}>
                      ⚡ PLAY AGAIN
                    </a>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ background: 'rgba(0, 240, 255, 0.05)', padding: '30px', textAlign: 'center', borderTop: '2px solid rgba(0, 240, 255, 0.2)' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Ticket #{ticketId} • Draw #{drawId}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      Never Give Up • Your Win Is Coming
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
