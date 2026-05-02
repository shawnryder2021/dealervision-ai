// State-specific dealer-advertising disclaimers.
// These are GENERAL templates compiled from common state attorney general /
// motor-vehicle-dealer-board guidance. Dealers should always have legal counsel
// review before relying on them in actual ads.
//
// When a dealership.state is set, the active state's disclaimers are
// auto-appended to every generated asset prompt.

export interface StateDisclaimer {
  state: string;
  code: string;
  price: string;
  apr: string;
  general: string;
  notes: string;
}

export const STATE_DISCLAIMERS: Record<string, StateDisclaimer> = {
  CA: {
    state: "California",
    code: "CA",
    price:
      "Plus government fees and taxes, any finance charges, dealer document processing charge ($85 max), electronic filing charge, and emission testing charge.",
    apr:
      "APR subject to credit approval. Not all buyers will qualify. See dealer for details.",
    general:
      'All advertised prices exclude tax, title, license, and dealer fees. "While supplies last."',
    notes: "California requires the doc-fee cap to be disclosed and the exact dollar limit shown.",
  },
  TX: {
    state: "Texas",
    code: "TX",
    price:
      "Price excludes tax, title, license, and a documentary fee not to exceed $225. Dealer not responsible for typographical errors.",
    apr: "APR subject to credit approval through approved lender. See dealer for details.",
    general: 'Sale price valid through end of business on advertised date. "While supplies last."',
    notes: "Texas Finance Code caps doc fees; doc-fee cap must be disclosed.",
  },
  FL: {
    state: "Florida",
    code: "FL",
    price:
      "Plus tax, tag, title, registration, and a pre-delivery service charge of $899 (or current dealer rate), which represents costs and profit to the dealer for items such as inspecting, cleaning, and adjusting vehicles, and preparing documents related to the sale.",
    apr: "APR with approved credit. See dealer for terms and conditions.",
    general: 'Offer subject to prior sale. "While supplies last."',
    notes:
      "Florida Statute 501.976 requires the pre-delivery service charge disclosure verbatim when applicable.",
  },
  NY: {
    state: "New York",
    code: "NY",
    price:
      "Plus tax, title, registration, DMV fees, and a documentation fee not to exceed $175. Subject to prior sale.",
    apr: "Financing available with approved credit through participating lenders.",
    general: 'Vehicles sold "as-is" unless otherwise specified in writing.',
    notes: "NY caps doc fees at $175.",
  },
  IL: {
    state: "Illinois",
    code: "IL",
    price:
      "Plus tax, title, license, and $347.26 doc fee (or current cap). Subject to prior sale.",
    apr: "APR subject to credit approval. Not all applicants will qualify.",
    general: '"While supplies last." Dealer not responsible for typographical errors.',
    notes: "Illinois doc fee is annually adjusted; verify current cap.",
  },
  PA: {
    state: "Pennsylvania",
    code: "PA",
    price:
      "Plus tax, title, license, and dealer doc fee. PA requires inspection and emissions where applicable.",
    apr: "APR with approved credit through participating lenders.",
    general: '"While supplies last." Subject to prior sale.',
    notes: "PA requires PA-AVD compliance language for ads.",
  },
  OH: {
    state: "Ohio",
    code: "OH",
    price: "Plus tax, title, license, and dealer doc fee (currently $250 or current cap).",
    apr: "Financing subject to credit approval through approved lender.",
    general: '"While supplies last." Dealer reserves the right to correct errors.',
    notes: "Ohio caps the doc fee.",
  },
  GA: {
    state: "Georgia",
    code: "GA",
    price: "Plus title ad valorem tax (TAVT), tag, and a doc fee not to exceed $599.",
    apr: "APR subject to credit approval.",
    general: '"While supplies last." Dealer not responsible for typographical errors.',
    notes: "Georgia caps doc fees at $599.",
  },
  NC: {
    state: "North Carolina",
    code: "NC",
    price:
      "Plus tax, title, registration, and a $599 administrative fee (or current cap).",
    apr: "APR subject to credit approval through participating lenders.",
    general: '"While supplies last."',
    notes: "NC has specific dealer-advertising regulations under DMV rules.",
  },
  MI: {
    state: "Michigan",
    code: "MI",
    price: "Plus tax, title, license, and a documentary fee not to exceed $230 or current cap.",
    apr: "Financing subject to credit approval.",
    general: '"While supplies last." Dealer reserves the right to correct typographical errors.',
    notes: "Michigan caps doc fees at the larger of $230 or 5% of sale price.",
  },
  WA: {
    state: "Washington",
    code: "WA",
    price: "Plus tax, license, and a $200 negotiable doc service fee.",
    apr: "APR with approved credit through participating lenders.",
    general: '"While supplies last."',
    notes: "WA requires that the doc fee be disclosed as negotiable.",
  },
  OR: {
    state: "Oregon",
    code: "OR",
    price: "Plus tax, title, license, and dealer doc fee (currently capped per ORS).",
    apr: "Financing subject to credit approval.",
    general: '"While supplies last."',
    notes: "Oregon doc fee cap is annually adjusted.",
  },
  AZ: {
    state: "Arizona",
    code: "AZ",
    price: "Plus tax, title, license, and dealer doc fee. Subject to prior sale.",
    apr: "APR with approved credit.",
    general: '"While supplies last."',
    notes: "Arizona requires clear disclosure of finance terms.",
  },
  CO: {
    state: "Colorado",
    code: "CO",
    price: "Plus tax, title, license, and a dealer handling fee not to exceed $699.",
    apr: "Financing subject to credit approval.",
    general: '"While supplies last."',
    notes: "Colorado caps the dealer handling/services fee.",
  },
  MA: {
    state: "Massachusetts",
    code: "MA",
    price: "Plus tax, title, registration, and a doc preparation fee.",
    apr: "APR with approved credit through participating lenders.",
    general: '"While supplies last."',
    notes: "MA Chapter 93A applies to dealer advertising.",
  },
};

export const STATE_OPTIONS = Object.values(STATE_DISCLAIMERS).map((d) => ({
  value: d.code,
  label: `${d.state} (${d.code})`,
}));

export function buildStateDisclaimerBlock(stateCode: string): string {
  const d = STATE_DISCLAIMERS[stateCode];
  if (!d) return "";
  return [
    `\n\n=== ${d.state.toUpperCase()} COMPLIANCE FINE PRINT ===`,
    "Render this disclaimer text legibly at the bottom of the image in a small but readable font:",
    `"${[d.price, d.apr, d.general].filter(Boolean).join(" ")}"`,
    "=== END FINE PRINT ===",
  ].join("\n");
}
