import { COMISSION_CRITERIA, TIERED_COMISSION_TYPE } from "../constants/constants";

function calculateCommission (totalOrders,totalValue,commissionCiteria,commission,tieredCommissionType){
  if (commissionCiteria === COMISSION_CRITERIA.fixed){
    if(commission.type === "percentage"){
      return (totalValue * commission.value) / 100;
    }else if(commission.type === "fixed"){
      return commission.value;
    }
  }else{
    if (tieredCommissionType === TIERED_COMISSION_TYPE.quantity){
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
  }
}

export default calculateCommission