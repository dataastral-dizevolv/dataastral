import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";

import {
  isCalendarDate,
  isClockTime,
  isUuid,
  normalizeDynamicAnswers,
} from "./fields.ts";
import { parseApiBody } from "./parse-body.ts";

test("accepts real calendar dates and HH:mm times", () => {
  assert.equal(isCalendarDate("1994-05-12"), true);
  assert.equal(isCalendarDate("1994-02-30"), false);
  assert.equal(isCalendarDate("12/05/1994"), false);
  assert.equal(isClockTime(""), true);
  assert.equal(isClockTime("14:30"), true);
  assert.equal(isClockTime("24:01"), false);
});

test("normalizes dynamicAnswers with key, value and array caps", () => {
  const longKey = `  ${"k".repeat(90)}`;
  const output = normalizeDynamicAnswers({
    [longKey]: "v".repeat(600),
    list: ["ok", 1, "b".repeat(250)],
    skip: { nested: true },
  });

  assert.ok(output);
  const keys = Object.keys(output);
  assert.equal(keys.length, 2);
  assert.ok((keys[0] ?? "").length <= 80);
  assert.equal(String(output[keys[0] ?? ""]).length, 500);
  assert.deepEqual(output.list, ["ok", "b".repeat(200)]);
});

test("maps the first zod path to a stable API code", () => {
  const schema = z.object({
    question: z.string().trim().min(1).max(300),
    birthDate: z.string().refine(isCalendarDate),
  });

  const parsed = parseApiBody(schema, { question: "x".repeat(301), birthDate: "1994-05-12" });
  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.equal(parsed.code, "INVALID_QUESTION");
  }

  assert.equal(isUuid("11111111-1111-4111-8111-111111111111"), true);
  assert.equal(isUuid("not-a-uuid"), false);
});
