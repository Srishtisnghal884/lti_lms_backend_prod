const fs = require('fs');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const ENV_FILE = '.env';
const LOGIN_URL = process.env.TG_API_URL+'profiles/login/';
const VERIFY_URL = process.env.TG_API_URL+'tests';

let isRefreshing = false;
let lastCheck = 0;
const CHECK_INTERVAL_MS = 60 * 1000;

// Auto-refresh only when needed (every minute max)
async function refreshTokenIfNeeded() {
  const now = Date.now();
  if (now - lastCheck < CHECK_INTERVAL_MS) return;
  lastCheck = now;
  const token = process.env.TESTGORILLA_TOKEN;
  //if (token && (await verifyToken(token))) return;
  if (token) return; // Skip verification for now to reduce API calls
  if (isRefreshing) return;
  isRefreshing = true;

  try {
    const newToken = await loginAndSaveToken();
    process.env.TESTGORILLA_TOKEN = newToken;
    console.log('Token refreshed successfully.');
  } catch (err) {
    console.error('Token refresh failed:', err.response?.data || err.message);
  } finally {
    isRefreshing = false;
  }
}

// Always refresh on 401
async function refreshToken() {
  const newToken = await loginAndSaveToken();
  process.env.TESTGORILLA_TOKEN = newToken;
  console.log('Token refreshed via interceptor.');
  return newToken;
}

// Verify token by calling a simple endpoint
async function verifyToken(token) {
  try {
    console.log('Verifying token...');
    const res = await axios.get(VERIFY_URL, {
      headers: { Authorization: `Token ${token}` },
    });
    return res.status === 200;
  } catch {
    console.log('Verifying token failed.');
    return false;
  }
}

// Log in and save token locally
async function loginAndSaveToken() {
  const { TG_USERNAME, TG_PASSWORD } = process.env;
  if (!TG_USERNAME || !TG_PASSWORD) {
    throw new Error('Missing TG_USERNAME or TG_PASSWORD in .env');
  }
  console.log(`Logging into TestGorilla as ${TG_USERNAME}`);

  const res = await axios.post(
    LOGIN_URL,
    {
      username: TG_USERNAME,
      password: TG_PASSWORD,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Origin: process.env.TG_ORIGIN,
      },
    }
  );

  if (!res.data?.token) {
    throw new Error(`No token in response: ${JSON.stringify(res.data)}`);
  }

  const token = res.data.token;
  saveTokenToEnv(token);
  return token;
}

// Save token to .env
function saveTokenToEnv(token) {
  let env = '';
  try {
    env = fs.readFileSync(ENV_FILE, 'utf8');
  } catch {
    env = '';
  }

  const updatedEnv = env.includes('TESTGORILLA_TOKEN=')
    ? env.replace(/TESTGORILLA_TOKEN=.*/g, `TESTGORILLA_TOKEN=${token}`)
    : env + `\nTESTGORILLA_TOKEN=${token}`;

  fs.writeFileSync(ENV_FILE, updatedEnv);
  process.env.TESTGORILLA_TOKEN = token;
}

module.exports = {
  refreshTokenIfNeeded,
  refreshToken,
};
