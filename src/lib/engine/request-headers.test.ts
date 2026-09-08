import assert from "node:assert/strict";
import { test } from "node:test";

import { getEngineRequestHeaders } from "./request-headers.ts";

test("adds Authorization and apikey when the engine is a Supabase Function", () => {
  const previous = {
    PYTHON_ENGINE_URL: process.env.PYTHON_ENGINE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENGINE_INTERNAL_TOKEN: process.env.ENGINE_INTERNAL_TOKEN,
  };

  process.env.PYTHON_ENGINE_URL = "";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  process.env.ENGINE_INTERNAL_TOKEN = "internal-token";

  try {
    const headers = getEngineRequestHeaders("req-1");
    assert.equal(headers["Content-Type"], "application/json");
    assert.equal(headers["x-request-id"], "req-1");
    assert.equal(headers["x-internal-engine-token"], "internal-token");
    assert.equal(headers.Authorization, "Bearer service-role-test");
    assert.equal(headers.apikey, "service-role-test");
  } finally {
    process.env.PYTHON_ENGINE_URL = previous.PYTHON_ENGINE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = previous.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = previous.SUPABASE_SERVICE_ROLE_KEY;
    process.env.ENGINE_INTERNAL_TOKEN = previous.ENGINE_INTERNAL_TOKEN;
  }
});

test("does not add gateway headers for a Flask engine URL", () => {
  const previous = {
    PYTHON_ENGINE_URL: process.env.PYTHON_ENGINE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  process.env.PYTHON_ENGINE_URL = "http://127.0.0.1:5000/api/engine";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";

  try {
    const headers = getEngineRequestHeaders("req-2");
    assert.equal(headers.Authorization, undefined);
    assert.equal(headers.apikey, undefined);
  } finally {
    process.env.PYTHON_ENGINE_URL = previous.PYTHON_ENGINE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = previous.SUPABASE_SERVICE_ROLE_KEY;
  }
});
