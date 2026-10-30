// Verify provider resources, never inspect or expose secret-key contents.
export function requireTestResource(resource: { livemode: boolean }) {
  if (resource.livemode !== false) {
    throw new Error("Live Stripe payments are disabled for this project. Use Stripe test mode.");
  }
}

export async function requireTestStripe(stripe: {
  balance: { retrieve(): Promise<{ livemode: boolean }> };
}) {
  requireTestResource(await stripe.balance.retrieve());
}