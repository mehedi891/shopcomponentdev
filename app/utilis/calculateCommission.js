function calculateFixedCommission(fixedCommission, saleAmount) {
  let commission = 0;
  const type = fixedCommission.type;
  const rate = Number(fixedCommission.value);
  if (type === "percentage") {
    commission = (saleAmount * rate) / 100;
  } else if (type === "fixed") {
    commission = rate;
  }

  return commission;
}


function calculateTierCommission(tiers, lifeTimesubTotalAmount, commissionalValue) {
  let commission = 0;
  if (!Array.isArray(tiers) || tiers.length === 0) return 0;
  const subTotalAmount = Number(lifeTimesubTotalAmount);
  const commissionalValueNum = Number(commissionalValue);
  // let tieredCommission = tiers.find(c => Number(c.from) <= subTotalAmount && Number(c.to) >= subTotalAmount) || [];
  // if (tieredCommission?.length === 0) {
  //   tieredCommission = tiers[tiers.length - 1];
  // }

  const tieredCommission = getCurrentTier(tiers, subTotalAmount) ; 

  if (tieredCommission?.type) {
    const commissionType = tieredCommission.type;
    const rate = Number(tieredCommission.rate);

    if (commissionType === "percentage") {
      commission = (rate * commissionalValueNum) / 100;
      return commission;
    } else if (commissionType === "amount") {
      commission = rate;
      return commission;
    }
  }
  // console.log({ thisiuiu: "From calculateTierCommission", tiers, lifeTimesubTotalAmount, commissionalValue,tieredCommission,commission });
}

function getCurrentTier(tiers, lifeTimesubTotalAmount) {
  const subTotalAmount = Number(lifeTimesubTotalAmount);
  let tieredCommission = tiers.find(c =>  Number(c.to) >= subTotalAmount) || [];
  if (tieredCommission?.length === 0) {
    tieredCommission = tiers[tiers.length - 1];
  }
  return tieredCommission;
}

export {
  calculateFixedCommission,
  calculateTierCommission,
  getCurrentTier
}