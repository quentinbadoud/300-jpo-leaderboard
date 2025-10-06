import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,               // utilisateurs virtuels simultanés
  duration: '20s',       // durée totale du test
};

export default function () {
  const res = http.get('http://localhost/');
  check(res, {
    'status est 200': (r) => r.status === 200,
    'réponse < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1); // pause entre les requêtes
}