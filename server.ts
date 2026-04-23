import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Stripe initialization (Lazy, with mock fallback)
  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) return null; // Mock mode
      stripe = new Stripe(key);
    }
    return stripe;
  };

  // API Routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = "egp" } = req.body;
      
      const stripeClient = getStripe();
      
      // Mock mode: no Stripe key configured
      if (!stripeClient) {
        return res.json({ 
          clientSecret: "mock_secret_" + Date.now(),
          mock: true 
        });
      }

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        automatic_payment_methods: { enabled: true },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
