const app = require('../app');
const { validateStartupConfig } = require('../config');
const prisma = require('../db/prisma');

const checks = [];

const addCheck = (name, run, options = {}) => {
  checks.push({ name, run, requiresDb: !!options.requiresDb });
};

const request = async (baseUrl, path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return {
    status: response.status,
    ok: response.ok,
    body,
  };
};

const assertStatus = (result, expectedStatus) => {
  if (result.status !== expectedStatus) {
    throw new Error(`Expected ${expectedStatus}, received ${result.status}`);
  }
};

const assertStatusIn = (result, expectedStatuses) => {
  if (!expectedStatuses.includes(result.status)) {
    throw new Error(`Expected one of ${expectedStatuses.join(', ')}, received ${result.status}`);
  }
};

const run = async () => {
  validateStartupConfig();

  let dbAvailable = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbAvailable = false;
    console.warn(`WARN database unavailable, skipping DB-backed smoke checks: ${error.message}`);
  }

  const server = app.listen(0);
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  addCheck('CORS health route responds', async () => {
    const result = await request(baseUrl, '/test-cors');
    assertStatus(result, 200);
    if (result.body?.message !== 'CORS is working!') {
      throw new Error('Unexpected CORS health response');
    }
  });

  addCheck('Products route responds', async () => {
    const result = await request(baseUrl, '/api/products');
    assertStatus(result, 200);
    if (!Array.isArray(result.body?.products)) {
      throw new Error('Products response missing products array');
    }
  }, { requiresDb: true });

  addCheck('Categories route responds', async () => {
    const result = await request(baseUrl, '/api/categories');
    assertStatus(result, 200);
    if (!Array.isArray(result.body)) {
      throw new Error('Categories response should be an array');
    }
  }, { requiresDb: true });

  addCheck('Protected cart rejects missing token', async () => {
    const result = await request(baseUrl, '/api/cart');
    assertStatus(result, 401);
  });

  addCheck('Admin products route rejects missing token before upload handling', async () => {
    const result = await request(baseUrl, '/api/products/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assertStatus(result, 401);
  });

  addCheck('Related products route handles unknown variant', async () => {
    const result = await request(baseUrl, '/api/products/related/999999999');
    assertStatus(result, 404);
  }, { requiresDb: true });

  let failed = false;

  try {
    for (const check of checks) {
      if (check.requiresDb && !dbAvailable) {
        console.warn(`SKIP ${check.name}`);
        continue;
      }

      try {
        await check.run();
        console.log(`PASS ${check.name}`);
      } catch (error) {
        failed = true;
        console.error(`FAIL ${check.name}: ${error.message}`);
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }

  if (failed) {
    process.exitCode = 1;
  }
};

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
