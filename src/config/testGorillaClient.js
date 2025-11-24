const axios = require('axios');
const dotenv = require('dotenv');
const { refreshTokenIfNeeded, refreshToken } = require('./testGorillaAuth');

dotenv.config();

const testGorillaClient = axios.create({
  baseURL: process.env.TG_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

testGorillaClient.interceptors.request.use(async (config) => {
  await refreshTokenIfNeeded();
  config.headers.Authorization = `Token ${process.env.TESTGORILLA_TOKEN}`;
  return config;
});

testGorillaClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Only handle 401 (unauthorized)
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true; // prevent infinite loop
      console.log('Token expired — refreshing...');
      try {
        const newToken = await refreshToken();
        process.env.TESTGORILLA_TOKEN = newToken;
        //Update default header for future requests
        testGorillaClient.defaults.headers.common['Authorization'] = `Token ${newToken}`;
        //Update header for the failed request and retry
        error.config.headers['Authorization'] = `Token ${newToken}`;
        console.log('Retrying failed request...');
        return testGorillaClient.request(error.config);
      } catch (err) {
        console.error('Token refresh failed:', err.message);
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

module.exports = testGorillaClient;
