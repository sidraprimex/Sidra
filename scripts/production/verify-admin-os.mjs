import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "components/admin/AdminOperatingSystem.tsx",
  "components/admin/os/AdminCmsWorkspace.tsx",
  "components/admin/os/AdminDataExplorer.tsx",
  "components/runtime/RuntimeThemeProvider.tsx",
  "components/runtime/RuntimeContentProvider.tsx",
  "services/adminOperatingService.ts",
  "services/paymentConfigurationService.ts",
  "types/admin-os.ts",
  "app/admin/control-center/page.tsx",
  "README-ADMIN-OS.md",
];
const missing = required.filter((item) => !fs.existsSync(path.join(root, item)));
if (missing.length) {
  console.error("Missing Admin OS files:\n" + missing.join("\n"));
  process.exit(1);
}
const rules = fs.readFileSync(path.join(root, "firebase/rules/firestore.rules"), "utf8");
for (const signal of ["match /manualPaymentRequests/", "allow read, write: if founder();", "function configuredAdmin()"]){
  if (!rules.includes(signal)) {
    console.error(`Firestore Admin OS gate missing: ${signal}`);
    process.exit(1);
  }
}
const admin = fs.readFileSync(path.join(root, "components/admin/AdminOperatingSystem.tsx"), "utf8");
for (const signal of ["Global search", "Firebase data", "Payments", "manualPaymentRequests"]){
  if (!admin.includes(signal)) {
    console.error(`Admin OS workspace missing: ${signal}`);
    process.exit(1);
  }
}
console.log("Sidra Admin OS static gate passed.");
