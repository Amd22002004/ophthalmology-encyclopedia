import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
  getClinicUploadRoot,
  resolveClinicImagePath,
} from "./clinic-image-storage-core";

test("clinic image storage requires an absolute production root", () => {
  assert.throws(
    () => getClinicUploadRoot("relative/uploads", "production"),
    /absolute path/,
  );
  assert.throws(
    () => getClinicUploadRoot(undefined, "production"),
    /required in production/,
  );
});

test("clinic image storage keeps files outside the release root by default", () => {
  assert.equal(
    getClinicUploadRoot(undefined, "development", "D:\\release"),
    path.join("D:\\release", ".data", "clinic-uploads"),
  );
});

test("clinic image path rejects traversal segments", () => {
  assert.throws(
    () => resolveClinicImagePath("/var/lib/ophthalmology/clinic-uploads", "../other", "logo.jpg"),
    /Invalid clinic image slug/,
  );
  assert.throws(
    () => resolveClinicImagePath("/var/lib/ophthalmology/clinic-uploads", "glaztsentr-tyumen", "../logo.jpg"),
    /Invalid clinic image filename/,
  );
});
