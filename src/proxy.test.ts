import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";

const PUBLICATION_ASSET_PATHS = [
  "/doctors/ostroverhov-aleksandr-ivanovich/dissertaciya.pdf",
  "/doctors/ostroverhov-aleksandr-ivanovich/avtoreferat.pdf",
];

test("разрешённые файлы публикации не перехватываются proxy", () => {
  for (const path of PUBLICATION_ASSET_PATHS) {
    assert.equal(config.matcher.includes(path), false);
  }
});

test("proxy продолжает защищать admin-маршруты", () => {
  const response = proxy(new NextRequest("https://oftalmologia.pro/admin/dashboard"));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://oftalmologia.pro/admin/login");
  assert.deepEqual(config.matcher, ["/admin/:path*", "/auth/:path*", "/invitation/:path*", "/cabinet/:path*"]);
});

test("proxy protects cabinet with the participant cookie boundary", () => {
  const response = proxy(new NextRequest("https://oftalmologia.pro/cabinet"));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://oftalmologia.pro/auth/login?next=%2Fcabinet");
});
