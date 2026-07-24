import { describe, expect, it } from "vitest";
import { foundationContent } from "@/cms/foundationContent";
describe("Sidra foundation content",()=>{it("uses the official Sidra brand and contains no legacy visible brand",()=>{const value=JSON.stringify(foundationContent);expect(value).not.toMatch(/Resora|Sydra/);});it("has unique navigation identifiers",()=>{const ids=foundationContent.navigation.map(x=>x.id);expect(new Set(ids).size).toBe(ids.length);});});
