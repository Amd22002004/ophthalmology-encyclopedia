import assert from "node:assert/strict";
import test from "node:test";
import { formatClinicAddress, removeLeadingClinicCity } from "./clinic-address";

test("removes an exact city prefix and keeps the address suffix", () => {
  assert.equal(
    removeLeadingClinicCity("Тюмень, Червишевский тракт, 2", "Тюмень"),
    "Червишевский тракт, 2",
  );
  assert.equal(
    removeLeadingClinicCity("Екатеринбург, ул. Владимира Высоцкого, 5", "Екатеринбург"),
    "ул. Владимира Высоцкого, 5",
  );
});

test("matches the city case-insensitively and accepts a dash separator", () => {
  assert.equal(
    removeLeadingClinicCity("  тЮмЕнЬ — Червишевский тракт, 2  ", "Тюмень"),
    "Червишевский тракт, 2",
  );
});

test("does not remove a city-like word that is not a leading city value", () => {
  const address = "ул. Тюменская, 10";
  assert.equal(removeLeadingClinicCity(address, "Тюмень"), address);
  assert.equal(removeLeadingClinicCity("Тюменьская улица, 10", "Тюмень"), "Тюменьская улица, 10");
});

test("returns the original address when city is absent and null when only the city was stored", () => {
  const address = "ул. Ленина, 6/5";
  assert.equal(removeLeadingClinicCity(address, null), address);
  assert.equal(removeLeadingClinicCity(address, ""), address);
  assert.equal(removeLeadingClinicCity("Екатеринбург", "Екатеринбург"), null);
});

test("formats the public address with the city shown once", () => {
  assert.equal(formatClinicAddress("Тюмень", "Тюмень, Червишевский тракт, 2"), "Тюмень — Червишевский тракт, 2");
  assert.equal(formatClinicAddress("Тюмень", "Червишевский тракт, 2"), "Тюмень — Червишевский тракт, 2");
  assert.equal(formatClinicAddress(null, "ул. Ленина, 6/5"), "ул. Ленина, 6/5");
  assert.equal(formatClinicAddress("Тюмень", null), "Тюмень");
  assert.equal(formatClinicAddress(null, null), null);
});
