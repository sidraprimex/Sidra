import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "components/account/AccountShell.tsx",
  "components/customer/CustomerDashboardClient.tsx",
  "components/studio-admin/StudioOverviewClient.tsx",
  "components/admin/AdminOverviewClient.tsx",
  "components/homepage/HomepageBackgroundSlideshow.tsx",
  "components/homepage/sidraMediaManifest.ts",
  "firebase/indexes/firestore.indexes.json",
  "firebase/rules/firestore.rules",
  "firebase/rules/storage.rules",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("Missing production files:\n" + missing.join("\n"));
  process.exit(1);
}

const scanned = ["app", "components", "services"];
const forbidden = /current-customer|current-seller|current-studio|arrive in their locked phases|corresponding production phase|Coupons are coming in Phase/i;
const hits = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const source = fs.readFileSync(file, "utf8");
      if (forbidden.test(source)) hits.push(path.relative(root, file));
    }
  }
}
for (const dir of scanned) walk(path.join(root, dir));
if (hits.length) {
  console.error("Hardcoded or phase-placeholder connections remain:\n" + hits.join("\n"));
  process.exit(1);
}
console.log("Sidra final repair static connection gate passed.");
