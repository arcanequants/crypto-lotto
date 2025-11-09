# SISTEMA DE VOTOS PONDERADOS - Instrucciones de Instalación

## ✅ COMPLETADO

1. ✅ SQL script creado: `supabase-voting-weighted-system.sql`
2. ✅ API `/api/tokens/vote` actualizada para votos ponderados
3. ✅ API `/api/tokens/proposals/current` actualizada para contar ticket_votes

## 📋 PASOS PENDIENTES

### PASO 1: Ejecutar SQL en Supabase ⚠️ IMPORTANTE

1. Ve a Supabase → SQL Editor
2. Abre el archivo `supabase-voting-weighted-system.sql`
3. Copia TODO el contenido
4. Pégalo en el editor SQL
5. Haz clic en "Run"

**Este SQL creará:**
- ✅ Tabla `ticket_votes` (tracking individual de tickets)
- ✅ Función `get_available_votes(wallet, proposal)`
- ✅ Función `get_user_vote_summary(wallet, proposal)`
- ✅ Función `register_weighted_vote(wallet, proposal, token)` ⭐ Principal
- ✅ Actualiza `get_monthly_vote_results` (ahora cuenta ticket_votes)
- ✅ Actualiza `finalize_monthly_vote` (ahora usa pesos)

### PASO 2: Actualizar Frontend (en progreso)

Pendiente actualizar:
- [ ] `/app/components/TokenVoting.tsx` → Mostrar votos disponibles
- [ ] `/app/vote/page.tsx` → Ya actualizado con nuevo texto

### PASO 3: Testear Sistema Completo

Una vez ejecutado el SQL:
```bash
node test-voting-api.js
```

## 🎯 CÓMO FUNCIONA EL NUEVO SISTEMA

### Antes (1 wallet = 1 voto):
```
Usuario compra 10 tickets → Tiene 1 voto
Usuario compra 5 tickets más → Sigue teniendo 1 voto
```

### Ahora (1 ticket = 1 voto):
```
Usuario compra 10 tickets → Tiene 10 votos disponibles
Usuario vota por BTC → Usa LOS 10 votos a la vez
Usuario compra 5 tickets más → Tiene 5 votos nuevos disponibles
Usuario puede votar otra vez → Usa los 5 votos adicionales
```

### Flujo de Usuario:

1. **Compra tickets** en homepage (normal)
2. **Va a `/vote`** cuando quiera votar
3. **Ve**: "Tienes 15 votos disponibles (15 tickets sin votar)"
4. **Elige token** y hace clic en "Vote with 15 votes"
5. **Sistema registra** 15 entradas en `ticket_votes`
6. **Resultado**: Esos 15 tickets ya votaron, no pueden volver a votar

### APIs Actualizadas:

#### POST `/api/tokens/vote`
```json
// Request
{
  "wallet_address": "0x123",
  "token_symbol": "BTC"
}

// Response
{
  "success": true,
  "message": "Successfully registered 15 weighted votes for BTC",
  "votes_registered": 15,
  "token_symbol": "BTC"
}
```

#### GET `/api/tokens/vote?wallet_address=0x123`
```json
{
  "success": true,
  "has_voted": true,
  "total_tickets": 20,       // Total de tickets activos
  "votes_used": 15,           // Tickets que ya votaron
  "votes_available": 5,       // Tickets sin votar
  "voted_token": "BTC"        // Token por el que votó
}
```

## 🔐 Seguridad

- ✅ Cada ticket solo puede votar UNA vez (UNIQUE constraint)
- ✅ Un usuario puede tener votos en múltiples tokens SI compra más tickets después
- ✅ No se puede dividir votos (todos los votos disponibles se usan a la vez)
- ✅ Verificación de que el token está en la propuesta actual

## 📊 Conteo de Votos

Los resultados ahora se cuentan por **peso**:

```sql
-- Antes: contaba wallets únicas
SELECT COUNT(*) FROM token_votes WHERE token_symbol = 'BTC'

-- Ahora: cuenta tickets individuales
SELECT COUNT(*) FROM ticket_votes WHERE token_symbol = 'BTC'
```

## ❓ Preguntas Frecuentes

**P: ¿Puedo dividir mis votos entre varios tokens?**
R: No. Cuando votas, TODOS tus tickets disponibles votan por el mismo token.

**P: ¿Puedo votar varias veces si compro más tickets?**
R: Sí, cada vez que compras nuevos tickets, tienes nuevos votos disponibles.

**P: ¿Qué pasa si ya voté pero compro más tickets?**
R: Puedes volver a `/vote` y votar con los nuevos tickets.

**P: ¿Mis tickets antiguos pueden cambiar de voto?**
R: No. Una vez que un ticket votó, su voto es permanente para ese mes.

## 🚀 PRÓXIMOS PASOS (después de ejecutar el SQL)

1. Actualizar frontend para mostrar votos disponibles
2. Testear con múltiples compras de tickets
3. Verificar que finalize_monthly_vote funciona correctamente
4. Agregar banner en "My Tickets" con votos disponibles
