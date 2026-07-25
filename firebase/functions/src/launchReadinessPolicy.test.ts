import test from "node:test";
import assert from "node:assert/strict";
import { isReleaseGate, isReleaseStatus, releaseIsReady, RELEASE_GATES } from "./launchReadinessPolicy.js";
test("release gate allow-lists are strict", () => { assert.equal(isReleaseGate("loadTest"), true); assert.equal(isReleaseGate("skipSecurity"), false); assert.equal(isReleaseStatus("passed"), true); assert.equal(isReleaseStatus("done"), false); });
test("production readiness requires every gate and no unresolved risk", () => { assert.equal(releaseIsReady(RELEASE_GATES.map(() => "passed"), 0, 0), true); assert.equal(releaseIsReady(RELEASE_GATES.map(() => "passed"), 1, 0), false); assert.equal(releaseIsReady(RELEASE_GATES.map((_, index) => index === 0 ? "failed" : "passed"), 0, 0), false); });
