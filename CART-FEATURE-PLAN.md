# 🛒 SHOPPING CART FEATURE - PLAN COMPLETO

**Fecha**: 2025-10-18
**Problema**: Actualmente si seleccionas números y compras 10 tickets, compras 10 TICKETS IDÉNTICOS
**Solución**: Implementar carrito donde puedes agregar múltiples tickets con DIFERENTES números

---

## 📍 UBICACIÓN EN EL ROADMAP

### Opción Seleccionada: MODIFICAR SEMANA 3 DÍA 15-17

**ANTES (Roadmap Original)**:
- SEMANA 3 DÍA 15-17: Purchase Flow (8 horas)
- **Descripción**: "Simple: Direct purchase, no batch, no cart"

**DESPUÉS (Roadmap Modificado)**:
- SEMANA 3 DÍA 15-17: Purchase Flow WITH CART (12 horas)
- **Descripción**: "Carrito de compras - múltiples tickets con diferentes números"

**Tiempo adicional**: +4 horas (de 8 horas → 12 horas)

---

## 🎯 FUNCIONALIDAD REQUERIDA

### User Story:
```
Como usuario,
Quiero agregar múltiples tickets con DIFERENTES números a un carrito,
Para poder comprar todos de una vez con una sola transacción
```

### Flujo Completo:
1. Usuario selecciona 5 números + 1 power
2. Click "Add to Cart" (NO compra todavía)
3. Los números se agregan al carrito
4. Number picker se limpia (listo para seleccionar otros números)
5. Usuario repite pasos 1-4 para agregar más tickets
6. Usuario ve resumen del carrito (Ejemplo: "3 tickets en carrito - Total: $0.75")
7. Usuario click "Buy All Tickets"
8. Una sola transacción compra TODOS los tickets con números DIFERENTES

---

## 📝 LISTA DETALLADA DE TAREAS

### FASE 1: Estado del Carrito (30 minutos)

**Archivo**: `/Users/albertosorno/crypto-lotto/web/app/page.tsx`

```typescript
// Agregar state para carrito
const [cart, setCart] = useState<Array<{
  id: string;
  numbers: number[];
  powerNumber: number;
}>>([]);

// Función para agregar al carrito
const addToCart = () => {
  if (selectedMain.length !== 5 || selectedPower === null) {
    showToast('Please select 5 numbers + 1 power number!', 'error');
    return;
  }

  const newTicket = {
    id: Date.now().toString(),
    numbers: [...selectedMain],
    powerNumber: selectedPower
  };

  setCart([...cart, newTicket]);
  clearSelection(); // Limpiar para siguiente ticket
  showToast(`Ticket added to cart! (${cart.length + 1} total)`, 'success');
};

// Función para remover del carrito
const removeFromCart = (id: string) => {
  setCart(cart.filter(ticket => ticket.id !== id));
  showToast('Ticket removed from cart', 'success');
};
```

**Verificación**: ✅ El state se actualiza correctamente cuando agregas/remueves tickets

---

### FASE 2: UI del Carrito (45 minutos)

**Archivo**: `/Users/albertosorno/crypto-lotto/web/app/page.tsx`

Agregar sección DESPUÉS del number picker:

```tsx
{/* Cart Section */}
{cart.length > 0 && (
  <section className="container">
    <div className="cart-section">
      <h2 className="cart-title">🛒 YOUR CART ({cart.length} tickets)</h2>

      <div className="cart-items">
        {cart.map((ticket) => (
          <div key={ticket.id} className="cart-item">
            <div className="cart-ticket-numbers">
              {ticket.numbers.map((num, i) => (
                <span key={i} className="cart-ball">
                  {num.toString().padStart(2, '0')}
                </span>
              ))}
              <span className="plus-sign">+</span>
              <span className="cart-ball power">
                {ticket.powerNumber.toString().padStart(2, '0')}
              </span>
            </div>

            <button
              onClick={() => removeFromCart(ticket.id)}
              className="btn-remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Tickets in cart:</span>
          <span>{cart.length}</span>
        </div>
        <div className="summary-row total">
          <span>TOTAL:</span>
          <span>${(cart.length * 0.25).toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={buyAllTickets}
        className="buy-all-btn"
      >
        🚀 BUY ALL {cart.length} TICKETS
      </button>
    </div>
  </section>
)}
```

**Verificación**: ✅ El carrito se muestra cuando hay tickets, se oculta cuando está vacío

