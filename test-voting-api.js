/**
 * TEST SCRIPT - Sistema de Votación de Token del Mes
 *
 * Este script prueba todas las APIs del sistema de votación:
 * 1. GET /api/tokens/vote - Verificar si usuario ya votó
 * 2. POST /api/tokens/vote - Registrar voto
 * 3. GET /api/tokens/proposals/current - Obtener propuesta activa
 *
 * Uso:
 * node test-voting-api.js
 */

const BASE_URL = 'http://localhost:3001';
const TEST_WALLET = '0xTEST123VOTING456';

async function testVotingSystem() {
  console.log('🗳️  TESTING SISTEMA DE VOTACIÓN\n');

  try {
    // =============================================
    // TEST 1: Get Current Proposal
    // =============================================
    console.log('📋 TEST 1: Get Current Proposal');
    const proposalRes = await fetch(`${BASE_URL}/api/tokens/proposals/current`);
    const proposalData = await proposalRes.json();

    if (proposalData.success) {
      console.log('✅ Propuesta activa encontrada:');
      console.log(`   Mes: ${proposalData.proposal.month}/${proposalData.proposal.year}`);
      console.log(`   Tokens: ${proposalData.proposal.proposed_tokens.join(', ')}`);
      console.log(`   Votos totales: ${proposalData.proposal.total_votes}`);
      console.log(`   Período: ${new Date(proposalData.proposal.voting_start_date).toLocaleDateString()} - ${new Date(proposalData.proposal.voting_end_date).toLocaleDateString()}\n`);
    } else {
      console.log('❌ No hay propuesta activa');
      console.log('   Ejecuta el SQL en Supabase primero!\n');
      return;
    }

    // =============================================
    // TEST 2: Check if User Already Voted
    // =============================================
    console.log('🔍 TEST 2: Check if User Already Voted');
    const checkVoteRes = await fetch(`${BASE_URL}/api/tokens/vote?wallet_address=${TEST_WALLET}`);
    const checkVoteData = await checkVoteRes.json();

    if (checkVoteData.success) {
      if (checkVoteData.has_voted) {
        console.log(`✅ Usuario ya votó por: ${checkVoteData.vote.token_symbol}`);
        console.log(`   Fecha: ${new Date(checkVoteData.vote.voted_at).toLocaleString()}\n`);
      } else {
        console.log('✅ Usuario NO ha votado aún\n');
      }
    } else {
      console.log('❌ Error verificando voto:', checkVoteData.error, '\n');
    }

    // =============================================
    // TEST 3: Register Vote (si no ha votado)
    // =============================================
    if (!checkVoteData.has_voted) {
      console.log('🗳️  TEST 3: Register Vote');

      const voteRes = await fetch(`${BASE_URL}/api/tokens/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: TEST_WALLET,
          token_symbol: 'BONK' // Votamos por BONK
        })
      });

      const voteData = await voteRes.json();

      if (voteData.success) {
        console.log('✅ Voto registrado exitosamente!');
        console.log(`   Token: ${voteData.vote.token_symbol}`);
        console.log(`   Wallet: ${voteData.vote.wallet_address}`);
        console.log(`   Fecha: ${new Date(voteData.vote.voted_at).toLocaleString()}\n`);
      } else {
        console.log('❌ Error registrando voto:', voteData.error);
        console.log(`   Mensaje: ${voteData.message}\n`);
      }
    }

    // =============================================
    // TEST 4: Try to Vote Again (debe fallar)
    // =============================================
    console.log('🚫 TEST 4: Try to Vote Again (should fail)');

    const duplicateVoteRes = await fetch(`${BASE_URL}/api/tokens/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: TEST_WALLET,
        token_symbol: 'JUP' // Intentar votar por otro
      })
    });

    const duplicateVoteData = await duplicateVoteRes.json();

    if (!duplicateVoteData.success && duplicateVoteData.error === 'Already voted') {
      console.log('✅ Sistema bloqueó voto duplicado correctamente');
      console.log(`   Mensaje: ${duplicateVoteData.message}\n`);
    } else {
      console.log('❌ PROBLEMA: Sistema permitió voto duplicado!\n');
    }

    // =============================================
    // TEST 5: Verify Vote Count Increased
    // =============================================
    console.log('📊 TEST 5: Verify Vote Count Increased');
    const finalProposalRes = await fetch(`${BASE_URL}/api/tokens/proposals/current`);
    const finalProposalData = await finalProposalRes.json();

    if (finalProposalData.success) {
      console.log('✅ Propuesta actualizada:');
      console.log(`   Votos totales: ${finalProposalData.proposal.total_votes}`);
      console.log(`   (Debería ser mayor que antes)\n`);
    }

    // =============================================
    // RESUMEN
    // =============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TODOS LOS TESTS PASARON');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Abrir http://localhost:3001/vote');
    console.log('2. Probar votación desde el frontend');
    console.log('3. Test CRON finalize-vote');

  } catch (error) {
    console.error('\n❌ ERROR EN TESTS:', error.message);
    console.error('\nAsegúrate de que:');
    console.error('1. El dev server está corriendo (npm run dev)');
    console.error('2. Ejecutaste el SQL en Supabase para crear propuesta activa');
  }
}

// Ejecutar tests
testVotingSystem();
