import type { Session, PersonSummary } from "./types.js";

/**
 * Calculate each participant's share of the bill, including
 * proportional tax and tip distribution.
 */
export function calculateSummaries(session: Session): PersonSummary[] {
  const { items, tax, tip, subtotal, participants } = session;

  const summaryMap = new Map<string, PersonSummary>();

  // Initialise each participant's summary
  for (const p of participants) {
    summaryMap.set(p.id, {
      participantId: p.id,
      displayName: p.displayName,
      items: [],
      itemsSubtotal: 0,
      taxShare: 0,
      tipShare: 0,
      total: 0,
    });
  }

  // Distribute item costs based on claims
  for (const item of items) {
    const itemTotal = item.price * item.quantity;
    const totalPortions = item.claimedBy.reduce((sum, c) => sum + c.portion, 0);

    for (const claim of item.claimedBy) {
      const summary = summaryMap.get(claim.participantId);
      if (!summary) continue;

      const amount =
        totalPortions > 0 ? (claim.portion / totalPortions) * itemTotal : 0;

      summary.items.push({ name: item.name, amount: round(amount) });
      summary.itemsSubtotal += amount;
    }
  }

  // Distribute tax and tip proportionally
  const claimedSubtotal = Array.from(summaryMap.values()).reduce(
    (sum, s) => sum + s.itemsSubtotal,
    0
  );

  const taxBase = claimedSubtotal > 0 ? claimedSubtotal : subtotal;
  const tipBase = claimedSubtotal > 0 ? claimedSubtotal : subtotal;

  let taxRemainder = tax;
  let tipRemainder = tip;

  const summaries = Array.from(summaryMap.values());

  for (const summary of summaries) {
    const ratio = taxBase > 0 ? summary.itemsSubtotal / taxBase : 0;
    summary.taxShare = round(ratio * tax);
    summary.tipShare = round(ratio * tip);
    summary.itemsSubtotal = round(summary.itemsSubtotal);

    taxRemainder -= summary.taxShare;
    tipRemainder -= summary.tipShare;
  }

  // Distribute remaining pennies (rounding correction) to the first participant
  if (summaries.length > 0) {
    summaries[0].taxShare = round(summaries[0].taxShare + taxRemainder);
    summaries[0].tipShare = round(summaries[0].tipShare + tipRemainder);
  }

  // Compute totals
  for (const summary of summaries) {
    summary.total = round(
      summary.itemsSubtotal + summary.taxShare + summary.tipShare
    );
  }

  return summaries;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
