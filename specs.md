Custom Webhook Setup (Node.js/Python):
Install packages: npm install stripe resend.
Set environment variables: STRIPE_SECRET_KEY and RESEND_API_KEY.
Create a webhook endpoint to listen to invoice.paid or charge.succeeded.
Use the resend.emails.send method to send custom, branded emails.


Webhook signature verification failed: No signatures found matching the expected signature for payload. Are you passing the raw request body you received from Stripe? 
 If a webhook request is being forwarded by a third-party tool, ensure that the exact request body, including JSON formatting and new line style, is preserved.

Learn more about webhook signing and explore webhook integration examples for various frameworks at https://github.com/stripe/stripe-node#webhook-signing


Para que la Sincronización Automática funcione, lo que tienes que hacer es "trasplantar" la lógica de este script a tu archivo server.js de Express.

La diferencia clave es que en el script usas hardhat, pero en el servidor de producción usarás solo ethers puro (conectándote via Alchemy o Infura).

Cómo integrarlo en tu server.js
Aquí tienes cómo debería verse la ruta en tu servidor para que cada vez que el frontend pregunte, el servidor responda con datos frescos de Amoy:



import { ethers } from 'ethers';

// Configuración del Provider (Usa Alchemy o Infura)
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;
const abi = [
  "function getOfferingTerms() external view returns (uint256, uint256, uint256)"
];

const contract = new ethers.Contract(contractAddress, abi, provider);

app.get('/api/offering-terms', async (req, res) => {
  try {
    // 1. Llamada directa a la blockchain (como en tu script)
    const [minBuy, offeredBps, offerValue] = await contract.getOfferingTerms();

    // 2. Formateo de datos
    const data = {
      minBuyAmountUSD: Number(minBuy),
      totalOfferedBps: Number(offeredBps),
      offeringValueUSD: Number(offerValue),
      // Calculamos los campos "Dollars" para el frontend
      minBuyDollars: Number(minBuy) / 100,
      totalOfferedPercent: Number(offeredBps) / 100,
      offeringValueDollars: Number(offerValue) / 100
    };

    res.json(data);
  } catch (error) {
    console.error("Error leyendo blockchain:", error);
    res.status(500).json({ error: "No se pudieron obtener los términos de la blockchain" });
  }
});