---

### FASE 3: Estilos CSS (30 minutos)

**Archivo**: `/Users/albertosorno/crypto-lotto/web/app/globals.css`

```css
/* Cart Section */
.cart-section {
  background: linear-gradient(135deg, rgba(10, 14, 39, 0.9), rgba(5, 8, 17, 0.95));
  padding: 40px;
  border-radius: 30px;
  margin: 40px 0;
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 20px 60px rgba(255, 215, 0, 0.2);
}

.cart-title {
  text-align: center;
  font-family: 'Orbitron', sans-serif;
  font-size: 32px;
  background: linear-gradient(135deg, var(--accent), var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 30px;
  letter-spacing: 3px;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 215, 0, 0.05);
  border: 2px solid rgba(255, 215, 0, 0.2);
  border-radius: 15px;
  padding: 20px;
  transition: all 0.3s ease;
}

.cart-item:hover {
  border-color: var(--accent);
  background: rgba(255, 215, 0, 0.1);
}

.cart-ticket-numbers {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cart-ball {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: var(--darker);
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  font-size: 16px;
}

.cart-ball.power {
  background: linear-gradient(135deg, var(--accent), #ffa500);
}

.btn-remove {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 107, 107, 0.2);
  border: 2px solid #ff6b6b;
  color: #ff6b6b;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove:hover {
  background: #ff6b6b;
  color: white;
  transform: scale(1.1);
}

.cart-summary {
  background: rgba(255, 215, 0, 0.05);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  font-size: 18px;
}

.summary-row.total {
  font-size: 28px;
  font-weight: 900;
  font-family: 'Orbitron', sans-serif;
  background: linear-gradient(135deg, var(--accent), var(--light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
  padding-top: 15px;
  margin-top: 15px;
}

.buy-all-btn {
  width: 100%;
  padding: 22px;
  background: linear-gradient(135deg, var(--accent), #ffa500);
  color: var(--darker);
  border: none;
  border-radius: 15px;
  font-size: 22px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Orbitron', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.buy-all-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 50px rgba(255, 215, 0, 0.6);
}
```

**Verificación**: ✅ El carrito se ve con el diseño correcto (colores, fuentes, animaciones)

---

### FASE 4: Lógica de Compra (1 hora)

**Archivo**: `/Users/albertosorno/crypto-lotto/web/app/page.tsx`

```typescript
const buyAllTickets = async () => {
  if (!walletConnected) {
    showToast('Please connect your wallet first', 'error');
    await connectWallet();
    return;
  }

  if (cart.length === 0) {
    showToast('Cart is empty!', 'error');
    return;
  }

  try {
    setLoadingText(`Purchasing ${cart.length} tickets...`);
    setLoading(true);

    // MOCK VERSION (Semana 2-5)
    // In Week 6, this will be replaced with actual smart contract calls
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In production, this would be multiple contract calls or batch transaction
    // For now, simulate saving to Supabase
    for (const ticket of cart) {
      console.log('MOCK: Purchasing ticket', ticket.numbers, '+', ticket.powerNumber);
      // await supabase.from('tickets').insert({
      //   wallet_address: walletAddress,
      //   numbers: ticket.numbers,
      //   power_number: ticket.powerNumber,
      //   draw_id: 1
      // });
    }

    showToast(
      `🎉 Successfully purchased ${cart.length} ticket(s)!`,
      'success'
    );

    // Clear cart after successful purchase
    setCart([]);
    setLoading(false);

  } catch (error) {
    console.error('Error buying tickets:', error);
    showToast('Purchase failed. Please try again.', 'error');
    setLoading(false);
  }
};
```

**Verificación**: ✅ Compra todos los tickets del carrito y limpia el carrito después

---

### FASE 5: Cambiar Botón "Add to Cart" (15 minutos)

**Archivo**: `/Users/albertosorno/crypto-lotto/web/app/page.tsx`

Cambiar el botón principal de compra:

```tsx
{/* Actions */}
<div className="picker-actions">
  <button className="btn-secondary" onClick={quickPick}>
    🎲 QUICK PICK
  </button>
  <button className="btn-secondary" onClick={clearSelection}>
    🔄 CLEAR
  </button>
  <button
    className="btn-primary"
    onClick={addToCart}
    disabled={selectedMain.length !== 5 || selectedPower === null}
  >
    ➕ ADD TO CART
  </button>
</div>
```

