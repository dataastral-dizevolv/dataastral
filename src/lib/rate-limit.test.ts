import assert from "node:assert/strict";
import { test } from "node:test";

import { consumeMemoryRateLimit } from "./rate-limit-memory.ts";

test("memory fallback blocks after the configured window max", () => {
  const key = `test:${Date.now()}:${Math.random()}`;
  assert.equal(consumeMemoryRateLimit(key, 2, 60_000), true);
  assert.equal(consumeMemoryRateLimit(key, 2, 60_000), true);
  assert.equal(consumeMemoryRateLimit(key, 2, 60_000), false);
});
