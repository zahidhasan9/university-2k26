"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-at-least-32-characters-long";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-characters-long";

const { app } = require("../dist/app");

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test("liveness endpoint follows the standard API envelope", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health/live`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.message, "UniSphere API process is alive");
    assert.equal(typeof body.data.uptime, "number");
  });
});

test("readiness fails while MongoDB is disconnected", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health/ready`);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.success, false);
  });
});

test("protected modules reject anonymous requests", async () => {
  await withServer(async (baseUrl) => {
    const paths = [
      "/api/users",
      "/api/students",
      "/api/finance/invoices",
      "/api/hr/employees",
      "/api/analytics/admin",
      "/api/communication/notifications/dispatch",
    ];
    for (const path of paths) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 401, path);
    }
  });
});

test("OpenAPI specification and Swagger UI are publicly available", async () => {
  await withServer(async (baseUrl) => {
    const specificationResponse = await fetch(`${baseUrl}/api/docs/openapi.json`);
    const specification = await specificationResponse.json();
    assert.equal(specificationResponse.status, 200);
    assert.equal(specification.openapi, "3.1.0");
    assert.equal(specification.info.title, "UniSphere ERP API");
    assert.ok(specification.paths["/communication/notifications/dispatch"]);

    const uiResponse = await fetch(`${baseUrl}/api/docs/`);
    assert.equal(uiResponse.status, 200);
    assert.match(await uiResponse.text(), /Swagger UI/);
  });
});

test("unknown routes use the standard error envelope", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/not-a-route`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.equal(body.success, false);
  });
});
