const APPLIES_TO = {
  byproduct: 'product',
  bycollection: 'collection'
}

const ADD_TO_CART_TYPE = {
  individual: 'individual',
  bulk: 'bulk'
}

const LAYOUT = {
  grid: 'grid',
  list: 'list',
  grid_slider: 'gridSlider'

}

const STATUS = {
  activate: 'activate',
  deactivate: 'deactivate'
}

const CART_BEHAVIOR = {
  cart: 'cart',
  checkout: 'checkout'
}

const SHOW_COMPONENT_TITLE = {
  yes: 'yes',
  no: 'no'
}

const MAX_ALLOWED_COMPONENTS = {
  free: 1,
  growth: 10
}

const PLAN_TYPE = {
  monthly: 'monthly',
  yearly: 'yearly'
}
const PLAN_NAME = {
  free: 'Free',
  growth: 'Growth'
}

const PLAN_STATUS = {
  active: 'ACTIVE',
  cancelled: 'CANCELLED',
  declined: 'DECLINED',
  expired: 'EXPIRED',
  frozen: 'FROZEN',
  pending: 'PENDING',
}

const PLAN_PRICE = {
  growth_monthly: {
    price: 29.00,
  },
  growth_yearly: {
    price: 348,
    discountValue: 20,
    discountedPrice: 278.4,
    discountType: 'percentage',
    discountDuration: null,
  }
}

const DISCOUNT_TYPE = {
  percentage: 'percentage',
  fixed: 'fixed'
}

const BoleanOptions = {
  yes: 'yes',
  no: 'no'
}

const COMISSION_CRITERIA = {
  tiered: 'tiered',
  fixed: 'fixed'
}

const TIERED_TYPE = {
  quantity: 'quantity',
  amount: 'amount'
} 

const FIXED_COMISSION = {
  amount: 'amount',
  percentage: 'percentage'
}

const AFFILIATE_STATUS = {
  active: 'active',
  inactive: 'inactive'
}

export {
  APPLIES_TO,
  ADD_TO_CART_TYPE,
  LAYOUT,
  STATUS,
  CART_BEHAVIOR,
  SHOW_COMPONENT_TITLE,
  PLAN_TYPE,
  PLAN_NAME,
  PLAN_STATUS,
  PLAN_PRICE,
  MAX_ALLOWED_COMPONENTS,
  DISCOUNT_TYPE,
  BoleanOptions,
  COMISSION_CRITERIA,
  TIERED_TYPE,
  FIXED_COMISSION,
  AFFILIATE_STATUS
}