import { writeFile } from "node:fs/promises";
const gates=["authFlows","securityRules","customerJourney","sellerProvisioning","webhookForgery","performanceBudgets","bugGate","recentBackup","rbacMatrix","loadTest"];
const report={generatedAt:new Date().toISOString(),environment:process.env.SIDRA_RELEASE_ENV??"staging",status:"evidence-required",gates:gates.map(evidenceId=>({evidenceId,status:"notRun",method:"Record measured staging evidence before production approval.",artifactUrl:null}))};
await writeFile("docs/PHASE-13-RELEASE-EVIDENCE.json",JSON.stringify(report,null,2)+"\n");
console.log("Created docs/PHASE-13-RELEASE-EVIDENCE.json. No gate is marked passed without evidence.");
