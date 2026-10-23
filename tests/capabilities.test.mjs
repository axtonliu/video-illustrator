import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const list = JSON.parse(readFileSync(path.join(ROOT, "capabilities.json"), "utf8"));

test("every capability has a unique id and an entry file that exists", () => {
  assert.equal(list.schema, "video-illustrator.capabilities.v1");
  const ids = list.capabilities.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const entry of list.capabilities) {
    assert.match(entry.id, /^[a-z][a-z0-9-]*$/);
    assert.ok(existsSync(path.join(ROOT, entry.entry)), `${entry.id}: ${entry.entry} exists`);
    assert.ok(typeof entry.does === "string" && entry.does.length > 0);
  }
});
