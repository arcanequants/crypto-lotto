import React from 'react';

export interface DepositBulkEmailProps {
  amount: string;
  transactionHash: string;
  timestamp: string;
  ticketCount: number;
  drawId: number;
  ticketIds?: number[]; // Optional: show ticket IDs if <= 10
}

export const DepositBulkEmail: React.FC<DepositBulkEmailProps> = ({
  amount,
  transactionHash,
  timestamp,
  ticketCount,
  drawId,
  ticketIds,
}) => {
  const showTicketList = ticketIds && ticketIds.length <= 10;

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

                {/* Success Icon */}
                <tr>
                  <td align="center" style={{ padding: '50px 40px 30px', background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.15), transparent 70%)' }}>
                    <div style={{ width: '100px', height: '100px', background: 'linear-gradient(135deg, #00f0ff, #ff00ff)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', marginBottom: '20px', boxShadow: '0 0 40px rgba(0, 240, 255, 0.6)' }}>
                      ✅
                    </div>
                    <h2 style={{ margin: '0 0 10px', fontFamily: "'Orbitron', sans-serif", fontSize: '32px', color: '#00f0ff', letterSpacing: '2px', textShadow: '0 0 20px rgba(0, 240, 255, 0.5)' }}>
                      TICKETS PURCHASED!
                    </h2>
                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      Your deposit is confirmed
                    </p>
                  </td>
                </tr>

                {/* Amount & Tickets Display */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(255, 0, 255, 0.05))', border: '2px solid rgba(0, 240, 255, 0.3)', borderRadius: '15px', padding: '30px' }}>

                      {/* Amount */}
                      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                          Amount Deposited
                        </p>
                        <p style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '42px', fontWeight: 900, background: 'linear-gradient(135deg, #ffd700, #00f0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>
                          +{amount} USDC
                        </p>
                      </div>

                      {/* Divider */}
                      <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.3), transparent)', margin: '20px 0' }} />

                      {/* Ticket Count */}
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                          Tickets Purchased
                        </p>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '15px', background: 'rgba(255, 215, 0, 0.1)', padding: '15px 30px', borderRadius: '12px', border: '2px solid rgba(255, 215, 0, 0.3)' }}>
                          <span style={{ fontSize: '40px' }}>🎟️</span>
                          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '36px', fontWeight: 900, color: '#ffd700', textShadow: '0 0 20px rgba(255, 215, 0, 0.6)' }}>
                            {ticketCount}
                          </span>
                          <span style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', fontFamily: "'Orbitron', sans-serif" }}>
                            TICKETS
                          </span>
                        </div>
                        <p style={{ margin: '15px 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                          For Draw #{drawId}
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>

                {/* Ticket List (only if <= 10 tickets) */}
                {showTicketList && (
                  <tr>
                    <td style={{ padding: '0 40px 30px' }}>
                      <div style={{ background: 'rgba(0, 240, 255, 0.05)', borderRadius: '12px', padding: '20px' }}>
                        <p style={{ margin: '0 0 15px', fontSize: '12px', color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                          Your Ticket IDs
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', textAlign: 'center' }}>
                          {ticketIds!.map((id) => (
                            <div key={id} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 700 }}>
                                #{id}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Transaction Details */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'rgba(0, 240, 255, 0.05)', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ margin: '0 0 5px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Transaction Hash
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#00f0ff', fontFamily: "'monospace'", wordBreak: 'break-all' }}>
                          {transactionHash}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 5px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Confirmed At
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                          {timestamp}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Good Luck Message */}
                <tr>
                  <td style={{ padding: '0 40px 30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))', borderLeft: '4px solid #ffd700', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '16px', color: '#ffd700', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                        🍀 Good Luck!
                      </p>
                      <p style={{ margin: '5px 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        We'll notify you when the draw is complete
                      </p>
                    </div>
                  </td>
                </tr>

                {/* CTA */}
                <tr>
                  <td align="center" style={{ padding: '0 40px 40px' }}>
                    <a href="https://cryptolotto.app" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #00f0ff, #0080ff)', color: '#ffffff', textDecoration: 'none', padding: '18px 45px', borderRadius: '12px', fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 900, letterSpacing: '2px', boxShadow: '0 5px 20px rgba(0, 240, 255, 0.4)', textTransform: 'uppercase' }}>
                      VIEW MY TICKETS
                    </a>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ background: 'rgba(0, 240, 255, 0.05)', padding: '30px', textAlign: 'center', borderTop: '2px solid rgba(0, 240, 255, 0.2)' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      The Future of Global Lottery
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                      100% On-Chain • Transparent • Fair
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