Agregar estilo para btn-primary:

```css
.btn-primary {
  flex: 1;
  padding: 15px;
  background: linear-gradient(135deg, var(--accent), #ffa500);
  border: 2px solid var(--accent);
  border-radius: 15px;
  color: var(--darker);
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  font-size: 16px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Verificación**: ✅ Botón "ADD TO CART" funciona y se deshabilita cuando no hay números seleccionados

---

### FASE 6: Eliminar Sección "Purchase Tickets" Original (15 minutos)

**Archivo**: `/Users/albertosorno/crypto-lotto/web/app/page.tsx`

ELIMINAR completamente la sección actual de "💳 PURCHASE TICKETS" porque ahora se reemplaza con el carrito.

**Verificación**: ✅ Ya no hay selector de cantidad ni botón "BUY NOW" duplicado

---

### FASE 7: Testing Manual (30 minutos)

**Checklist de Testing**:

```
✅ Puedo seleccionar números y agregar al carrito
✅ Los números se limpian después de agregar
✅ Puedo agregar múltiples tickets con DIFERENTES números
✅ El carrito muestra todos los tickets correctamente
✅ Puedo remover tickets del carrito
✅ El total se calcula correctamente ($0.25 × cantidad)
✅ "Buy All" compra todos los tickets
✅ El carrito se limpia después de comprar
✅ Los estilos se ven correctos (fuentes, colores, animaciones)
✅ Funciona en mobile (responsive)
```

---

## 📊 RESUMEN DE CAMBIOS

### Archivos Modificados:
1. `/Users/albertosorno/crypto-lotto/web/app/page.tsx`
   - Agregar state `cart`
   - Agregar funciones `addToCart`, `removeFromCart`, `buyAllTickets`
   - Agregar UI del carrito
   - Cambiar botones (Add to Cart en vez de Buy Now)
   - Eliminar sección "Purchase Tickets" original

2. `/Users/albertosorno/crypto-lotto/web/app/globals.css`
   - Agregar estilos `.cart-section`
   - Agregar estilos `.cart-item`, `.cart-ball`, etc.
   - Agregar estilo `.btn-primary`

### Archivos Nuevos:
- `/Users/albertosorno/crypto-lotto/web/CART-FEATURE-PLAN.md` (este documento)

---

## ⏱️ TIEMPO ESTIMADO

| Fase | Tarea | Tiempo |
|------|-------|--------|
| 1 | Estado del Carrito | 30 min |
| 2 | UI del Carrito | 45 min |
| 3 | Estilos CSS | 30 min |
| 4 | Lógica de Compra | 60 min |
| 5 | Cambiar Botón | 15 min |
| 6 | Eliminar Sección Original | 15 min |
| 7 | Testing Manual | 30 min |
| **TOTAL** | | **3 horas 45 min** |

**Tiempo original roadmap**: 8 horas
**Tiempo con carrito**: 12 horas (8 + 4)
**Diferencia**: +4 horas

---

## ✅ CRITERIOS DE ÉXITO

La feature está COMPLETA cuando:

1. ✅ Puedo agregar múltiples tickets con DIFERENTES números al carrito
2. ✅ El carrito muestra todos los tickets correctamente
3. ✅ Puedo remover tickets individuales del carrito
4. ✅ "Buy All" compra todos los tickets de una vez
5. ✅ El carrito se limpia después de comprar exitosamente
6. ✅ Los estilos coinciden con el diseño (Orbitron, colores cyan/magenta/gold)
7. ✅ Funciona en mobile (responsive)
8. ✅ No hay errores en consola
9. ✅ El total se calcula correctamente
10. ✅ Los toast notifications aparecen correctamente

---

## 🚫 LO QUE NO SE HACE (Por ahora)

- ❌ Guardar carrito en localStorage (se pierde al refrescar)
- ❌ Límite de tickets en carrito (puede agregar ilimitados)
- ❌ Transacción batch real (eso se hace en Week 6 con smart contract)
- ❌ "Quick pick multiple" que llene el carrito automáticamente
- ❌ Editar ticket del carrito (solo remover y agregar de nuevo)

Estas features se pueden agregar en SEMANA 5 (Polish) si hay tiempo.

---

**Creado**: 2025-10-18
**Alberto**: Aprobado ✅ (pendiente)
**Implementado**: ❌ (pendiente aprobación)
