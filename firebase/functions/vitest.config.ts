import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/communicationPolicy.test.ts",
      "src/customOrderLifecycle.test.ts",
      "src/founderAdminPolicy.test.ts",
      "src/orderLifecycle.test.ts",
      "src/paymentWebhook.test.ts",
      "src/reviewPolicy.test.ts",
      "src/sellerGrowthPolicy.test.ts",
    ],
    environment: "node",
    pool: "forks",
    fileParallelism: false,
    maxWorkers: 1,
  },
});
