import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomSeed, randomIntBetween } from 'k6';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL || 'http://localhost';
randomSeed(42); // runs reproductibles

// --- Options globales + scénarios -------------------------------------------
export const options = {
  // Seuils globaux + par scénario (filtrés avec {scenario:...})
  thresholds: {
    checks: ['rate>0.99'],                 // >99% des checks doivent passer
    http_req_failed: ['rate<0.01'],        // <1% d’échecs réseau
    'http_req_duration{scenario:ramp_up}': ['p(95)<600'],         // 95% < 600ms en montée
    'http_req_duration{scenario:constant_load}': ['p(95)<500'],   // 95% < 500ms en charge constante
    'http_req_duration{scenario:spike}': ['p(99)<1200'],          // 99% < 1200ms sous pic
  },

  // Trois scénarios complémentaires, exécutés en série via startTime
  scenarios: {
    // 1) Montée progressive sur 3 minutes
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '1m', target: 30 },
        { duration: '1m', target: 50 },
      ],
      gracefulRampDown: '30s',
      tags: { test_type: 'ramp_up' },
    },

    // 2) Charge constante (~RPS stable) pendant 4 minutes
    constant_load: {
      executor: 'constant-arrival-rate',
      rate: 40,            // ~40 itérations / seconde (ajuste selon ton SUT)
      timeUnit: '1s',
      duration: '4m',
      preAllocatedVUs: 60, // allocation initiale
      maxVUs: 120,         // plafond autorisé si besoin d’élasticité
      startTime: '3m10s',  // démarre après ramp_up
      tags: { test_type: 'constant' },
    },

    // 3) Pic brutal (spike) puis relâchement (1min40 total)
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 80,
      maxVUs: 200,
      stages: [
        { target: 200, duration: '20s' },  // montée éclair
        { target: 200, duration: '20s' },  // maintien du pic court
        { target:  10, duration: '1m'  },  // redescente douce (récupération)
      ],
      startTime: '7m20s', // démarre après constant_load
      tags: { test_type: 'spike' },
    },
  },
};

// --- Petit routeur de requêtes (garde simple) --------------------------------
function pickEndpoint() {
  // si tu as plusieurs routes, ajoute-les ici (répartit légèrement le cache)
  const choices = ['/', '/health', '/status'];
  return choices[randomIntBetween(0, choices.length - 1)];
}

export default function () {
  const path = pickEndpoint();
  const url = `${BASE_URL}${path}`;

  const res = http.get(url, {
    tags: { endpoint: path },
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });

  // Checks minimalistes mais utiles
  check(res, {
    'status est 200': (r) => r.status === 200,
    'réponse < 500ms': (r) => r.timings.duration < 500,
  });

  // micro-pause “humaine” (limite le martelage, utile en ramp_up)
  sleep(Math.random() * 0.3);
}