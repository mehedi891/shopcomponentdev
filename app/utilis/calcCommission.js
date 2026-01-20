const tierred = [
  { "from": 0, "to": 500, "rate": 5, "type": "percentage" },
  { "from": 501, "to": 1000, "rate": 10, "type": "percentage" },
  { "from": 1001, "to": 1500, "rate": 15, "type": "percentage" },
]

const sales =1100;
const commissionalTotalValue = 50;

function calculateTierCommission(tiers, saleAmount, commissionalTotalValue) {
  let commission = 0;

  // -----------------------------------------
  // 1. LOOP THROUGH EACH TIER
  // -----------------------------------------
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const isPlus = i === 0 ? 0 : 1;
    const from = tier.from;
    const to = tier.to;
    const rate = tier.rate / 100;

    // -----------------------------------------
    // If sale amount is below the tier start,
    // nothing to calculate for this tier
    // -----------------------------------------
    if (saleAmount <= from) {
      continue;
    }

    // -----------------------------------------
    // Calculate how much of the sale falls inside this tier
    //
    // Example:
    // sale = 1600, tier = 1000 → 1500
    // amountInTier = min(1600, 1500) - 1000 = 500
    // -----------------------------------------
    const amountInTier = (Math.min(commissionalTotalValue, to) - from) + isPlus;

    // Only positive amounts count
    if (amountInTier > 0) {
      commission += amountInTier * rate;
    }

    console.log({ commission, tier, amountInTier, saleAmount, commissionalTotalValue });
  }

  // -----------------------------------------
  // 2. HANDLE EXTRA SALE ABOVE LAST TIER
  // -----------------------------------------
  const lastTier = tiers[tiers.length - 1];
  const lastRate = lastTier.rate / 100;

  if (saleAmount > lastTier.to) {
    const extraAmount = commissionalTotalValue - lastTier.to;
    if (extraAmount > 0) {
      commission += extraAmount * lastRate;
      console.log({ commission, extraAmount, lastTier });
    }

  }

  console.log('commission,',commission);


  return commission;
}

calculateTierCommission(tierred, sales, commissionalTotalValue)


function calculateCommission (totalOrders,totalValue,commissionCiteria,commission,tieredCommissionType){
 
      const tieredCommission = commission.find(c => Number(c.from) <= totalOrders && Number(c.to) >= totalOrders ) || [];
      if(tieredCommission?.type){
        const commissionType = tieredCommission.type;
        const commissionValue = tieredCommission.rate;

        if(commissionType === "percentage"){
          return (totalValue * commissionValue) / 100;
        }else if(commissionType === "fixed"){
          return commissionValue;
        }
      }
      return 0;
    }
  
