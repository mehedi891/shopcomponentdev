function getRemainingTrialDays(planActivatedAt, trialDays) {
  const activatedAt = new Date(planActivatedAt); // e.g. "2025-08-27T08:19:48Z"
  const trialEnd = new Date(activatedAt);
  trialEnd.setDate(trialEnd.getDate() + trialDays);

  const today = new Date();

  // Difference in ms
  const diffMs = trialEnd - today;
  // Convert to days (round up so partial days count as full days)
  const remaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Don’t return negatives
  return remaining > 0 ? remaining : 0;
}

export {
  getRemainingTrialDays
}
