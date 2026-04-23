import { loadStripe } from "@stripe/stripe-js";

const publishableKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.warn("Stripe Publishable Key missing. Please add VITE_STRIPE_PUBLISHABLE_KEY to your environment variables.");
}

export const stripePromise = loadStripe(publishableKey || "pk_test_placeholder");
