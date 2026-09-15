import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const healthLatency = new Trend('health_req_duration');
const productsLatency = new Trend('products_req_duration');

// Target URLs (can be overridden via CLI: -e BASE_URL=https://your-api.railway.app)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  stages: [
    { duration: '30s', target: 50 },    // Warm-up to 50 concurrent users
    { duration: '1m',  target: 100 },   // Normal traffic (100 users)
    { duration: '1m',  target: 250 },   // High traffic (250 users)
    { duration: '1m',  target: 500 },   // Peak stress traffic (500 users)
    { duration: '1m',  target: 1000 },  // Breaking point test (1,000 users)
    { duration: '30s', target: 0 },     // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95% of requests should be below 1s
    'error_rate': ['rate<0.05'],         // Error rate must remain under 5%
  },
};

export default function () {
  // 1. Health check endpoint (measures raw Express node process overhead)
  const healthRes = http.get(`${BASE_URL}/health`);
  healthLatency.add(healthRes.timings.duration);
  const healthOk = check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });
  errorRate.add(!healthOk);

  // 2. Database-backed endpoint (measures Prisma + DB connection pool limits)
  const productsRes = http.get(`${BASE_URL}/api/products`);
  productsLatency.add(productsRes.timings.duration);
  const productsOk = check(productsRes, {
    'products status is 200 or 429 (rate-limited)': (r) => r.status === 200 || r.status === 429,
  });
  errorRate.add(!productsOk);

  // Simulated user think time (1 to 2 seconds between clicks)
  sleep(Math.random() * 1 + 1);
}
