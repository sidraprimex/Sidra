import { describe, expect, it } from "vitest";
import fs from "node:fs";
const read=(p:string)=>fs.readFileSync(p,"utf8");
describe("Phase 3.5 architecture",()=>{
  it("keeps discovery pad free of typed search UI",()=>{const source=read("components/discovery/DiscoveryPad.tsx");expect(source).not.toContain("<input");expect(source).not.toContain("placeholder=");});
  it("uses only approved active studios",()=>{const source=read("services/discoveryService.ts");expect(source).toContain('where("active", "==", true)');expect(source).toContain('where("approved", "==", true)');});
  it("contains no placeholder seller data",()=>{const source=read("components/discovery/SellerSelectionGallery.tsx");expect(source).not.toMatch(/demo seller|example seller|artisan one/i);});
  it("keeps canvas engine deterministic",()=>{const source=read("lib/canvas-engine/renderFrame.ts")+read("lib/canvas-engine/photoVideo.ts");expect(source).not.toMatch(/openai|anthropic|diffusion|generative api/i);});
});
