function getRemainingTrialDays(createdAt,maxTrialDays) {
  const createdDate = new Date(createdAt);
  const today = new Date();

  // Normalize both dates (ignore hours, minutes, seconds)
  createdDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // Calculate how many days have passed since creation
  const diffInMs = today - createdDate;
  const daysPassed = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Remaining trial days
  const remaining = maxTrialDays - daysPassed;

  // No negative values
  return remaining > 0 ? remaining : 0;
}



export {
  getRemainingTrialDays
}
