# RoyaltyCertificate — Guía de Despliegue

Contrato: `RoyaltyCertificate.sol`  
Red: Polygon Amoy (testnet) → Polygon Mainnet (producción)

---

## Requisitos previos

**1. Variables de entorno**

Crea un archivo `.env` en la raíz del proyecto con estas variables:

```bash
PRIVATE_KEY=tu_clave_privada_sin_0x
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
CONTRACT_ADDRESS=                        # se rellena después del deploy
```

**2. MATIC para gas**

La wallet del deployer necesita MATIC en Amoy para pagar las transacciones.  
Consíguelo gratis en: https://faucet.polygon.technology

**3. Compilar antes de cualquier cosa**

```bash
npx hardhat compile
```

---

## Ciclo de vida del contrato

El contrato tiene tres estados. Los scripts deben ejecutarse en este orden:

```
NotStarted  ──►  Open  ──►  Closed
   │               │
deploy.ts      mintCertificate()
setTerms.ts    (llamado desde el backend)
openOffering.ts
```

---

## Scripts

### `deploy.ts` — Despliega el contrato

Despliega el contrato en la red. Solo se ejecuta una vez.

```bash
npx hardhat run scripts/deploy.ts --network amoy
```

**Qué hace:**
- Despliega `RoyaltyCertificate` con la dirección USDC configurada
- Imprime la dirección del contrato desplegado
- Opcionalmente llama a `setOfferingTerms` y `openOffering` si están configurados en el script

**Después de ejecutarlo:**  
Copia la dirección del contrato a tu `.env`:
```bash
CONTRACT_ADDRESS=0x_DIRECCION_DEL_CONTRATO
```

---

### `setTerms.ts` — Define los términos de la oferta

Establece los parámetros de la oferta en el contrato. Solo puede llamarse cuando el estado es `NotStarted`.

```bash
MIN_BUY=2000 TOTAL_BPS=2525 OFFERING_VALUE=700000 \
npx hardhat run scripts/setTerms.ts --network amoy
```

**Parámetros:**

| Variable | Descripción | Ejemplo | Valor real |
|---|---|---|---|
| `MIN_BUY` | Compra mínima en céntimos | `2000` | €20.00 |
| `TOTAL_BPS` | % total ofrecido en basis points | `2525` | 25.25% |
| `OFFERING_VALUE` | Recaudación objetivo en céntimos | `700000` | €7,000 |

**Valores actuales del proyecto:**

```bash
MIN_BUY=2000 TOTAL_BPS=2525 OFFERING_VALUE=700000
```

Que corresponden a los tiers:

| Tier | Precio | Spots | Bps/spot | Total bps |
|---|---|---|---|---|
| Lector | €20 | 75 | 5 | 375 |
| Portador | €50 | 30 | 20 | 600 |
| Guardián | €150 | 10 | 55 | 550 |
| Fundador | €500 | 5 | 200 | 1,000 |
| **Total** | | **120** | | **2,525** |

---

### `openOffering.ts` — Abre la oferta

Activa el contrato para que el backend pueda acuñar certificados. Sin este paso, `mintCertificate` falla.

```bash
npx hardhat run scripts/openOffering.ts --network amoy
```

**Qué hace:**
- Cambia el estado de `NotStarted` → `Open`
- A partir de este momento el backend puede llamar a `mintCertificate()`
- Solo puede ejecutarse una vez

---

### `getTerms.ts` — Consulta el estado actual

Lee del contrato los términos y el estado de la oferta. No escribe nada, es solo lectura.

```bash
npx hardhat run scripts/getTerms.ts --network amoy
```

**Qué muestra:**

```
═════════════════════════════════════════════
  Royalty Offering — Current Terms
═════════════════════════════════════════════
  Offering State  : 🟢  Open — minting is active
─────────────────────────────────────────────
  Min Buy Amount  : $20.00 (2000 cents)
  Total Offered   : 25.25% (2525 bps)
  Offering Value  : $7000.00
  % Subscribed    : 12.5%
  Est. Raised     : $875.00
═════════════════════════════════════════════
```

Úsalo para verificar después de cada paso o para comprobar el estado en cualquier momento.

---

## Secuencia completa de despliegue

```bash
# 1. Compilar
npx hardhat compile

# 2. Desplegar
npx hardhat run scripts/deploy.ts --network amoy
# → Copia CONTRACT_ADDRESS al .env

# 3. Definir términos
MIN_BUY=2000 TOTAL_BPS=2525 OFFERING_VALUE=700000 \
npx hardhat run scripts/setTerms.ts --network amoy

# 4. Abrir la oferta
npx hardhat run scripts/openOffering.ts --network amoy

# 5. Verificar
npx hardhat run scripts/getTerms.ts --network amoy
# → Debe mostrar 🟢 Open — minting is active

# 6. Verificar código en Polygonscan (opcional pero recomendado)
npx hardhat verify --network amoy <CONTRACT_ADDRESS> <USDC_ADDRESS>
```

---

## Estado actual del contrato

| | |
|---|---|
| Red | Polygon Amoy (testnet) |
| Contrato | `0xb1E51670d26AA5931F5863C1ba80f3f8F10ba12c` |
| USDC | `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582` |
| Términos | ✅ Definidos |
| Estado | ⚪ Not Started — pendiente `openOffering.ts` |
| Acuñación | ❌ Bloqueada hasta abrir |

---

## Errores comunes

**`could not decode result data (value="0x")`**  
El `CONTRACT_ADDRESS` en `.env` apunta a una wallet, no a un contrato.  
Verifica: `cat .env | grep CONTRACT_ADDRESS`

**`Offering is not open`**  
Falta ejecutar `openOffering.ts`. El contrato rechaza `mintCertificate` hasta que el estado sea `Open`.

**`Exceeds offering cap`**  
Se intentó acuñar más bps de los disponibles. La suma de todos los certificados no puede superar `TOTAL_BPS` (2525).

**`block range exceeds configured limit`**  
El RPC público tiene límite de bloques por consulta. Usa Alchemy o QuickNode para el backend en lugar del RPC público.