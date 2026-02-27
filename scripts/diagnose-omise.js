const dotenv = require('dotenv');
const omiseFactory = require('omise');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

function maskKey(value) {
  if (!value) return '(missing)';
  if (value.length <= 10) return `${value.slice(0, 3)}***`;
  return `${value.slice(0, 10)}...${value.slice(-4)}`;
}

function inspectKey(name, value, expectedPrefix) {
  const exists = typeof value === 'string' && value.length > 0;
  const trimmed = exists ? value.trim() : '';
  const hasEdgeWhitespace = exists && value !== trimmed;
  const prefixOk = exists && trimmed.startsWith(expectedPrefix);

  return {
    name,
    exists,
    prefixOk,
    hasEdgeWhitespace,
    length: exists ? value.length : 0,
    masked: maskKey(trimmed),
  };
}

function printInspection(result) {
  console.log(`\n[${result.name}]`);
  console.log(`- exists: ${result.exists}`);
  console.log(`- prefixOk: ${result.prefixOk}`);
  console.log(`- hasEdgeWhitespace: ${result.hasEdgeWhitespace}`);
  console.log(`- length: ${result.length}`);
  console.log(`- masked: ${result.masked}`);
}

async function main() {
  const secretKeyRaw = process.env.OMISE_SECRET_KEY;
  const publicKeyRaw = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY;
  const configMode = (process.env.OMISE_CONFIG_MODE || 'test').toLowerCase();

  const expectedSecretPrefix = configMode === 'live' ? 'skey_live_' : 'skey_test_';
  const expectedPublicPrefix = configMode === 'live' ? 'pkey_live_' : 'pkey_test_';

  console.log('=== Omise Diagnostic (Phase 1) ===');
  console.log(`- mode: ${configMode}`);

  const secretInspection = inspectKey('OMISE_SECRET_KEY', secretKeyRaw, expectedSecretPrefix);
  const publicInspection = inspectKey(
    'NEXT_PUBLIC_OMISE_PUBLIC_KEY',
    publicKeyRaw,
    expectedPublicPrefix
  );

  printInspection(secretInspection);
  printInspection(publicInspection);

  if (!secretInspection.exists || !publicInspection.exists) {
    console.error('\n[FAIL] Missing required Omise keys in environment');
    process.exit(1);
  }

  if (!secretInspection.prefixOk || !publicInspection.prefixOk) {
    console.error('\n[FAIL] Key prefix mismatch with OMISE_CONFIG_MODE');
    console.error(`- expected secret prefix: ${expectedSecretPrefix}`);
    console.error(`- expected public prefix: ${expectedPublicPrefix}`);
    process.exit(1);
  }

  const secretKey = secretKeyRaw.trim();
  const publicKey = publicKeyRaw.trim();

  const omise = omiseFactory({
    secretKey,
    publicKey,
    omiseVersion: '2019-05-29',
  });

  console.log('\n[Probe] Calling omise.account.retrieve() ...');

  try {
    const account = await omise.account.retrieve();

    console.log('\n[PASS] Omise authentication works');
    console.log(`- account id: ${account.id || '(unknown)'}`);
    console.log(`- account email: ${account.email || '(unknown)'}`);
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error && typeof error === 'object' && 'code' in error ? error.code : 'UNKNOWN';

    console.error('\n[FAIL] Omise authentication failed');
    console.error(`- code: ${code}`);
    console.error(`- message: ${message}`);
    console.error('- check: key validity in Omise Dashboard');
    console.error('- check: test/live key mode alignment');
    console.error('- check: hidden whitespace in environment variables');

    process.exit(1);
  }
}

main();
