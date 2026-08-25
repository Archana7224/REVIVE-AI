import { getOrCreateDemoMerchant } from "../server/db";

const merchant = await getOrCreateDemoMerchant("ops@acme.example", "Acme Commerce");
console.log(JSON.stringify({ seeded: Boolean(merchant), merchantId: merchant?.id ?? null }));
