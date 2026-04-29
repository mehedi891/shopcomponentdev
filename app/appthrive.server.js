import { createClient } from '@appthriveio/sdk'

export const appthrive = createClient({
  orgId: process.env.APPTHRIVE_ORG_ID,
  appId: process.env.APPTHRIVE_APP_ID,
  webhookSecret: process.env.APPTHRIVE_WEBHOOK_SECRET,
})