
import { sessionStorage } from '../shopify.server'
import { appthrive } from '../appthrive.server'


const handler = appthrive.createEnrichmentHandler({
  getAccessToken: async (shopDomain) => {
    // PrismaSessionStorage from @shopify/shopify-app-session-storage-prisma:
    const sessions = await sessionStorage.findSessionsByShop(shopDomain)
    return sessions[0]?.accessToken ?? null
  },
})

export const action = async ({ request }) => handler(request)