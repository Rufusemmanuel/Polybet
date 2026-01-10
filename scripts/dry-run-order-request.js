/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/dry-run-order-request.js <payload.json> [headers.json]');
  process.exit(1);
}

const payloadPath = path.resolve(process.cwd(), filePath);
const rawPayload = fs.readFileSync(payloadPath, 'utf8');
const payload = JSON.parse(rawPayload);

const headerPath = process.argv[3];
const headerData = headerPath
  ? JSON.parse(fs.readFileSync(path.resolve(process.cwd(), headerPath), 'utf8'))
  : {};

const requiredHeaders = [
  'POLY_ADDRESS',
  'POLY_SIGNATURE',
  'POLY_TIMESTAMP',
  'POLY_API_KEY',
  'POLY_PASSPHRASE',
];

const bodyKeys = payload && typeof payload === 'object' ? Object.keys(payload) : [];
const orderKeys =
  payload && typeof payload.order === 'object' ? Object.keys(payload.order) : [];

const maskedHeaders = Object.fromEntries(
  requiredHeaders.map((key) => {
    const value = headerData[key];
    if (typeof value !== 'string' || value.length === 0) return [key, null];
    return [key, `${value.slice(0, 6)}...`];
  }),
);

console.log('Body keys:', bodyKeys);
console.log('Order keys:', orderKeys);
console.log(
  'Required headers present:',
  requiredHeaders.every((key) => typeof headerData[key] === 'string' && headerData[key]),
);
console.log('Masked headers:', maskedHeaders);
