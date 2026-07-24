import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function filesUnder(directory: string): readonly string[] {
  const absolute = path.join(root, directory);
  return readdirSync(absolute).flatMap((name) => {
    const item = path.join(absolute, name);
    return statSync(item).isDirectory()
      ? filesUnder(path.relative(root, item))
      : [item];
  });
}

describe("Phase 2 architecture", () => {
  it("keeps Firebase data imports behind services in production UI code", () => {
    const guarded = ["app", "components", "hooks", "modules", "lib", "types", "utils"];
    const violations = guarded
      .flatMap(filesUnder)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => !file.endsWith("phase2Architecture.test.ts"))
      .filter((file) => /from ["']firebase\/(firestore|functions|storage|auth)["']/.test(readFileSync(file, "utf8")));
    expect(violations).toEqual([]);
  });

  it("registers every active and reserved collection", () => {
    const registry = JSON.parse(readFileSync(path.join(root, "firebase/schema/collection-registry.json"), "utf8")) as {
      active: string[];
      reservedInactiveV1: string[];
    };
    expect(registry.active).toHaveLength(27);
    expect(registry.reservedInactiveV1).toEqual([
      "affiliates",
      "giftCards",
      "loyaltyLedger",
      "subscriptionsBilling",
    ]);
  });

  it("contains the six locked composite index families", () => {
    const config = JSON.parse(readFileSync(path.join(root, "firebase/indexes/firestore.indexes.json"), "utf8")) as {
      indexes: Array<{ collectionGroup: string; fields: Array<{ fieldPath: string }> }>;
    };
    const signatures = config.indexes.map((index) => `${index.collectionGroup}:${index.fields.map((field) => field.fieldPath).join(",")}`);
    expect(signatures).toEqual(expect.arrayContaining([
      "products:studioId,status,createdAt",
      "products:category,status,featured",
      "orders:customerId,orderStatus",
      "orders:studioId,orderStatus,createdAt",
      "reviews:studioId,moderationStatus,createdAt",
      "customOrders:assignedStudioId,status",
    ]));
  });
});
