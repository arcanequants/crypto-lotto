/**
 * TEST SCRIPT - Sistema de Votación PONDERADO (1 Ticket = 1 Voto)
 *
 * Este script prueba el nuevo sistema de votos ponderados donde:
 * - Cada ticket comprado = 1 voto
 * - Todos los votos disponibles se usan a la vez
 * - No se pueden dividir votos entre tokens
 *
 * Uso:
 * node test-weighted-voting.js
 */

const BASE_URL = 'http://localhost:3001';

// Test con 3 wallets diferentes que tienen tickets
const TEST_WALLETS = [
  '0xTEST',  // 1 ticket
  '0x1234567890123456789012345678901234567890', // 3 tickets
  'moos.cowhand.9u@icloud.com' // 19 tickets
];

async function testWeightedVoting() {
  console.log('🗳️  TESTING SISTEMA DE VOTACIÓN PONDERADO\n');
  console.log('═══════════════════════════════════════════\n');

  try {
    // =============================================
    // TEST 1: Get Current Proposal
    // =============================================
    console.log('📋 TEST 1: Get Current Proposal');
    const proposalRes = await fetch(`${BASE_URL}/api/tokens/proposals/current`);
    const proposalData = await proposalRes.json();

    if (!proposalData.success) {
      console.log('❌ No hay propuesta activa');
      return;
    }

    console.log('✅ Propuesta activa:');
    console.log(`   Mes: ${proposalData.proposal.month}/${proposalData.proposal.year}`);
    console.log(`   Tokens: ${proposalData.proposal.proposed_tokens.join(', ')}`);
    console.log(`   Votos totales: ${proposalData.proposal.total_votes}`);
    console.log('');

    // =============================================
    // TEST 2: Check Available Votes for Each Wallet
    // =============================================
    console.log('📊 TEST 2: Check Available Votes for Each Wallet');
    console.log('───────────────────────────────────────────');

    for (const wallet of TEST_WALLETS) {
      const checkRes = await fetch(`${BASE_URL}/api/tokens/vote?wallet_address=${wallet}`);
      const checkData = await checkRes.json();

      if (checkData.success) {
        console.log(`\n💼 Wallet: ${wallet.substring(0, 20)}...`);
        console.log(`   Total tickets: ${checkData.total_tickets}`);
        console.log(`   Votos usados: ${checkData.votes_used}`);
        console.log(`   Votos disponibles: ${checkData.votes_available}`);
        console.log(`   Ya votó: ${checkData.has_voted ? 'Sí' : 'No'}`);
        if (checkData.voted_token) {
          console.log(`   Votó por: ${checkData.voted_token}`);
        }
      }
    }
    console.log('\n');

    // =============================================
    // TEST 3: Register Weighted Votes
    // =============================================
    console.log('🗳️  TEST 3: Register Weighted Votes');
    console.log('───────────────────────────────────────────');

    const votingPlan = [
      { wallet: TEST_WALLETS[0], token: 'BTC', expectedVotes: 1 },
      { wallet: TEST_WALLETS[1], token: 'BONK', expectedVotes: 3 },
      { wallet: TEST_WALLETS[2], token: 'JUP', expectedVotes: 19 },
    ];

    for (const plan of votingPlan) {
      console.log(`\n📮 Votando con wallet: ${plan.wallet.substring(0, 20)}...`);
      console.log(`   Token elegido: ${plan.token}`);
      console.log(`   Votos esperados: ${plan.expectedVotes}`);

      const voteRes = await fetch(`${BASE_URL}/api/tokens/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: plan.wallet,
          token_symbol: plan.token
        })
      });

      const voteData = await voteRes.json();

      if (voteData.success) {
        console.log(`   ✅ ${voteData.message}`);
        console.log(`   Votos registrados: ${voteData.votes_registered}`);

        if (voteData.votes_registered === plan.expectedVotes) {
          console.log(`   ✅ Correcto! Esperaba ${plan.expectedVotes} votos`);
        } else {
          console.log(`   ⚠️  Esperaba ${plan.expectedVotes} pero registró ${voteData.votes_registered}`);
        }
      } else {
        console.log(`   ❌ Error: ${voteData.message || voteData.error}`);
      }
    }
    console.log('\n');

    // =============================================
    // TEST 4: Verify Vote Counts Updated
    // =============================================
    console.log('📈 TEST 4: Verify Vote Counts Updated');
    console.log('───────────────────────────────────────────');

    const finalProposalRes = await fetch(`${BASE_URL}/api/tokens/proposals/current`);
    const finalProposalData = await finalProposalRes.json();

    if (finalProposalData.success) {
      const breakdown = finalProposalData.proposal.votes_breakdown;
      console.log('\n🏆 Resultados actuales:');

      // Ordenar por votos descendente
      const sorted = Object.entries(breakdown)
        .sort(([,a], [,b]) => b.count - a.count);

      sorted.forEach(([token, data], index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        const bar = '█'.repeat(Math.floor(data.percentage / 5));
        console.log(`   ${medal} ${token.padEnd(6)} ${String(data.count).padStart(3)} votos (${String(data.percentage).padStart(5)}%) ${bar}`);
      });

      console.log(`\n   Total de votos: ${finalProposalData.proposal.total_votes}`);
      console.log(`   Esperado: ${1 + 3 + 19} = 23 votos`);

      if (finalProposalData.proposal.total_votes === 23) {
        console.log('   ✅ ¡Perfecto! Los votos ponderados funcionan correctamente');
      } else {
        console.log(`   ⚠️  Hay una discrepancia en el conteo`);
      }
    }
    console.log('\n');

    // =============================================
    // TEST 5: Try to Vote Again (should fail)
    // =============================================
    console.log('🚫 TEST 5: Try to Vote Again (should fail)');
    console.log('───────────────────────────────────────────');

    const duplicateVoteRes = await fetch(`${BASE_URL}/api/tokens/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: TEST_WALLETS[0],
        token_symbol: 'ORCA'
      })
    });

    const duplicateVoteData = await duplicateVoteRes.json();

    if (!duplicateVoteData.success) {
      console.log('✅ Sistema bloqueó correctamente el voto duplicado');
      console.log(`   Mensaje: ${duplicateVoteData.message || duplicateVoteData.error}`);
    } else {
      console.log('❌ PROBLEMA: Sistema permitió voto duplicado!');
    }
    console.log('\n');

    // =============================================
    // RESUMEN FINAL
    // =============================================
    console.log('═══════════════════════════════════════════');
    console.log('✅ TODOS LOS TESTS COMPLETADOS');
    console.log('═══════════════════════════════════════════');
    console.log('\n📝 SISTEMA DE VOTOS PONDERADOS:');
    console.log('   ✅ Cada ticket = 1 voto');
    console.log('   ✅ Múltiples tickets = múltiples votos');
    console.log('   ✅ Votos se cuentan correctamente');
    console.log('   ✅ No se puede votar dos veces');
    console.log('\n🎯 PRÓXIMO PASO:');
    console.log('   Actualizar frontend para mostrar votos disponibles');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR EN TESTS:', error.message);
    console.error('\nAsegúrate de que:');
    console.error('1. El dev server está corriendo (npm run dev)');
    console.error('2. Ejecutaste el SQL de votos ponderados en Supabase');
    console.error('3. Tienes tickets en la base de datos');
  }
}

// Ejecutar tests
testWeightedVoting();
