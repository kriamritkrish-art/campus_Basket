import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('frontend_error_rate');
const pageDuration = new Trend('frontend_page_duration');

const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp-up to 50 users
    { duration: '1m',  target: 150 },  // 150 concurrent users
    { duration: '1m',  target: 300 },  // 300 concurrent users
    { duration: '1m',  target: 600 },  // 600 concurrent users
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1500'], // 95% of requests under 1.5s
    'frontend_error_rate': ['rate<0.02'], // Less than 2% errors
  },
};

export default function () {
  // Request frontend home / entry page
  const res = http.get(`${FRONTEND_URL}/`);
  pageDuration.add(res.timings.duration);

  const isOk = check(res, {
    'frontend status is 200': (r) => r.status === 200,
  });
  errorRate.add(!isOk);

  // Simulated think time (user reading content)
  sleep(Math.random() * 2 + 1);
}
