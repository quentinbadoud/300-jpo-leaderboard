import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    // La charge monte et descend progressivement :
    { duration: '10s', target: 5 },   // Pendant 10s, on augmente jusqu’à 5 utilisateurs virtuels (VU)
    { duration: '20s', target: 50 },   // Puis on passe à 50 VUs pendant 20s
    { duration: '10s', target: 0 },   // Enfin, on redescend à 0 VU (fin du test)
  ],
  thresholds: {
    // Les seuils (objectifs de performance) :
    http_req_failed: ['rate<0.01'],   // Moins de 1% de requêtes doivent échouer
    http_req_duration: ['p(95)<500'], // 95% des requêtes doivent durer moins de 500ms
  },
};


// Fonction principale exécutée par chaque VU
export default function () {
  // 1. Envoi d’une requête HTTP GET vers la page d’accueil
  const res = http.get('http://localhost:5500/');

  // 2. Vérification (check) du résultat
  check(res, {
    'status est 200': (r) => r.status === 200, // On s’attend à une réponse HTTP 200 (succès)
  });

  // 3. Pause d’une seconde pour simuler un utilisateur réel (think time)
  sleep(1);
}

// =============================
// Export d'un rapport HTML à la fin du test
// =============================
// Ajoute un rapport statique avec graphiques (aucun serveur nécessaire).
// Le fichier 'k6-summary.html' sera généré dans le dossier courant.
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

export function handleSummary(data) {
  return {
    'k6-summary.html': htmlReport(data), // rapport HTML complet
    'k6-summary.json': JSON.stringify(data, null, 2), // données brutes si tu veux réutiliser
  };
}
