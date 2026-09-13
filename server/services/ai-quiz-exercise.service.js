const http = require('http');
const { checkOllamaStatus } = require('./ollama.service');
const { 
  BLUEPRINTS_BY_SUBJECT, 
  detectEducationTier, 
  getBlueprintsForLevelAndSubject, 
  generateTopicTargets 
} = require('./ai-quiz-blueprints');

const OLLAMA_HOST = process.env.OLLAMA_HOST || '127.0.0.1';
const OLLAMA_PORT = parseInt(process.env.OLLAMA_PORT || '11434', 10);

/**
 * Calls Ollama API with format: "json" and a specified timeout (default 65s).
 */
async function queryOllamaJson(messages, timeoutMs = 65000, modelOptions = {}) {
  const status = await checkOllamaStatus();
  if (!status.available || !status.hasModels) {
    throw new Error('Ollama non disponible');
  }

  const model = status.model;

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      messages,
      format: 'json',
      stream: false,
      options: {
        temperature: modelOptions.temperature !== undefined ? modelOptions.temperature : 0.3,
        top_p: modelOptions.top_p !== undefined ? modelOptions.top_p : 0.85
      }
    });

    const req = http.request({
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: timeoutMs
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const content = parsed.message?.content || parsed.response;
          if (!content) {
            return reject(new Error('Réponse vide d\'Ollama'));
          }

          let cleanJson = content.trim();
          if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
          } else if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
          }

          const jsonResult = JSON.parse(cleanJson);
          resolve(jsonResult);
        } catch (e) {
          reject(new Error(`Parsing JSON échoué: ${e.message}`));
        }
      });
    });

    req.on('error', err => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Délai d\'attente dépassé pour Ollama'));
    });

    req.write(payload);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENSIVE MULTI-TIER QUESTION POOLS (Organized by Subject & Difficulty)
// ─────────────────────────────────────────────────────────────────────────────

const QUIZ_BANKS_BY_SUBJECT = {
  // ── GESTION / COMPTABILITÉ / ÉCONOMIE / MANAGEMENT / FINANCE ──
  'gestion': {
    'Débutant': [
      {
        topic: 'Notions fondamentales de l\'entreprise',
        question: 'Pour une entreprise, qu\'est-ce qu\'une dépense (ou charge) ?',
        options: [
          'De l\'argent qui sort pour payer un bien, un service ou un salaire',
          'De l\'argent qui rentre grâce aux ventes des clients',
          'Le capital initial apporté par les associés à la banque',
          'La liste des dettes que les clients ont envers l\'entreprise'
        ],
        correctIndex: 0,
        explanation: 'Une charge correspond à un flux financier sortant nécessaire au fonctionnement de l\'activité.'
      },
      {
        topic: 'Calcul élémentaire du résultat',
        question: 'Si un commerçant achète un article 60 € et le revend 100 €, quel résultat obtient-il ?',
        options: [
          'Un bénéfice de 40 €',
          'Une perte de 40 €',
          'Un chiffre d\'affaires de 40 €',
          'Un déficit de 160 €'
        ],
        correctIndex: 0,
        explanation: 'Gain élémentaire = Prix de vente - Coût d\'achat : 100 € - 60 € = 40 € de bénéfice.'
      },
      {
        topic: 'La Facturation',
        question: 'Quel est le rôle essentiel d\'une facture lors d\'une vente commerciale ?',
        options: [
          'Servir de preuve juridique et comptable de la transaction et du prix convenu',
          'Permettre uniquement de faire de la publicité pour l\'entreprise',
          'Remplacer le contrat de travail des salariés',
          'Obliger l\'acheteur à payer le double de la somme convenue'
        ],
        correctIndex: 0,
        explanation: 'La facture atteste la vente d\'un produit ou service et détaille les montants dus.'
      },
      {
        topic: 'Le Bilan simplifié',
        question: 'Dans un bilan d\'entreprise simplifié, que représente globalement l\'Actif ?',
        options: [
          'Tout ce que possède l\'entreprise (argent en banque, matériel, stocks)',
          'Toutes les dettes que l\'entreprise doit rembourser aux banques',
          'La somme totale des impôts payés l\'année précédente',
          'Le nombre total d\'employés inscrits dans l\'entreprise'
        ],
        correctIndex: 0,
        explanation: 'L\'Actif recense le patrimoine et les ressources possédées par l\'entreprise.'
      },
      {
        topic: 'Chiffre d\'affaires vs Résultat',
        question: 'Que mesure précisément le « Chiffre d\'affaires » (CA) d\'une boutique ?',
        options: [
          'Le montant total des ventes réalisées sur une période',
          'Le bénéfice net qui reste après avoir payé toutes les factures',
          'Le montant total de l\'argent emprunté à la banque',
          'La valeur totale du magasin et de ses meubles'
        ],
        correctIndex: 0,
        explanation: 'Le CA est le total des ventes facturées, avant déduction des charges.'
      },
      {
        topic: 'Relations commerciales',
        question: 'Quelle est la différence fondamentale entre un client et un fournisseur ?',
        options: [
          'Le client achète les produits de l\'entreprise, tandis que le fournisseur lui vend des fournitures ou matières',
          'Le fournisseur achète les produits de l\'entreprise et le client lui prête de l\'argent',
          'Le client et le fournisseur sont toujours deux salariés de la même entreprise',
          'Il n\'y a aucune différence, ce sont deux termes parfaitement synonymes'
        ],
        correctIndex: 0,
        explanation: 'Le client achète ce que produit l\'entreprise ; le fournisseur approvisionne l\'entreprise.'
      },
      {
        topic: 'Recettes et Produits',
        question: 'Dans une entreprise, qu\'appelle-t-on une « recette » (ou produit) ?',
        options: [
          'Une somme d\'argent perçue ou due suite à la vente d\'un bien ou d\'une prestation',
          'Une facture impayée envoyée par un fournisseur',
          'Le remboursement obligatoire d\'un emprunt à la banque',
          'L\'achat de fournitures de bureau en début de mois'
        ],
        correctIndex: 0,
        explanation: 'Les recettes (produits) représentent les flux financiers entrants générés par l\'activité.'
      },
      {
        topic: 'Situation de perte',
        question: 'Si les dépenses totales d\'une entreprise sont supérieures à ses recettes, l\'entreprise réalise :',
        options: [
          'Une perte (ou déficit)',
          'Un bénéfice net record',
          'Un doublement de son capital social',
          'Une exonération fiscale immédiate'
        ],
        correctIndex: 0,
        explanation: 'Quand Charges > Produits, le résultat est négatif : c\'est une perte comptable.'
      },
      {
        topic: 'La Trésorerie',
        question: 'Qu\'appelle-t-on la « trésorerie » disponible d\'une société ?',
        options: [
          'L\'argent liquide immédiatement utilisable sur le compte bancaire et dans la caisse',
          'La valeur estimée des bâtiments de l\'entreprise dans dix ans',
          'Le nombre de clients abonnés aux lettres d\'information',
          'La liste des anciens employés retraités'
        ],
        correctIndex: 0,
        explanation: 'La trésorerie correspond aux liquidités immédiates pour payer les dépenses sans attendre.'
      },
      {
        topic: 'Gestion des stocks',
        question: 'À quoi sert l\'inventaire physique réalisé en fin d\'exercice ?',
        options: [
          'À compter et valoriser exactement les marchandises et matières encore présentes en stock',
          'À jeter tous les ordinateurs de l\'entreprise pour en acheter de nouveaux',
          'À modifier les prix des factures passées',
          'À fermer définitivement le commerce'
        ],
        correctIndex: 0,
        explanation: 'L\'inventaire contrôle la réalité des stocks physiques pour ajuster les comptes de l\'exercice.'
      },
      {
        topic: 'Documents commerciaux',
        question: 'Qu\'est-ce qu\'un « devis » commercial ?',
        options: [
          'Une proposition de prix et de prestation soumise au client avant tout achat',
          'Une amende administrative infligée par l\'État',
          'Un ticket de caisse délivré après le départ du client',
          'Le bilan annuel déposé au tribunal de commerce'
        ],
        correctIndex: 0,
        explanation: 'Le devis détaille le tarif proposé et n\'engage définitivement les parties qu\'après acceptation signée.'
      },
      {
        topic: 'Modalités de paiement',
        question: 'Que signifie l\'expression « payer au comptant » ?',
        options: [
          'Régler immédiatement l\'intégralité de la somme due lors de l\'achat',
          'Reporter le paiement à l\'année suivante sans intérêt',
          'Payer uniquement avec des lingots d\'or',
          'Échanger un produit contre un autre sans argent'
        ],
        correctIndex: 0,
        explanation: 'Le paiement au comptant s\'effectue sans délai, au moment précis de la livraison ou commande.'
      },
      {
        topic: 'Délai de paiement',
        question: 'Pourquoi une entreprise accorde-t-elle parfois un délai de paiement (ex: 30 jours) à un client ?',
        options: [
          'Pour faciliter la relation commerciale et lui laisser le temps de vendre les produits reçus',
          'Pour doubler automatiquement le prix initial de la marchandise',
          'Parce qu\'il est illégal de payer le jour même',
          'Pour annuler la facture en cours de route'
        ],
        correctIndex: 0,
        explanation: 'Le crédit interentreprises est une pratique usuelle pour fidéliser et fluidifier les échanges.'
      },
      {
        topic: 'Compte bancaire',
        question: 'Que signifie un solde bancaire « débiteur » (ou être à découvert) ?',
        options: [
          'Le compte est dans le rouge : l\'entreprise a dépensé plus d\'argent qu\'elle n\'en avait',
          'L\'entreprise possède une réserve d\'argent positive très importante',
          'La banque a fait un don d\'argent définitif à l\'entreprise',
          'Le compte bancaire a été supprimé'
        ],
        correctIndex: 0,
        explanation: 'Un découvert bancaire signifie que la banque prête provisoirement des fonds à l\'entreprise.'
      },
      {
        topic: 'Objectif de l\'entreprise',
        question: 'Quel est le but premier d\'une entreprise commerciale privée ?',
        options: [
          'Produire de la valeur, satisfaire ses clients et dégager un bénéfice pérenne',
          'Dépenser tout son capital sans jamais rien vendre',
          'Faire faillite le plus rapidement possible',
          'Refuser systématiquement les paiements par carte'
        ],
        correctIndex: 0,
        explanation: 'L\'entreprise vise la rentabilité économique tout en répondant aux besoins de ses clients.'
      }
    ],
    'Intermédiaire': [
      {
        topic: 'Amortissement comptable',
        question: 'Qu\'est-ce que l\'amortissement comptable d\'une machine de production ?',
        options: [
          'La constatation de la perte de valeur du bien liée au temps et à l\'usure',
          'La réparation immédiate de la machine en cas de panne mécanique',
          'Le paiement en espèces du prix d\'achat de la machine',
          'La revente de la machine à un concurrent'
        ],
        correctIndex: 0,
        explanation: 'L\'amortissement étale le coût d\'acquisition d\'un bien sur sa durée d\'utilisation.'
      },
      {
        topic: 'Compte de résultat',
        question: 'Comment se calcule le Résultat d\'Exploitation d\'une entreprise ?',
        options: [
          'Produits d\'exploitation - Charges d\'exploitation',
          'Chiffre d\'affaires + Total des dettes bancaires',
          'Total Actif - Total Passif',
          'Trésorerie bancaire × Taux d\'imposition'
        ],
        correctIndex: 0,
        explanation: 'Le résultat d\'exploitation mesure la performance opérationnelle brute.'
      },
      {
        topic: 'Taxe sur la Valeur Ajoutée (TVA)',
        question: 'Qu\'est-ce que la « TVA déductible » pour une société assujettie ?',
        options: [
          'La taxe payée sur les achats que l\'entreprise peut déduire de la TVA collectée à reverser',
          'Un impôt exceptionnel payé sur les bénéfices annuels',
          'Une réduction accordée aux clients qui payent comptant',
          'La taxe imposée sur les salaires des employés'
        ],
        correctIndex: 0,
        explanation: 'L\'entreprise récupère la TVA supportée sur ses achats professionnels.'
      },
      {
        topic: 'Structure financière',
        question: 'Dans le passif du bilan comptable, que trouve-t-on principalement ?',
        options: [
          'Les capitaux propres (capital social, réserves) et les dettes de l\'entreprise',
          'Les véhicules de société et les ordinateurs de bureau',
          'L\'argent liquide disponible dans le coffre-fort',
          'Les factures impayées par les clients'
        ],
        correctIndex: 0,
        explanation: 'Le passif regroupe l\'origine des ressources financières ayant permis de financer l\'actif.'
      },
      {
        topic: 'Marge commerciale',
        question: 'Comment se calcule la « marge brute » d\'un distributeur ?',
        options: [
          'Ventes de marchandises (HT) - Coût d\'achat des marchandises vendues (HT)',
          'Total des salaires + Bénéfice net',
          'Prix de vente TTC + TVA collectée',
          'Chiffre d\'affaires total ÷ Nombre de salariés'
        ],
        correctIndex: 0,
        explanation: 'La marge commerciale est la ressource dégagée par l\'activité pure de négoce.'
      },
      {
        topic: 'Créances clients',
        question: 'Dans quel compartiment du bilan comptable classe-t-on les créances sur les clients ?',
        options: [
          'Dans l\'actif circulant',
          'Dans l\'actif immobilisé durable',
          'Dans les capitaux propres au passif',
          'Dans les charges exceptionnelles'
        ],
        correctIndex: 0,
        explanation: 'Les créances clients font partie de l\'actif circulant car elles ont vocation à être réglées à court terme.'
      },
      {
        topic: 'Seuil de rentabilité',
        question: 'Une entreprise a 20 000 € de charges fixes et un taux de marge sur coût variable de 40%. Quel est son seuil de rentabilité en chiffre d\'affaires ?',
        options: [
          '50 000 €',
          '80 000 €',
          '28 000 €',
          '12 000 €'
        ],
        correctIndex: 0,
        explanation: 'Seuil de rentabilité = Charges fixes / Taux MSCV = 20 000 / 0,40 = 50 000 €.'
      },
      {
        topic: 'Besoin en Fonds de Roulement (BFR)',
        question: 'Comment se calcule le Besoin en Fonds de Roulement (BFR) d\'exploitation ?',
        options: [
          'Actif circulant d\'exploitation (stocks + créances) - Dettes d\'exploitation (fournisseurs + fiscales)',
          'Total de l\'actif immobilisé - Capitaux propres',
          'Trésorerie active + Dettes à long terme',
          'Chiffre d\'affaires annuel × 12 mois'
        ],
        correctIndex: 0,
        explanation: 'Le BFR mesure le décalage de trésorerie entre décaissements des achats et encaissements des ventes.'
      },
      {
        topic: 'Trésorerie nette',
        question: 'Quelle relation fondamentale relie le Fonds de Roulement Net Global (FRNG), le BFR et la Trésorerie Nette (TN) ?',
        options: [
          'Trésorerie Nette = FRNG - BFR',
          'Trésorerie Nette = FRNG + BFR',
          'Trésorerie Nette = BFR - FRNG',
          'Trésorerie Nette = FRNG × BFR'
        ],
        correctIndex: 0,
        explanation: 'L\'équation financière centrale de l\'équilibre bilanciel est : TN = FRNG - BFR.'
      },
      {
        topic: 'Réductions financières',
        question: 'Qu\'est-ce qu\'un « escompte de règlement » accordé à un client sur une facture ?',
        options: [
          'Une réduction financière accordée pour paiement comptant ou anticipé',
          'Une réduction accordée pour défaut de qualité de la marchandise',
          'Une remise accordée en fonction d\'un volume d\'achat important',
          'Une ristourne de fidélité accordée en fin d\'année civile'
        ],
        correctIndex: 0,
        explanation: 'L\'escompte est une réduction financière incitant le client à régler immédiatement.'
      },
      {
        topic: 'Amortissement linéaire',
        question: 'Un équipement professionnel est acquis pour 1 200 € HT et amorti sur 3 ans en mode linéaire. Quelle est l\'annuité d\'amortissement ?',
        options: [
          '400 € par an',
          '300 € par an',
          '600 € par an',
          '1 200 € par an'
        ],
        correctIndex: 0,
        explanation: 'Annuité d\'amortissement linéaire = Valeur d\'origine / Durée = 1 200 € / 3 = 400 €/an.'
      },
      {
        topic: 'Calcul de TVA à décaisser',
        question: 'Si la TVA collectée sur les ventes est de 8 000 € et la TVA déductible sur les achats est de 5 500 €, quel montant l\'entreprise doit-elle reverser à l\'État ?',
        options: [
          '2 500 €',
          '13 500 €',
          '5 500 €',
          '8 000 €'
        ],
        correctIndex: 0,
        explanation: 'TVA à décaisser = TVA collectée - TVA déductible = 8 000 € - 5 500 € = 2 500 €.'
      },
      {
        topic: 'Soldes Intermédiaires de Gestion',
        question: 'Comment se calcule la « Valeur Ajoutée » (VA) produite par l\'entreprise ?',
        options: [
          'Marge commerciale + Production de l\'exercice - Consommations intermédiaires en provenance des tiers',
          'Chiffre d\'affaires total + Emprunts bancaires',
          'Total des salaires versés - Impôt sur les sociétés',
          'Excédent brut d\'exploitation + Amortissements'
        ],
        correctIndex: 0,
        explanation: 'La Valeur Ajoutée mesure la richesse brute créée par l\'entreprise grâce à ses facteurs de production.'
      },
      {
        topic: 'Excédent Brut d\'Exploitation (EBE)',
        question: 'Pourquoi l\'EBE est-il considéré comme le meilleur indicateur de la rentabilité opérationnelle ?',
        options: [
          'Il mesure la ressource d\'exploitation pure, indépendamment de la politique d\'amortissement et du mode de financement',
          'Il intègre directement les dividendes versés aux actionnaires',
          'Il prend en compte uniquement les gains exceptionnels de l\'année',
          'Il est toujours égal au solde du compte bancaire en fin d\'année'
        ],
        correctIndex: 0,
        explanation: 'L\'EBE est calculé avant amortissements et charges financières : c\'est le cash-flow opérationnel brut.'
      },
      {
        topic: 'Effet de levier financier',
        question: 'Dans quelle situation l\'endettement bancaire produit-il un « effet de levier financier » positif ?',
        options: [
          'Lorsque la rentabilité économique des investissements est supérieure au taux d\'intérêt de l\'emprunt',
          'Lorsque le taux d\'intérêt de la banque est supérieur à la rentabilité économique',
          'Lorsque l\'entreprise refuse tout recours aux capitaux propres',
          'Lorsque le résultat net de l\'exercice est strictement nul'
        ],
        correctIndex: 0,
        explanation: 'Si la rentabilité économique dépasse le coût de la dette, l\'endettement accroît la rentabilité des capitaux propres.'
      },
      {
        topic: 'Budget de trésorerie',
        question: 'Quelle est la fonction principale d\'un plan de trésorerie prévisionnel mensuel ?',
        options: [
          'Anticiper les encaissements et décaissements futurs pour éviter tout risque de cessation de paiement',
          'Calculer l\'impôt sur le revenu des dirigeants',
          'Remplacer les déclarations de TVA obligatoires',
          'Déterminer le prix de vente unitaire des concurrents'
        ],
        correctIndex: 0,
        explanation: 'Le plan de trésorerie permet d\'anticiper les impasses de trésorerie et d\'adapter les besoins de financement.'
      },
      {
        topic: 'Plan Comptable Général (PCG)',
        question: 'Dans le Plan Comptable Général, quelle classe regroupe l\'ensemble des comptes de charges ?',
        options: [
          'La Classe 6 (Comptes de charges)',
          'La Classe 7 (Comptes de produits)',
          'La Classe 1 (Comptes de capitaux)',
          'La Classe 5 (Comptes financiers)'
        ],
        correctIndex: 0,
        explanation: 'En comptabilité générale française, la classe 6 regroupe les charges d\'exploitation, financières et exceptionnelles.'
      },
      {
        topic: 'Plan Comptable Général (PCG)',
        question: 'À quelle classe du Plan Comptable Général appartiennent les comptes de produits et ventes ?',
        options: [
          'La Classe 7 (Comptes de produits)',
          'La Classe 2 (Comptes d\'immobilisations)',
          'La Classe 4 (Comptes de tiers)',
          'La Classe 3 (Comptes de stocks)'
        ],
        correctIndex: 0,
        explanation: 'La classe 7 enregistre l\'ensemble des produits (ventes, prestations, produits financiers).'
      },
      {
        topic: 'Principes comptables',
        question: 'Pourquoi constitue-t-on une provision pour dépréciation d\'une créance client ?',
        options: [
          'Pour respecter le principe de prudence en constatant le risque probable de non-recouvrement',
          'Pour doubler automatiquement le montant de la créance due',
          'Pour faire un cadeau financier au client en retard',
          'Pour effacer définitivement le client de la comptabilité sans justification'
        ],
        correctIndex: 0,
        explanation: 'Le principe de prudence impose de comptabiliser toute perte probable dès qu\'elle est connue.'
      },
      {
        topic: 'Rapprochement bancaire',
        question: 'À quoi sert l\'état de rapprochement bancaire établi chaque fin de mois ?',
        options: [
          'À concilier et expliquer les écarts entre le compte banque tenu par l\'entreprise et le relevé de la banque',
          'À demander un crédit immobilier au directeur de la banque',
          'À fixer les commissions de la carte bancaire',
          'À supprimer les frais de tenue de compte'
        ],
        correctIndex: 0,
        explanation: 'Le rapprochement bancaire vérifie la réciprocité des écritures comptables entre l\'entreprise et son banquier.'
      }
    ],
    'Avancé': [
      {
        topic: 'Analyse financière du bilan',
        question: 'Que signifie un Fonds de Roulement Net Global (FRNG) strictement positif ?',
        options: [
          'Les ressources stables (long terme) financent intégralement les emplois durables et dégagent un excédent pour l\'exploitation',
          'L\'entreprise est en situation de faillite imminente',
          'Les dettes à court terme sont supérieures aux actifs immobilisés',
          'La trésorerie nette est nécessairement négative'
        ],
        correctIndex: 0,
        explanation: 'Un FRNG positif garantit que les immobilisations sont couvertes par des capitaux stables.'
      },
      {
        topic: 'Seuil de rentabilité',
        question: 'Quelle est la formule correcte du Seuil de Rentabilité (Point Mort) en valeur ?',
        options: [
          'Charges fixes / Taux de marge sur coût variable',
          'Chiffre d\'affaires × Charges variables totales',
          'Résultat net / Total des capitaux propres',
          'Charges variables / Charges fixes'
        ],
        correctIndex: 0,
        explanation: 'Le seuil de rentabilité correspond au CA minimum où le résultat est nul : CF / Taux MSCV.'
      },
      {
        topic: 'Ratio de solvabilité',
        question: 'Que mesure précisément le ratio d\'autonomie financière (Capitaux propres / Total Dettes) ?',
        options: [
          'La capacité de l\'entreprise à s\'endetter sans dépendre excessivement des créanciers bancaires',
          'Le pourcentage de produits vendus à l\'étranger',
          'Le délai moyen de règlement accordé aux clients',
          'La rentabilité nette des investissements en Bourse'
        ],
        correctIndex: 0,
        explanation: 'Ce ratio évalue l\'indépendance financière vis-à-vis des banques et créanciers.'
      },
      {
        topic: 'Rentabilité financière (ROE)',
        question: 'Quelle formule définit le ratio de Rentabilité Financière (Return On Equity - ROE) ?',
        options: [
          'Résultat Net / Capitaux Propres',
          'Résultat d\'Exploitation / Total Actif',
          'Chiffre d\'affaires / Dettes financières',
          'Excédent Brut d\'Exploitation / Chiffre d\'affaires'
        ],
        correctIndex: 0,
        explanation: 'Le ROE (Return On Equity) mesure la rentabilité des fonds investis par les actionnaires : Résultat net / Capitaux propres.'
      },
      {
        topic: 'Coût Moyen Pondéré du Capital (WACC / CMPC)',
        question: 'Que représente le CMPC (Coût Moyen Pondéré du Capital) dans l\'évaluation financière des investissements ?',
        options: [
          'Le taux de rentabilité minimum exigé par l\'ensemble des bailleurs de fonds (actionnaires et banques)',
          'Le taux d\'inflation annuel officiel publié par l\'INSEE',
          'Le montant total des frais bancaires prélevés sur l\'année',
          'La marge commerciale brute moyenne du secteur industriel'
        ],
        correctIndex: 0,
        explanation: 'Le CMPC est la moyenne pondérée du coût des capitaux propres et du coût net de la dette après impôt.'
      },
      {
        topic: 'Capacité d\'Autofinancement (CAF)',
        question: 'Selon la méthode soustractive recommandée par l\'Ordre des Experts-Comptables, comment calcule-t-on la CAF à partir de l\'EBE ?',
        options: [
          'EBE + Autres produits encaissables - Autres charges décaissables',
          'EBE + Dotations aux amortissements - Reprises sur provisions',
          'EBE × Taux d\'impôt sur les sociétés',
          'EBE - Total des immobilisations corporelles'
        ],
        correctIndex: 0,
        explanation: 'Méthode soustractive : CAF = EBE + Produits d\'exploitation encaissables - Charges décaissables ± Produits/charges financières et exceptionnelles décaissables/encaissables.'
      },
      {
        topic: 'Valeur Actuelle Nette (VAN)',
        question: 'Dans le choix d\'un projet d\'investissement, quelle règle de décision financière applique-t-on à la VAN ?',
        options: [
          'Le projet est rentable et acceptable uniquement si sa VAN est strictement supérieure à 0',
          'Le projet est acceptable dès que sa VAN est inférieure à -10 000 €',
          'La VAN doit être strictement égale à zéro pour garantir un profit illimité',
          'La VAN ne s\'applique qu\'aux entreprises du secteur public'
        ],
        correctIndex: 0,
        explanation: 'Une VAN positive signifie que les flux de trésorerie actualisés sont supérieurs au coût initial de l\'investissement.'
      },
      {
        topic: 'Taux de Rentabilité Interne (TRI)',
        question: 'Quelle est la définition mathématique et financière exacte du Taux de Rentabilité Interne (TRI) ?',
        options: [
          'Le taux d\'actualisation qui annule exactement la Valeur Actuelle Nette (VAN = 0)',
          'Le taux d\'emprunt maximum autorisé par la Banque Centrale',
          'Le pourcentage de dividende distribué aux salariés',
          'Le taux de marge nette sur les ventes à l\'export'
        ],
        correctIndex: 0,
        explanation: 'Le TRI est le taux qui égalise la valeur actuelle des flux futurs de trésorerie au capital initialement investi.'
      },
      {
        topic: 'Consolidation financière (Goodwill)',
        question: 'Lors d\'une acquisition d\'entreprise, comment définit-on le « Goodwill » (ou écart d\'acquisition) ?',
        options: [
          'La différence positive entre le prix d\'acquisition et la quote-part des capitaux propres réévalués de la filiale',
          'La somme totale des créances douteuses inscrites au bilan',
          'L\'indemnité légale de licenciement versée aux salariés',
          'La commission versée à l\'agence immobilière'
        ],
        correctIndex: 0,
        explanation: 'Le Goodwill représente les actifs immatériels non comptabilisés (réputation, brevets, synergies) valorisés lors du rachat.'
      },
      {
        topic: 'Ratios de liquidité',
        question: 'Comment se calcule le ratio de liquidité générale d\'une entreprise ?',
        options: [
          'Actif circulant / Dettes à court terme',
          'Capitaux propres / Actif immobilisé',
          'Trésorerie nette / Chiffre d\'affaires',
          'Dettes financières / Excédent brut d\'exploitation'
        ],
        correctIndex: 0,
        explanation: 'Le ratio de liquidité générale vérifie si les actifs à court terme suffisent à rembourser les dettes arrivant à échéance.'
      },
      {
        topic: 'Délai moyen de paiement clients (DSO)',
        question: 'Quelle formule standard permet de calculer le délai moyen de crédit accordé aux clients (DSO en jours) ?',
        options: [
          '(Créances clients TTC / Chiffre d\'affaires TTC) × 360 jours',
          '(Chiffre d\'affaires HT / Achats consommés) × 12 mois',
          '(Dettes fournisseurs TTC / Achats TTC) × 360 jours',
          '(Stocks moyens / Ventes HT) × 30 jours'
        ],
        correctIndex: 0,
        explanation: 'Le DSO (Days Sales Outstanding) mesure le temps moyen nécessaire pour recouvrer les factures clients en jours de ventes.'
      },
      {
        topic: 'Point mort temporel',
        question: 'Si le CA annuel régulier est de 1 200 000 € et le seuil de rentabilité est de 600 000 €, quel est le point mort en jours (année de 360 jours) ?',
        options: [
          '180 jours',
          '90 jours',
          '240 jours',
          '360 jours'
        ],
        correctIndex: 0,
        explanation: 'Point mort temporel = (Seuil de Rentabilité / Chiffre d\'affaires) × 360 = (600 000 / 1 200 000) × 360 = 180 jours.'
      },
      {
        topic: 'Actif immobilisé',
        question: 'Parmi les éléments suivants, lequel fait partie des immobilisations financières au bilan ?',
        options: [
          'Les titres de participation détenus durablement dans une filiale',
          'Les stocks de marchandises en entrepôt',
          'Les factures à émettre sur les clients réguliers',
          'Les logiciels informatiques acquis pour les bureaux'
        ],
        correctIndex: 0,
        explanation: 'Les titres de participation et dépôts/cautionnements constituent des immobilisations financières durables.'
      },
      {
        topic: 'Augmentation de capital',
        question: 'À quoi sert le Droit Préférentiel de Souscription (DPS) attribué aux anciens actionnaires lors d\'une émission d\'actions nouvelles ?',
        options: [
          'À compenser la dilution de la valeur de l\'action et leur permettre de conserver leur pourcentage de détention',
          'À leur verser un dividende exceptionnel en lingots d\'or',
          'À interdire toute entrée de nouveaux actionnaires dans le capital',
          'À annuler les dettes bancaires existantes de l\'entreprise'
        ],
        correctIndex: 0,
        explanation: 'Le DPS protège les actionnaires historiques contre la baisse de valeur des actions et la perte de pouvoir politique.'
      },
      {
        topic: 'Consolidation comptable',
        question: 'Quelle méthode de consolidation doit être impérativement appliquée pour une filiale placée sous le contrôle exclusif de la société mère ?',
        options: [
          'L\'intégration globale',
          'L\'intégration proportionnelle',
          'La mise en équivalence',
          'La méthode de simple enregistrement au coût historique'
        ],
        correctIndex: 0,
        explanation: 'Le contrôle exclusif (plus de 50% des droits de vote) requiert l\'intégration globale de 100% des actifs, passifs et comptes de résultat.'
      }
    ]
  },

  // ── MATHÉMATIQUES & STATISTIQUES ──
  'math': {
    'Débutant': [
      {
        topic: 'Priorités opératoires',
        question: 'Quel est le résultat du calcul : 5 + 3 × 4 ?',
        options: ['17', '32', '23', '20'],
        correctIndex: 0,
        explanation: 'La multiplication est prioritaire : 3 × 4 = 12, puis 5 + 12 = 17.'
      },
      {
        topic: 'Pourcentages élémentaires',
        question: 'Combien vaut 25% de 200 € ?',
        options: ['50 €', '25 €', '75 €', '100 €'],
        correctIndex: 0,
        explanation: '25% correspond au quart : 200 ÷ 4 = 50 €.'
      },
      {
        topic: 'Fractions simples',
        question: 'Quelle est la fraction irréductible égale à 6/8 ?',
        options: ['3/4', '2/3', '1/2', '4/5'],
        correctIndex: 0,
        explanation: 'En divisant numérateur et dénominateur par 2 : 6÷2 = 3 et 8÷2 = 4, soit 3/4.'
      },
      {
        topic: 'Géométrie de base',
        question: 'Combien vaut la somme des angles d\'un triangle quelconque ?',
        options: ['180°', '360°', '90°', '270°'],
        correctIndex: 0,
        explanation: 'Dans tout triangle, la somme des trois angles intérieurs est égale à 180°.'
      },
      {
        topic: 'Calculs de périmètre',
        question: 'Quel est le périmètre d\'un rectangle de longueur 8 cm et de largeur 3 cm ?',
        options: ['22 cm', '24 cm', '11 cm', '16 cm'],
        correctIndex: 0,
        explanation: 'Périmètre = 2 × (Longueur + Largeur) = 2 × (8 + 3) = 22 cm.'
      },
      {
        topic: 'Calcul d\'aire',
        question: 'Quelle est l\'aire d\'un carré de côté 6 cm ?',
        options: ['36 cm²', '24 cm²', '12 cm²', '18 cm²'],
        correctIndex: 0,
        explanation: 'Aire d\'un carré = côté × côté = 6 × 6 = 36 cm².'
      },
      {
        topic: 'Puissances simples',
        question: 'Que vaut 10 au carré (10²) ?',
        options: ['100', '20', '1 000', '10'],
        correctIndex: 0,
        explanation: '10² = 10 × 10 = 100.'
      },
      {
        topic: 'Racines carrées évidentes',
        question: 'Quelle est la racine carrée de 49 (√49) ?',
        options: ['7', '9', '14', '6'],
        correctIndex: 0,
        explanation: 'Car 7 × 7 = 49.'
      },
      {
        topic: 'Réductions commerciales',
        question: 'Un article coûtant 80 € bénéficie d\'une réduction de 50%. Quel est son prix final ?',
        options: ['40 €', '30 €', '50 €', '60 €'],
        correctIndex: 0,
        explanation: '50% équivaut à la moitié : 80 ÷ 2 = 40 €.'
      },
      {
        topic: 'Nombres relatifs',
        question: 'Quel est le résultat de la multiplication : 4 × (-5) ?',
        options: ['-20', '20', '-1', '9'],
        correctIndex: 0,
        explanation: 'Le produit d\'un nombre positif par un nombre négatif est négatif : 4 × (-5) = -20.'
      },
      {
        topic: 'Repère du plan',
        question: 'Dans un repère cartésien standard, quelles sont les coordonnées de l\'origine O ?',
        options: ['(0, 0)', '(1, 1)', '(0, 1)', '(1, 0)'],
        correctIndex: 0,
        explanation: 'L\'origine se situe au croisement des axes à x = 0 et y = 0.'
      },
      {
        topic: 'Multiples et diviseurs',
        question: 'Parmi ces nombres, lequel est un multiple de 7 ?',
        options: ['35', '32', '40', '50'],
        correctIndex: 0,
        explanation: '35 = 7 × 5, c\'est donc un multiple exact de 7.'
      },
      {
        topic: 'Géométrie dans l\'espace',
        question: 'Combien d\'arêtes possède un cube classique ?',
        options: ['12', '6', '8', '10'],
        correctIndex: 0,
        explanation: 'Un cube possède 6 faces, 8 sommets et 12 arêtes.'
      },
      {
        topic: 'Partage équitable',
        question: 'Quel est le tiers du nombre 90 ?',
        options: ['30', '45', '20', '60'],
        correctIndex: 0,
        explanation: 'Prendre le tiers revient à diviser par 3 : 90 ÷ 3 = 30.'
      },
      {
        topic: 'Angle droit',
        question: 'Quelle est la mesure précise d\'un angle droit ?',
        options: ['90°', '180°', '45°', '60°'],
        correctIndex: 0,
        explanation: 'Un angle droit mesure exactement 90 degrés.'
      }
    ],
    'Intermédiaire': [
      {
        topic: 'Équations du premier degré',
        question: 'Quelle est la solution de l\'équation 3x - 7 = 14 ?',
        options: ['x = 7', 'x = 21', 'x = 3', 'x = 5'],
        correctIndex: 0,
        explanation: '3x = 14 + 7 = 21, donc x = 21 / 3 = 7.'
      },
      {
        topic: 'Théorème de Pythagore',
        question: 'Dans un triangle rectangle dont les côtés de l\'angle droit mesurent 6 cm et 8 cm, quelle est l\'hypoténuse ?',
        options: ['10 cm', '14 cm', '12 cm', '48 cm'],
        correctIndex: 0,
        explanation: 'Hypoténuse² = 6² + 8² = 36 + 64 = 100. √100 = 10 cm.'
      },
      {
        topic: 'Fonctions affines',
        question: 'Quelle est la pente (coefficient directeur) de la droite d\'équation y = -3x + 5 ?',
        options: ['-3', '5', '3', '-5/3'],
        correctIndex: 0,
        explanation: 'Dans l\'équation y = ax + b, le coefficient directeur est a = -3.'
      },
      {
        topic: 'Statistiques - Médiane',
        question: 'Quelle est la médiane de la série statistique ordonnée : 4, 7, 9, 12, 18 ?',
        options: ['9', '10', '7', '12'],
        correctIndex: 0,
        explanation: 'La série compte 5 valeurs. La médiane est la valeur centrale : 9.'
      },
      {
        topic: 'Probabilités simples',
        question: 'Dans un jeu classique de 32 cartes, quelle est la probabilité de tirer un Roi au hasard ?',
        options: ['4/32 (soit 1/8)', '1/32', '4/52', '1/4'],
        correctIndex: 0,
        explanation: 'Il y a 4 rois dans le paquet de 32 cartes : 4/32 = 1/8.'
      },
      {
        topic: 'Identités remarquables',
        question: 'Quel est le développement développé de (x + 4)² ?',
        options: ['x² + 8x + 16', 'x² + 16', 'x² + 4x + 16', '2x + 8'],
        correctIndex: 0,
        explanation: '(a + b)² = a² + 2ab + b² = x² + 2(4x) + 4² = x² + 8x + 16.'
      },
      {
        topic: 'Théorème de Thalès',
        question: 'Dans un triangle ABC avec une sécante parallèle (MN) // (BC), que permet de calculer le théorème de Thalès ?',
        options: [
          'La proportionnalité des longueurs des segments AM/AB = AN/AC = MN/BC',
          'La mesure des angles intérieurs du triangle',
          'L\'aire de la surface totale de la figure',
          'La couleur des droites tracées'
        ],
        correctIndex: 0,
        explanation: 'Le théorème de Thalès affirme l\'égalité des rapports de longueurs dans une configuration de droites parallèles.'
      },
      {
        topic: 'Système de deux équations',
        question: 'Quel est le couple solution (x, y) du système : x + y = 10 et x - y = 4 ?',
        options: ['(7, 3)', '(6, 4)', '(8, 2)', '(5, 5)'],
        correctIndex: 0,
        explanation: 'En additionnant : 2x = 14 => x = 7. Puis y = 10 - 7 = 3.'
      },
      {
        topic: 'Puissances de 10',
        question: 'Quelle est la valeur numérique de l\'écriture scientifique 3,5 × 10³ ?',
        options: ['3 500', '350', '35 000', '0,0035'],
        correctIndex: 0,
        explanation: '3,5 × 1 000 = 3 500.'
      },
      {
        topic: 'Trigonométrie dans le triangle rectangle',
        question: 'Dans un triangle rectangle, comment se définit le cosinus d\'un angle aigu ?',
        options: [
          'Côté adjacent / Hypoténuse',
          'Côté opposé / Hypoténuse',
          'Côté opposé / Côté adjacent',
          'Hypoténuse / Côté opposé'
        ],
        correctIndex: 0,
        explanation: 'Cosinus = Adjacent / Hypoténuse (formule mnémotechnique CAH-SO-TOA).'
      },
      {
        topic: 'Aire d\'un disque',
        question: 'Quelle est la formule mathématique exacte pour calculer l\'aire d\'un disque de rayon R ?',
        options: ['π × R²', '2 × π × R', 'π × R³', '4 × π × R²'],
        correctIndex: 0,
        explanation: 'L\'aire d\'un disque de rayon R est donnée par π × R² (2πR est son périmètre).'
      },
      {
        topic: 'Pourcentages cumulés',
        question: 'Un prix augmente successivement de 10% puis de 10%. Quelle est l\'augmentation globale totale ?',
        options: ['21%', '20%', '100%', '11%'],
        correctIndex: 0,
        explanation: 'Coefficient multiplicateur global = 1,10 × 1,10 = 1,21, soit une hausse globale de 21%.'
      },
      {
        topic: 'Équations produit-nul',
        question: 'Quelles sont les deux solutions de l\'équation produit (2x - 6)(x + 5) = 0 ?',
        options: ['x = 3 et x = -5', 'x = -3 et x = 5', 'x = 6 et x = -5', 'x = 0 et x = 6'],
        correctIndex: 0,
        explanation: 'Un produit de facteurs est nul si au moins un des facteurs est nul : 2x = 6 => x = 3, et x + 5 = 0 => x = -5.'
      },
      {
        topic: 'Statistiques - Moyenne pondérée',
        question: 'Un étudiant a obtenu 12 avec un coefficient 2, et 18 avec un coefficient 3. Quelle est sa moyenne pondérée ?',
        options: ['15,6', '15,0', '14,5', '16,2'],
        correctIndex: 0,
        explanation: 'Moyenne = (12×2 + 18×3) / (2 + 3) = (24 + 54) / 5 = 78 / 5 = 15,6.'
      }
    ],
    'Avancé': [
      {
        topic: 'Dérivation',
        question: 'Quelle est la dérivée de la fonction f(x) = 4x³ - 6x² + 9x - 12 ?',
        options: ['12x² - 12x + 9', '12x² - 6x + 9', '4x² - 12x + 9', '12x³ - 12x² + 9'],
        correctIndex: 0,
        explanation: 'd/dx(4x³) = 12x², d/dx(-6x²) = -12x, d/dx(9x) = 9, constante = 0.'
      },
      {
        topic: 'Logarithmes népériens',
        question: 'Simplifiez l\'expression A = ln(12) - ln(3) + ln(2) :',
        options: ['ln(8)', 'ln(4)', 'ln(6)', 'ln(11)'],
        correctIndex: 0,
        explanation: 'ln(12/3) = ln(4). Puis ln(4 × 2) = ln(8).'
      },
      {
        topic: 'Intégration',
        question: 'Quelle est la valeur de l\'intégrale ∫₀¹ (3x² + 2x) dx ?',
        options: ['2', '3', '1', '5'],
        correctIndex: 0,
        explanation: 'Une primitive est F(x) = x³ + x². F(1) = 2, F(0) = 0. Résultat = 2.'
      },
      {
        topic: 'Limites de fonctions',
        question: 'Quelle est la limite quand x tend vers +∞ de (3x² - 5x + 1) / (2x² + 7) ?',
        options: ['3/2', '+∞', '0', '1'],
        correctIndex: 0,
        explanation: 'En l\'infini, la limite d\'une fraction rationnelle est le quotient des termes de plus haut degré : 3x² / 2x² = 3/2.'
      },
      {
        topic: 'Suites géométriques',
        question: 'Pour une suite géométrique (uₙ) de premier terme u₀ = 5 et de raison q = 3, que vaut le terme u₃ ?',
        options: ['135', '45', '15', '405'],
        correctIndex: 0,
        explanation: 'u₃ = u₀ × q³ = 5 × 3³ = 5 × 27 = 135.'
      },
      {
        topic: 'Nombres complexes',
        question: 'Quel est le module du nombre complexe z = 3 + 4i ?',
        options: ['5', '7', '25', '√7'],
        correctIndex: 0,
        explanation: '|z| = √(3² + 4²) = √(9 + 16) = √25 = 5.'
      },
      {
        topic: 'Produit scalaire dans l\'espace',
        question: 'Deux vecteurs non nuls u et v de l\'espace sont orthogonaux si et seulement si :',
        options: [
          'Leur produit scalaire u · v est égal à 0',
          'Leurs coordonnées sont toutes positives',
          'Leur somme est égale au vecteur nul',
          'Ils ont la même norme'
        ],
        correctIndex: 0,
        explanation: 'Par définition du produit scalaire, deux vecteurs sont orthogonaux si et seulement si u · v = 0.'
      },
      {
        topic: 'Fonction exponentielle',
        question: 'Résolvez dans ℝ l\'équation exponentielle e^(2x - 4) = 1 :',
        options: ['x = 2', 'x = 0', 'x = 4', 'x = ln(2)'],
        correctIndex: 0,
        explanation: 'e^(2x - 4) = 1 = e^0 => 2x - 4 = 0 => 2x = 4 => x = 2.'
      },
      {
        topic: 'Loi binomiale',
        question: 'Dans une loi binomiale B(n=10, p=0,3), que vaut l\'espérance mathématique E(X) ?',
        options: ['3', '0,3', '7', '2,1'],
        correctIndex: 0,
        explanation: 'Pour une loi binomiale B(n, p), l\'espérance est E(X) = n × p = 10 × 0,3 = 3.'
      },
      {
        topic: 'Équations différentielles',
        question: 'Quelles sont les solutions réelles de l\'équation différentielle y\' = 2y ?',
        options: ['y(x) = C × e^(2x) avec C ∈ ℝ', 'y(x) = 2x + C', 'y(x) = C × e^(-2x)', 'y(x) = C × x²'],
        correctIndex: 0,
        explanation: 'Les solutions de y\' = ay sont de la forme C × e^(ax).'
      }
    ]
  },

  // ── INFORMATIQUE & ALGORITHMIQUE ──
  'informatique': {
    'Débutant': [
      {
        topic: 'Concepts de base',
        question: 'Qu\'est-ce qu\'un « algorithme » en informatique ?',
        options: [
          'Une suite ordonnée d\'instructions permettant de résoudre un problème étape par étape',
          'Un composant physique en métal situé à l\'intérieur de l\'écran',
          'Un virus informatique qui détruit les fichiers',
          'Un câble qui relie la souris à la prise électrique'
        ],
        correctIndex: 0,
        explanation: 'Un algorithme est une méthode pas-à-pas pour accomplir une tâche.'
      },
      {
        topic: 'Variables en programmation',
        question: 'À quoi sert une « variable » dans un programme informatique ?',
        options: [
          'À stocker et mémoriser une information ou une valeur pour l\'utiliser plus tard',
          'À éteindre automatiquement l\'écran de l\'ordinateur',
          'À imprimer du texte directement sur papier',
          'À empêcher les utilisateurs d\'écrire au clavier'
        ],
        correctIndex: 0,
        explanation: 'Une variable est un conteneur en mémoire qui conserve une valeur modifiable.'
      },
      {
        topic: 'Sécurité numérique',
        question: 'Parmi ces propositions, laquelle correspond à un mot de passe solide ?',
        options: [
          'Un mot de passe long combinant majuscules, minuscules, chiffres et caractères spéciaux',
          'Le prénom de son animal de compagnie écrit en minuscules',
          'La suite de chiffres « 123456 »',
          'Sa propre date de naissance sans espace'
        ],
        correctIndex: 0,
        explanation: 'La robustesse dépend de la longueur et de la diversité des caractères.'
      },
      {
        topic: 'Technologies du Web',
        question: 'Quel langage de balisage est universellement utilisé pour structurer le contenu d\'une page web ?',
        options: ['HTML', 'Photoshop', 'MP3', 'Windows'],
        correctIndex: 0,
        explanation: 'HTML structure les textes, titres, liens et images du web.'
      },
      {
        topic: 'Unité d\'information',
        question: 'Quelle est la plus petite unité d\'information élémentaire en binaire ?',
        options: ['Le bit (0 ou 1)', 'L\'octet', 'Le gigaoctet', 'Le pixel'],
        correctIndex: 0,
        explanation: 'Le bit (binary digit) ne peut prendre que deux états : 0 ou 1.'
      },
      {
        topic: 'Matériel informatique',
        question: 'Quel composant électronique est souvent appelé le « cerveau » d\'un ordinateur ?',
        options: ['Le processeur (CPU)', 'La souris', 'La prise d\'alimentation', 'L\'enceinte sonore'],
        correctIndex: 0,
        explanation: 'Le processeur effectue l\'ensemble des calculs et instructions logiques du système.'
      },
      {
        topic: 'Raccourcis clavier',
        question: 'Quel raccourci clavier universel permet de copier l\'élément sélectionné ?',
        options: ['Ctrl + C', 'Ctrl + V', 'Ctrl + Z', 'Alt + F4'],
        correctIndex: 0,
        explanation: 'Ctrl+C copie l\'élément en mémoire vive (presse-papiers) ; Ctrl+V le colle.'
      },
      {
        topic: 'Navigation web',
        question: 'Quel logiciel sert spécifiquement à afficher des sites et naviguer sur le web ?',
        options: ['Un navigateur web (ex: Chrome, Firefox)', 'Un lecteur vidéo', 'Un logiciel de traitement de texte', 'Un jeu vidéo'],
        correctIndex: 0,
        explanation: 'Le navigateur traduit le code HTML/CSS/JS en pages web interactives.'
      },
      {
        topic: 'Terminologie',
        question: 'Que désigne le terme « bug » en informatique ?',
        options: ['Une erreur ou anomalie dans le code qui empêche le bon fonctionnement du programme', 'La souris sans fil de l\'ordinateur', 'Un nouveau clavier ergonomique', 'Une imprimante très rapide'],
        correctIndex: 0,
        explanation: 'Un bug est une erreur de programmation produisant un comportement inattendu.'
      },
      {
        topic: 'Mémoire vive',
        question: 'Quel est le rôle de la mémoire vive (RAM) dans un ordinateur ?',
        options: [
          'Conserver temporairement les données des applications en cours d\'utilisation pour un accès ultra-rapide',
          'Graver définitivement les photos sur un disque optique',
          'Alimenter l\'écran en électricité',
          'Protéger physiquement la coque extérieure'
        ],
        correctIndex: 0,
        explanation: 'La RAM est une mémoire rapide mais volatile : son contenu s\'efface à l\'extinction.'
      }
    ],
    'Intermédiaire': [
      {
        topic: 'Boucles et itérations',
        question: 'Dans une boucle « for i in range(5) », combien de fois le corps s\'exécute-t-il ?',
        options: ['5 fois (de 0 à 4)', '4 fois (de 1 à 4)', '6 fois (de 0 à 5)', 'Une infinité de fois'],
        correctIndex: 0,
        explanation: 'range(5) produit les indices 0, 1, 2, 3, 4, soit 5 itérations.'
      },
      {
        topic: 'Structures de données',
        question: 'Quelle structure de données fonctionne selon le principe LIFO (Dernier Entré, Premier Sorti) ?',
        options: ['La Pile (Stack)', 'La File (Queue)', 'Le Tableau dynamique', 'L\'arbre binaire'],
        correctIndex: 0,
        explanation: 'Une pile retire toujours le dernier élément inséré en premier.'
      },
      {
        topic: 'Logique booléenne',
        question: 'Que renvoie l\'expression logique (5 > 2) ET (3 == 4) ?',
        options: ['Faux (False)', 'Vrai (True)', 'Null', 'Une erreur de syntaxe'],
        correctIndex: 0,
        explanation: 'Vrai ET Faux renvoie Faux.'
      },
      {
        topic: 'Structures de données - Files',
        question: 'Quelle structure de données fonctionne selon le principe FIFO (Premier Entré, Premier Sorti) ?',
        options: ['La File (Queue)', 'La Pile (Stack)', 'Le Dictionnaire', 'Le Graphe'],
        correctIndex: 0,
        explanation: 'Une file (Queue) traite les éléments dans leur ordre d\'arrivée (comme une file d\'attente).'
      },
      {
        topic: 'Bases de données relationnelles',
        question: 'Quelle commande SQL universelle permet d\'extraire des données filtrées d\'une table ?',
        options: ['SELECT ... FROM ... WHERE ...', 'INSERT INTO ... VALUES ...', 'DROP TABLE ...', 'ALTER DATABASE ...'],
        correctIndex: 0,
        explanation: 'SELECT extrait les colonnes, FROM indique la table et WHERE applique la condition de filtre.'
      },
      {
        topic: 'Programmation Orientée Objet',
        question: 'En programmation orientée objet, qu\'appelle-t-on une « classe » ?',
        options: [
          'Le modèle ou patron de conception définissant les attributs et méthodes des objets',
          'Une salle de cours virtuelle',
          'Une variable contenant uniquement des chiffres entiers',
          'Un câble reliant deux serveurs'
        ],
        correctIndex: 0,
        explanation: 'Une classe est un modèle à partir duquel on instancie des objets.'
      },
      {
        topic: 'Réseaux informatiques',
        question: 'Quel protocole sécurisé chiffre les échanges entre un navigateur et un serveur web ?',
        options: ['HTTPS (avec SSL/TLS)', 'HTTP sans certificat', 'FTP simple', 'Telnet'],
        correctIndex: 0,
        explanation: 'HTTPS chiffre la communication de bout en bout grâce à un certificat TLS.'
      },
      {
        topic: 'Fonctions et Récursivité',
        question: 'Quelle condition est obligatoire dans une fonction récursive pour éviter un dépassement de pile (Stack Overflow) ?',
        options: [
          'Un cas de base d\'arrêt sans appel récursif',
          'Une boucle infinie while(true)',
          'L\'utilisation exclusive de nombres impairs',
          'L\'absence totale de paramètres'
        ],
        correctIndex: 0,
        explanation: 'Le cas de base met fin aux appels récursifs en renvoyant une valeur sans se rappeler elle-même.'
      },
      {
        topic: 'Gestion des versions',
        question: 'Quelle commande Git enregistre localement un ensemble de modifications avec un message explicatif ?',
        options: ['git commit -m "Message"', 'git push origin main', 'git clone <url>', 'git pull'],
        correctIndex: 0,
        explanation: 'git commit fige l\'état des fichiers indexés dans l\'historique local.'
      },
      {
        topic: 'Formats de données',
        question: 'Quel format d\'échange de données textuel basé sur des paires clé-valeur est universellement utilisé par les API REST ?',
        options: ['JSON', 'MP4', 'EXE', 'BMP'],
        correctIndex: 0,
        explanation: 'JSON (JavaScript Object Notation) est le format standard léger d\'échange de données du Web.'
      }
    ],
    'Avancé': [
      {
        topic: 'Complexité algorithmique',
        question: 'Quelle est la complexité dans le pire des cas du tri rapide (QuickSort) standard ?',
        options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'],
        correctIndex: 0,
        explanation: 'Sans pivot aléatoire sur un tableau déjà trié, QuickSort dérive en O(n²).'
      },
      {
        topic: 'Arbres binaires de recherche',
        question: 'Dans un arbre binaire de recherche (ABR) équilibré, quelle est la complexité d\'une recherche d\'élément ?',
        options: ['O(log n)', 'O(n²)', 'O(n!)', 'O(1)'],
        correctIndex: 0,
        explanation: 'La hauteur d\'un arbre équilibré étant log₂(n), la recherche s\'effectue en temps O(log n).'
      },
      {
        topic: 'Architecture logicielle',
        question: 'Quel patron de conception (Design Pattern) garantit qu\'une classe n\'a qu\'une seule et unique instance dans tout le programme ?',
        options: ['Singleton', 'Factory', 'Observer', 'Decorator'],
        correctIndex: 0,
        explanation: 'Le Singleton restreint l\'instanciation d\'une classe à un seul objet global.'
      },
      {
        topic: 'Systèmes d\'exploitation',
        question: 'Qu\'appelle-t-on un « interblocage » (Deadlock) entre processus concurrents ?',
        options: [
          'Une situation où chaque processus attend une ressource verrouillée par un autre, bloquant le système',
          'L\'extinction normale de la machine',
          'Un calcul arithmétique trop rapide',
          'La copie d\'un fichier sur clé USB'
        ],
        correctIndex: 0,
        explanation: 'Le Deadlock survient lorsque plusieurs processus s\'attendent mutuellement dans un cycle d\'attente infini.'
      },
      {
        topic: 'Cryptographie asymétrique',
        question: 'Dans un cryptosystème asymétrique (ex: RSA), quelle clé est utilisée pour déchiffrer un message confidentiel reçu ?',
        options: [
          'La clé privée du destinataire',
          'La clé publique de l\'émetteur',
          'La clé publique du destinataire',
          'Un mot de passe partagé en clair'
        ],
        correctIndex: 0,
        explanation: 'La clé publique chiffre, et seule la clé privée correspondante peut déchiffrer.'
      }
    ]
  },

  // ── LANGUE FRANÇAISE ──
  'francais': {
    'Débutant': [
      {
        topic: 'Grammaire élémentaire',
        question: 'Dans la phrase « Le jeune élève prépare son examen », quel est le verbe conjugué ?',
        options: ['prépare', 'élève', 'examen', 'jeune'],
        correctIndex: 0,
        explanation: '« prépare » est le verbe conjugué au présent de l\'indicatif.'
      },
      {
        topic: 'Conjugaison usuelle',
        question: 'Quelle est la forme correcte au présent : « Ils ______ au marché chaque samedi. » ?',
        options: ['vont', 'vas', 'va', 'allons'],
        correctIndex: 0,
        explanation: 'Au présent, aller se conjugue : « ils vont ».'
      },
      {
        topic: 'Orthographe - Homophones',
        question: 'Complétez la phrase : « Ali part ______ l\'école ______ pied. »',
        options: ['à / à', 'a / a', 'à / a', 'a / à'],
        correctIndex: 0,
        explanation: '« à » est la préposition accentuée ; « a » est l\'auxiliaire avoir.'
      },
      {
        topic: 'Accords simples',
        question: 'Quel est le féminin régulier de l\'adjectif « joyeux » ?',
        options: ['joyeuse', 'joyeux', 'joyeusee', 'joyelle'],
        correctIndex: 0,
        explanation: 'Les adjectifs en -eux forment leur féminin en -euse.'
      },
      {
        topic: 'Pluriels irréguliers',
        question: 'Quel est le pluriel du mot « cheval » ?',
        options: ['chevaux', 'chevals', 'chevales', 'chevalx'],
        correctIndex: 0,
        explanation: 'Les noms en -al font généralement leur pluriel en -aux.'
      },
      {
        topic: 'Classes grammaticales',
        question: 'Dans la phrase « Le chat dort paisiblement », quelle est la nature de « paisiblement » ?',
        options: ['Un adverbe', 'Un adjectif qualificatif', 'Un verbe', 'Un pronom'],
        correctIndex: 0,
        explanation: 'Les mots terminés par -ment sont généralement des adverbes de manière.'
      },
      {
        topic: 'Types de phrases',
        question: 'Parmi ces propositions, laquelle est une phrase négative ?',
        options: ['Il ne mange plus de bonbons.', 'Il mange beaucoup de fruits.', 'Viens immédiatement ici !', 'Quel beau paysage !'],
        correctIndex: 0,
        explanation: 'La présence des négations « ne... plus » caractérise la forme négative.'
      },
      {
        topic: 'Vocabulaire - Antonymes',
        question: 'Quel est l\'antonyme (terme de sens opposé) du mot « généreux » ?',
        options: ['Avare', 'Courageux', 'Poli', 'Calme'],
        correctIndex: 0,
        explanation: 'L\'avare garde son argent, à l\'inverse du généreux.'
      },
      {
        topic: 'Ponctuation',
        question: 'Quel signe de ponctuation termine obligatoirement une phrase interrogative directe ?',
        options: ['Un point d\'interrogation (?)', 'Un point d\'exclamation (!)', 'Des points de suspension (...)', 'Une virgule (,)'],
        correctIndex: 0,
        explanation: 'Le point d\'interrogation clôt les questions directes.'
      },
      {
        topic: 'Accords du participe passé',
        question: 'Dans la phrase « Elles sont parties tôt », pourquoi « parties » prend-il « -es » ?',
        options: [
          'Parce qu\'il est employé avec l\'auxiliaire être et s\'accorde avec le sujet féminin pluriel « elles »',
          'Parce que le mot « tôt » est féminin',
          'C\'est une faute de frappe, il fallait écrire parti',
          'Parce qu\'il y a une négation cachée'
        ],
        correctIndex: 0,
        explanation: 'Avec l\'auxiliaire être, le participe passé s\'accorde en genre et en nombre avec le sujet.'
      }
    ],
    'Intermédiaire': [
      {
        topic: 'Figures de style',
        question: 'Dans l\'expression « Cet athlète court vite comme une gazelle », quelle figure de style est employée ?',
        options: ['Une comparaison', 'Une métaphore sans outil', 'Une métonymie', 'Un oxymore'],
        correctIndex: 0,
        explanation: 'Comparé + Comparant + Outil de comparaison (« comme ») = Comparaison.'
      },
      {
        topic: 'Subordonnées relatives',
        question: 'Dans « Le livre que tu m\'as prêté est passionnant », quelle est la fonction de « que » ?',
        options: ['Complément d\'Objet Direct (COD)', 'Sujet du verbe « est »', 'Complément de lieu', 'Attribut du sujet'],
        correctIndex: 0,
        explanation: 'Tu as prêté quoi ? Le livre. Le pronom « que » est COD du verbe prêté.'
      },
      {
        topic: 'Voix passive',
        question: 'Quelle est la forme passive exacte de : « L\'architecte conçoit le nouvel immeuble » ?',
        options: [
          'Le nouvel immeuble est conçu par l\'architecte',
          'L\'architecte a été conçu par l\'immeuble',
          'Le nouvel immeuble concevait l\'architecte',
          'L\'architecte sera conçu prochainement'
        ],
        correctIndex: 0,
        explanation: 'Le COD devient sujet et le verbe se met au passif : « est conçu par ».'
      },
      {
        topic: 'Modes verbaux - Subjonctif',
        question: 'Quelle phrase contient un verbe correctement conjugué au subjonctif présent ?',
        options: [
          'Il faut que tu fasses tes devoirs avec sérieux.',
          'Il faut que tu fais tes devoirs.',
          'Il faut que tu feras tes devoirs.',
          'Il faut que tu as fait tes devoirs.'
        ],
        correctIndex: 0,
        explanation: 'La locution « il faut que » impose l\'emploi du subjonctif : « que tu fasses ».'
      },
      {
        topic: 'Accords particuliers',
        question: 'Dans la phrase « Les pommes que j\'ai ______ étaient délicieuses », comment s\'accorde le participe ?',
        options: ['mangées', 'mangé', 'manger', 'mangez'],
        correctIndex: 0,
        explanation: 'Avec avoir, le participe s\'accorde avec le COD placé avant (« que », mis pour « les pommes », fém. pluriel).'
      },
      {
        topic: 'Discours rapporté',
        question: 'Au discours indirect au passé, comment transpose-t-on : Il a dit : « Je partirai demain » ?',
        options: [
          'Il a dit qu\'il partirait le lendemain',
          'Il a dit qu\'il partira demain',
          'Il a dit qu\'il est parti hier',
          'Il a dit qu\'il parte demain'
        ],
        correctIndex: 0,
        explanation: 'La concordance des temps transforme le futur en conditionnel présent et « demain » en « le lendemain ».'
      }
    ],
    'Avancé': [
      {
        topic: 'Figures d\'opposition',
        question: 'Dans « Cette obscure clarté qui tombe des étoiles » (Corneille), quelle figure réunit deux termes contradictoires ?',
        options: ['Un oxymore', 'Une hyperbole', 'Une prétérition', 'Une anaphore'],
        correctIndex: 0,
        explanation: 'L\'oxymore unit deux termes opposés dans une même expression.'
      },
      {
        topic: 'Mouvements littéraires',
        question: 'Quel mouvement littéraire du XIXe siècle, porté par Victor Hugo, privilégie l\'expression des passions et de la liberté créatrice ?',
        options: ['Le Romantisme', 'Le Classicisme', 'Le Surréalisme', 'Le Naturalisme'],
        correctIndex: 0,
        explanation: 'Le Romantisme exalte le lyrisme, les émotions individuelles et la liberté artistique.'
      },
      {
        topic: 'Versification classique',
        question: 'Dans la poésie classique française, combien de syllabes (mètres) compte un vers « alexandrin » ?',
        options: ['12 syllabes', '10 syllabes (décasyllabe)', '8 syllabes (octosyllabe)', '14 syllabes'],
        correctIndex: 0,
        explanation: 'L\'alexandrin est le vers noble par excellence de 12 syllabes, généralement scindé par une césure à l\'hémistiche (6/6).'
      },
      {
        topic: 'Figures de pensée',
        question: 'Quelle figure de style consiste à dire le moins pour suggérer le plus (ex: « Va, je ne te hais point » pour dire « je t\'aime ») ?',
        options: ['Une litote', 'Un euphémisme', 'Une antithèse', 'Une métonymie'],
        correctIndex: 0,
        explanation: 'La litote atténue l\'expression d\'une pensée pour lui donner en réalité plus de force.'
      }
    ]
  },

  // ── ANGLAIS ──
  'anglais': {
    'Débutant': [
      {
        topic: 'Present Simple',
        question: 'Choose the correct sentence in the Present Simple :',
        options: [
          'She works in a hospital every day.',
          'She work in a hospital every day.',
          'She working in a hospital every day.',
          'She are work in a hospital every day.'
        ],
        correctIndex: 0,
        explanation: 'With he/she/it in the present simple, we add -s to the verb.'
      },
      {
        topic: 'Basic Vocabulary',
        question: 'What is the opposite of the adjective "cheap" ?',
        options: ['Expensive', 'Easy', 'Quick', 'Friendly'],
        correctIndex: 0,
        explanation: 'Expensive means costing a lot of money (opposite of cheap).'
      },
      {
        topic: 'Days of the week',
        question: 'How do you say "mercredi" in English ?',
        options: ['Wednesday', 'Tuesday', 'Thursday', 'Friday'],
        correctIndex: 0,
        explanation: 'Wednesday is the third day of the work week.'
      },
      {
        topic: 'Irregular Plurals',
        question: 'What is the plural form of the noun "child" ?',
        options: ['Children', 'Childs', 'Childes', 'Childrens'],
        correctIndex: 0,
        explanation: 'The irregular plural of child is children.'
      },
      {
        topic: 'Verb To Be',
        question: 'Complete the sentence : "They ______ happy to meet you."',
        options: ['are', 'is', 'am', 'be'],
        correctIndex: 0,
        explanation: 'With "they", the correct form of the verb to be is "are".'
      },
      {
        topic: 'Past Simple',
        question: 'What is the past simple of the irregular verb "to go" ?',
        options: ['went', 'goed', 'gone', 'going'],
        correctIndex: 0,
        explanation: 'Go -> Went -> Gone.'
      },
      {
        topic: 'Negative sentences',
        question: 'Choose the correct negative form : "I ______ speak German."',
        options: ['don\'t', 'doesn\'t', 'am not', 'not'],
        correctIndex: 0,
        explanation: 'With "I", we use "do not" (don\'t) for the present simple.'
      },
      {
        topic: 'Telling Time',
        question: 'What does "half past two" mean ?',
        options: ['2:30', '2:15', '2:45', '3:30'],
        correctIndex: 0,
        explanation: 'Half past two means 30 minutes past 2:00 (2:30).'
      }
    ],
    'Intermédiaire': [
      {
        topic: 'Conditionals',
        question: 'Complete : "If I ______ more time, I would learn Spanish."',
        options: ['had', 'have', 'will have', 'would have'],
        correctIndex: 0,
        explanation: 'Second conditional: If + past simple, would + verb.'
      },
      {
        topic: 'Phrasal Verbs',
        question: 'Which phrasal verb means "to cancel an event or meeting" ?',
        options: ['Call off', 'Put off', 'Take off', 'Look after'],
        correctIndex: 0,
        explanation: 'Call off means cancel ; put off means delay.'
      },
      {
        topic: 'Present Perfect vs Past Simple',
        question: 'Choose the correct tense : "I ______ here since 2018."',
        options: ['have lived', 'lived', 'am living', 'was lived'],
        correctIndex: 0,
        explanation: 'With "since" indicating a period starting in the past and continuing now, use the Present Perfect.'
      },
      {
        topic: 'Passive Voice',
        question: 'Select the correct passive sentence : "The novel was written by George Orwell."',
        options: [
          'The novel was written by George Orwell.',
          'The novel was wrote by George Orwell.',
          'George Orwell was written the novel.',
          'The novel had writing by George Orwell.'
        ],
        correctIndex: 0,
        explanation: 'Passive structure: be + past participle (was written).'
      },
      {
        topic: 'Modal Verbs',
        question: 'Which modal verb expresses strong deduction in the positive : "He has worked 14 hours today, he ______ be exhausted."',
        options: ['must', 'can\'t', 'might not', 'shouldn\'t'],
        correctIndex: 0,
        explanation: '"Must" expresses logical necessity or strong certainty.'
      }
    ],
    'Avancé': [
      {
        topic: 'Inversion',
        question: 'Choose the correct formal inversion : "Seldom ______ such a beautiful sunset."',
        options: ['have I seen', 'I have seen', 'I saw', 'did I saw'],
        correctIndex: 0,
        explanation: 'Negative adverbs at the beginning trigger subject-auxiliary inversion.'
      },
      {
        topic: 'Mixed Conditionals',
        question: 'Complete the mixed conditional : "If I had taken that job, I ______ living in London today."',
        options: ['would be', 'would have been', 'will be', 'am'],
        correctIndex: 0,
        explanation: 'Past condition (had taken) with present result (would be living).'
      },
      {
        topic: 'Advanced Vocabulary',
        question: 'What is the closest synonym to the adjective "ubiquitous" ?',
        options: ['Omnipresent', 'Scarce', 'Unusual', 'Transient'],
        correctIndex: 0,
        explanation: 'Ubiquitous means present or found everywhere (omnipresent).'
      }
    ]
  },

  // ── LANGUE ARABE ──
  'arabe': {
    'Débutant': [
      {
        topic: 'المفردات البسيطة',
        question: 'مَا هُوَ ضِدُّ كَلِمَةِ « كَبِيرٌ » فِي اللُّغَةِ العَرَبِيَّةِ ؟',
        options: ['صَغِيرٌ', 'جَمِيلٌ', 'قَصِيرٌ', 'سَرِيعٌ'],
        correctIndex: 0,
        explanation: 'ضدّ « كَبِيرٌ » هو « صَغِيرٌ ».'
      },
      {
        topic: 'أركان الجملة الفعلية',
        question: 'فِي جُمْلَةِ « قَرَأَ التِّلْمِيذُ كِتَابًا »، أَيْنَ هُوَ الفَاعِلُ ؟',
        options: ['التِّلْمِيذُ', 'قَرَأَ', 'كِتَابًا', 'مَحْذُوفٌ'],
        correctIndex: 0,
        explanation: '« التِّلْمِيذُ » هو الفاعل المرفوع بالضمة الظاهرة.'
      },
      {
        topic: 'الجموع البسيطة',
        question: 'مَا هُوَ جَمْعُ كَلِمَةِ « كِتَاب » ؟',
        options: ['كُتُبٌ', 'كِتَابَاتٌ', 'كَاتِبُونَ', 'مَكْتَبَاتٌ'],
        correctIndex: 0,
        explanation: 'جمع تكسير لكلمة « كِتَاب » هو « كُتُبٌ ».'
      },
      {
        topic: 'حروف الجر',
        question: 'أَيٌّ مِنَ الحُرُوفِ التَّالِيَةِ يُعَدُّ حَرْفَ جَرٍّ ؟',
        options: ['فِي', 'إِنَّ', 'لَكِنَّ', 'سَوْفَ'],
        correctIndex: 0,
        explanation: '« فِي » من حروف الجر التي تجر الاسم بعدها.'
      },
      {
        topic: 'المؤنث والمذكر',
        question: 'مَا هُوَ مُؤَنَّثُ كَلِمَةِ « مُعَلِّمٌ » ؟',
        options: ['مُعَلِّمَةٌ', 'مُعَلِّمَاتٌ', 'مُعَلِّمُونَ', 'مُعَلِّمَتَانِ'],
        correctIndex: 0,
        explanation: 'يصاغ المؤنث بزيادة التاء المربوطة في آخره : مُعَلِّمَةٌ.'
      }
    ],
    'Intermédiaire': [
      {
        topic: 'الجملة الاسمية',
        question: 'فِي جُمْلَةِ « العِلْمُ نُورٌ »، مَا هُوَ إِعْرَابُ كَلِمَةِ « العِلْمُ » ؟',
        options: ['مُبْتَدَأٌ مَرْفُوعٌ بِالضَّمَّةِ', 'فَاعِلٌ مَرْفُوعٌ بِالضَّمَّةِ', 'خَبَرٌ مَرْفُوعٌ بِالضَّمَّةِ', 'مَفْعُولٌ بِهِ مَنْصُوبٌ'],
        correctIndex: 0,
        explanation: '« العِلْمُ » اسم معرفة تبدأ به الجملة الاسمية فهو مبتدأ.'
      }
    ],
    'Avancé': [
      {
        topic: 'الأسماء الخمسة',
        question: 'مَا هِيَ عَلاَمَةُ النَّصْبِ فِي الأَسْمَاءِ الخَمْسَةِ (أَبُو، أَخُو...) ؟',
        options: ['الأَلِفُ (أَبَاكَ)', 'الوَاوُ (أَبُوكَ)', 'اليَاءُ (أَبِيكَ)', 'الفَتْحَةُ المُقَدَّرَةُ'],
        correctIndex: 0,
        explanation: 'تنصب الأسماء الخمسة بالألف : رأيتُ أباك.'
      }
    ]
  },

  // ── HISTOIRE & GÉOGRAPHIE ──
  'histoire_geo': {
    'Débutant': [
      {
        topic: 'Repères géographiques',
        question: 'Quelle est la capitale officielle du Royaume du Maroc ?',
        options: ['Rabat', 'Casablanca', 'Marrakech', 'Fès'],
        correctIndex: 0,
        explanation: 'Rabat est la capitale administrative et politique du Maroc.'
      },
      {
        topic: 'Océans du monde',
        question: 'Quel est le plus grand et le plus vaste océan de notre planète ?',
        options: ['L\'océan Pacifique', 'L\'océan Atlantique', 'L\'océan Indien', 'L\'océan Arctique'],
        correctIndex: 0,
        explanation: 'L\'océan Pacifique couvre plus d\'un tiers du globe terrestre.'
      },
      {
        topic: 'Grandes dates historiques',
        question: 'En quelle année s\'est achevée la Seconde Guerre mondiale ?',
        options: ['1945', '1918', '1939', '1960'],
        correctIndex: 0,
        explanation: 'La guerre a pris fin en 1945 avec la capitulation de l\'Axe.'
      },
      {
        topic: 'Continents',
        question: 'Quel est le plus vaste continent du monde par sa superficie et sa population ?',
        options: ['L\'Asie', 'L\'Afrique', 'L\'Europe', 'L\'Océanie'],
        correctIndex: 0,
        explanation: 'L\'Asie est le continent le plus grand et le plus peuplé.'
      },
      {
        topic: 'Fleuves majeurs',
        question: 'Quel est le plus long fleuve du continent africain ?',
        options: ['Le Nil', 'Le Congo', 'Le Niger', 'Le Zambèze'],
        correctIndex: 0,
        explanation: 'Le Nil s\'étend sur plus de 6 600 kilomètres en Afrique.'
      },
      {
        topic: 'Lignes imaginaires',
        question: 'Comment appelle-t-on la ligne imaginaire qui sépare la Terre en deux hémisphères (Nord et Sud) ?',
        options: ['L\'Équateur', 'Le méridien de Greenwich', 'Le tropique du Cancer', 'Le cercle polaire'],
        correctIndex: 0,
        explanation: 'L\'Équateur est le parallèle de latitude 0°.'
      }
    ],
    'Intermédiaire': [
      {
        topic: 'Révolution et société',
        question: 'Quel événement de 1789 symbolise le commencement de la Révolution française ?',
        options: ['La prise de la Bastille (14 juillet)', 'Le couronnement de Napoléon', 'La bataille de Waterloo', 'Le traité de Versailles'],
        correctIndex: 0,
        explanation: 'La prise de la Bastille le 14 juillet marque le soulèvement populaire.'
      }
    ],
    'Avancé': [
      {
        topic: 'Histoire contemporaine',
        question: 'Quelle conférence internationale de 1944 a instauré le système monétaire basé sur l\'or et le dollar ?',
        options: ['Les accords de Bretton Woods', 'La conférence de Yalta', 'Le traité de Rome', 'Les accords d\'Oslo'],
        correctIndex: 0,
        explanation: 'Bretton Woods a créé le FMI et les règles monétaires internationales d\'après-guerre.'
      }
    ]
  },

  // ── SCIENCES DE LA VIE ET DE LA TERRE (SVT / BIOLOGIE) ──
  'biologie': {
    'Débutant': [
      {
        topic: 'Corps humain',
        question: 'Quel organe humain fonctionne comme une pompe pour faire circuler le sang dans tout le corps ?',
        options: ['Le cœur', 'Le foie', 'Le poumon', 'L\'estomac'],
        correctIndex: 0,
        explanation: 'Le cœur propulse le sang oxygéné à travers le système circulatoire.'
      },
      {
        topic: 'Monde végétal',
        question: 'De quoi les plantes ont-elles besoin pour réaliser la photosynthèse ?',
        options: [
          'De lumière du soleil, d\'eau et de gaz carbonique (CO₂)',
          'D\'obscurité totale et de sel de table',
          'Uniquement d\'électricité',
          'D\'huile de cuisine et de plastique'
        ],
        correctIndex: 0,
        explanation: 'La photosynthèse capte la lumière, l\'eau et le CO₂ pour créer du glucose.'
      },
      {
        topic: 'Les états de l\'eau',
        question: 'À quelle température l\'eau pure se transforme-t-elle en glace (état solide) sous pression normale ?',
        options: ['0 °C', '100 °C', '25 °C', '-50 °C'],
        correctIndex: 0,
        explanation: 'L\'eau gèle à 0 °C et entre en ébullition à 100 °C.'
      },
      {
        topic: 'Respiration humaine',
        question: 'Quel gaz essentiel contenu dans l\'air nos poumons absorbent-ils pour alimenter nos organes ?',
        options: ['L\'oxygène (O₂)', 'Le dioxyde de carbone (CO₂)', 'Le méthane', 'L\'hélium'],
        correctIndex: 0,
        explanation: 'Le dioxygène est indispensable au métabolisme cellulaire.'
      },
      {
        topic: 'Les cellules sanguines',
        question: 'Quel élément du sang a pour rôle principal de transporter l\'oxygène vers tous les tissus ?',
        options: ['Les globules rouges (hématies)', 'Les plaquettes', 'Le plasma seul', 'Les anticorps'],
        correctIndex: 0,
        explanation: 'L\'hémoglobine des globules rouges fixe et transporte l\'oxygène.'
      }
    ],
    'Intermédiaire': [
      {
        topic: 'Biologie cellulaire',
        question: 'Quelle organite est reconnue comme la « centrale énergétique » de la cellule eucaryote ?',
        options: ['La mitochondrie', 'L\'appareil de Golgi', 'Le lysosome', 'Le ribosome'],
        correctIndex: 0,
        explanation: 'Les mitochondries produisent l\'ATP par respiration cellulaire.'
      }
    ],
    'Avancé': [
      {
        topic: 'Génétique moléculaire',
        question: 'Quelle enzyme catalyse la synthèse de l\'ARN messager à partir de l\'ADN ?',
        options: ['L\'ARN polymérase II', 'L\'ADN ligase', 'L\'hélicase', 'La topoisomérase'],
        correctIndex: 0,
        explanation: 'L\'ARN polymérase réalise la transcription génétique.'
      }
    ]
  },

  // ── DROIT & SCIENCES JURIDIQUES ──
  'droit': {
    'Débutant': [
      {
        topic: 'Rôle du Droit',
        question: 'Quelle est la mission essentielle de la loi dans une société ?',
        options: [
          'Fixer des règles communes pour organiser la vie en société et protéger les libertés',
          'Permettre aux plus forts d\'imposer leurs décisions sans limite',
          'Remplacer les livres scolaires dans les écoles',
          'Interdire tout échange commercial entre citoyens'
        ],
        correctIndex: 0,
        explanation: 'Le droit pacifie et organise les rapports sociaux.'
      },
      {
        topic: 'Principes fondamentaux de justice',
        question: 'Que signifie le principe universel de « présomption d\'innocence » ?',
        options: [
          'Toute personne est considérée comme innocente tant que sa culpabilité n\'a pas été légalement démontrée',
          'Tout accusé est automatiquement condamné dès son arrestation',
          'Le juge n\'a pas le droit d\'entendre la défense de l\'accusé',
          'Seuls les policiers ont le droit de décider des peines de prison'
        ],
        correctIndex: 0,
        explanation: 'Tant qu\'un jugement définitif n\'est pas rendu, l\'accusé est présumé innocent.'
      },
      {
        topic: 'La Constitution',
        question: 'Quel est le texte juridique suprême qui définit l\'organisation de l\'État et les droits fondamentaux ?',
        options: ['La Constitution', 'Le règlement intérieur du lycée', 'Le code de la route', 'La convention collective'],
        correctIndex: 0,
        explanation: 'La Constitution est au sommet de la hiérarchie des normes juridiques.'
      },
      {
        topic: 'Droit des contrats',
        question: 'Qu\'est-ce qu\'un contrat entre deux personnes ?',
        options: [
          'Un accord de volonté destiné à créer des obligations juridiques réciproques',
          'Une simple promesse verbale sans valeur',
          'Un ordre unilatéral sans consentement',
          'Une lettre anonyme'
        ],
        correctIndex: 0,
        explanation: 'Le contrat engage la responsabilité juridique de ceux qui l\'ont conclu.'
      }
    ],
    'Intermédiaire': [
      {
        topic: 'Validité contractuelle',
        question: 'Quelles sont les conditions essentielles de validité d\'un contrat ?',
        options: [
          'Le consentement éclairé, la capacité juridique et un contenu licite et certain',
          'Uniquement un cachet de cire rouge',
          'L\'accord obligatoire d\'une banque d\'affaires',
          'L\'absence totale d\'écrit'
        ],
        correctIndex: 0,
        explanation: 'L\'article 1128 du Code civil exige consentement, capacité et contenu licite.'
      }
    ],
    'Avancé': [
      {
        topic: 'Responsabilité civile',
        question: 'Quelles sont les trois conditions cumulatives pour engager la responsabilité délictuelle ?',
        options: [
          'Une faute, un préjudice certain et un lien de causalité direct',
          'Une intention de nuire prouvée, un contrat écrit et deux témoins majeurs',
          'Une plainte pénale préalable',
          'Un dommage sans auteur identifié'
        ],
        correctIndex: 0,
        explanation: 'Faute + Dommage + Lien de causalité = Réparation du préjudice.'
      }
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SHUFFLER & SANITIZATION UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomizeQuestionOptions(q) {
  const correctOption = q.options[q.correctIndex];
  const shuffledOptions = shuffleArray(q.options);
  const newCorrectIndex = shuffledOptions.indexOf(correctOption);
  return {
    ...q,
    options: shuffledOptions,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0
  };
}

/**
 * Robust subject normalizer matching user course titles to internal banks.
 */
function normalizeSubject(subject = '') {
  const s = subject.toLowerCase().trim();
  if (s.includes('islam') || s.includes('din') || s.includes('coran') || s.includes('hadith')) return 'education_islamique';
  if (s.includes('arab')) return 'arabe';
  if (s.includes('physiq') || s.includes('chimi') || s.includes('pc')) return 'physique_chimie';
  if (s.includes('bio') || s.includes('svt') || s.includes('sant') || s.includes('anat') || s.includes('physio') || s.includes('éveil') || s.includes('eveil')) return 'biologie';
  if (s.includes('info') || s.includes('algo') || s.includes('code') || s.includes('program') || s.includes('ia') || s.includes('intelligence')) return 'informatique';
  if (s.includes('anglais') || s.includes('eng')) return 'anglais';
  if (s.includes('math') || s.includes('stat') || s.includes('arithm') || s.includes('géom') || s.includes('geom')) return 'math';
  if (s.includes('hist') || s.includes('géo') || s.includes('geo')) return 'histoire_geo';
  if (s.includes('sport') || s.includes('eps') || s.includes('physique et sportive')) return 'eps';
  if (s.includes('méthod') || s.includes('method') || s.includes('philo')) return 'methodologie';
  if (s.includes('gest') || s.includes('compt') || s.includes('financ') || s.includes('manag') || s.includes('market') || s.includes('éco') || s.includes('eco')) return 'gestion';
  if (s.includes('droit') || s.includes('jurid')) return 'droit';
  if (s.includes('franc') || s.includes('franç') || s.includes('litt')) return 'francais';
  return 'francais';
}

const QUIZ_BANKS_CP = {
  'math': [
    {
      topic: 'Dénombrement 1 à 5',
      question: 'Combien y a-t-il d\'étoiles : ⭐ ⭐ ⭐ ?',
      options: ['3 étoiles', '2 étoiles', '4 étoiles', '5 étoiles'],
      correctIndex: 0,
      explanation: 'Quand on compte une à une, il y a exactement 3 étoiles.'
    },
    {
      topic: 'Petite addition',
      question: 'Combien font 2 + 1 ?',
      options: ['3', '2', '4', '5'],
      correctIndex: 0,
      explanation: '2 + 1 est égal à 3.'
    },
    {
      topic: 'Petite addition',
      question: 'Combien font 3 + 2 ?',
      options: ['5', '4', '6', '3'],
      correctIndex: 0,
      explanation: '3 + 2 est égal à 5.'
    },
    {
      topic: 'Suite des nombres',
      question: 'Quel nombre vient juste après 4 ?',
      options: ['5', '3', '6', '2'],
      correctIndex: 0,
      explanation: 'On compte : 1, 2, 3, 4, et après vient le 5.'
    },
    {
      topic: 'Suite des nombres',
      question: 'Quel nombre vient juste avant 7 ?',
      options: ['6', '8', '5', '9'],
      correctIndex: 0,
      explanation: 'Le nombre situé juste avant 7 est le 6.'
    },
    {
      topic: 'Plus grand nombre',
      question: 'Quel est le plus grand nombre entre 3 et 8 ?',
      options: ['8', '3', '2', '5'],
      correctIndex: 0,
      explanation: '8 est plus grand que 3.'
    },
    {
      topic: 'Formes simples',
      question: 'Quelle est la forme d\'un ballon de football ?',
      options: ['Un rond (cercle)', 'Un carré', 'Un triangle', 'Un rectangle'],
      correctIndex: 0,
      explanation: 'Le ballon est tout rond comme un cercle.'
    },
    {
      topic: 'Formes simples',
      question: 'Combien de côtés possède un triangle ?',
      options: ['3 côtés', '4 côtés', '2 côtés', '5 côtés'],
      correctIndex: 0,
      explanation: 'Le triangle possède exactement 3 côtés.'
    },
    {
      topic: 'Formes simples',
      question: 'Combien de côtés possède un carré ?',
      options: ['4 côtés', '3 côtés', '2 côtés', '5 côtés'],
      correctIndex: 0,
      explanation: 'Le carré possède 4 côtés égaux.'
    },
    {
      topic: 'Repérage spatial',
      question: 'Où pose-t-on le chapeau quand on s\'habille ?',
      options: ['Sur la tête', 'Sous les pieds', 'Dans la poche', 'Sous la table'],
      correctIndex: 0,
      explanation: 'On met le chapeau sur la tête.'
    }
  ],
  'francais': [
    {
      topic: 'Les voyelles',
      question: 'Laquelle de ces lettres est une voyelle ?',
      options: ['A', 'B', 'D', 'F'],
      correctIndex: 0,
      explanation: 'La lettre A est une voyelle.'
    },
    {
      topic: 'Son initial',
      question: 'Par quelle lettre commence le mot « Chat » ?',
      options: ['C', 'P', 'M', 'T'],
      correctIndex: 0,
      explanation: 'Chat commence par la lettre C.'
    },
    {
      topic: 'Son initial',
      question: 'Par quelle lettre commence le mot « Pomme » ?',
      options: ['P', 'V', 'L', 'S'],
      correctIndex: 0,
      explanation: 'Pomme commence par la lettre P.'
    },
    {
      topic: 'Articles simples',
      question: 'Que dit-on devant le mot « crayon » ?',
      options: ['Un crayon', 'Une crayon', 'Des crayon', 'La crayon'],
      correctIndex: 0,
      explanation: 'On dit « un crayon ».'
    },
    {
      topic: 'Articles simples',
      question: 'Que dit-on devant le mot « gomme » ?',
      options: ['Une gomme', 'Un gomme', 'Le gomme', 'Des gomme'],
      correctIndex: 0,
      explanation: 'On dit « une gomme ».'
    },
    {
      topic: 'Vocabulaire école',
      question: 'Avec quoi efface-t-on une erreur sur un cahier ?',
      options: ['Une gomme', 'Une règle', 'Un cartable', 'Des ciseaux'],
      correctIndex: 0,
      explanation: 'On utilise une gomme pour effacer.'
    },
    {
      topic: 'Politesse',
      question: 'Que dit-on le matin quand on arrive dans la classe ?',
      options: ['Bonjour', 'Bonne nuit', 'Au revoir', 'Pardon'],
      correctIndex: 0,
      explanation: 'Le matin, on dit gentiment Bonjour.'
    },
    {
      topic: 'Couleurs simples',
      question: 'Quelle est la couleur de l\'herbe fraîche ?',
      options: ['Verte', 'Rouge', 'Bleue', 'Noire'],
      correctIndex: 0,
      explanation: 'L\'herbe est verte.'
    }
  ],
  'arabe': [
    {
      topic: 'الحروف الهجائية',
      question: 'أَيُّ حَرْفٍ تَبْدَأُ بِهِ كَلِمَةُ «بَاب» ؟',
      options: ['حَرْفُ البَاءِ (ب)', 'حَرْفُ المِيمِ (م)', 'حَرْفُ الدَّالِ (د)', 'حَرْفُ الرَّاءِ (ر)'],
      correctIndex: 0,
      explanation: 'كلمة باب تبدأ بحرف الباء.'
    },
    {
      topic: 'أسماء الإشارة',
      question: 'مَاذَا نَقُولُ لِلْوَلَدِ ؟',
      options: ['هَذَا وَلَدٌ', 'هَذِهِ وَلَدٌ', 'تِلْكَ وَلَدٌ', 'هُنَا وَلَدٌ'],
      correctIndex: 0,
      explanation: 'نستخدم «هذا» للمذكر فنقول : هذا ولد.'
    },
    {
      topic: 'أسماء الإشارة',
      question: 'مَاذَا نَقُولُ لِلْبِنْتِ ؟',
      options: ['هَذِهِ بِنْتٌ', 'هَذَا بِنْتٌ', 'ذَلِكَ بِنْتٌ', 'هُنَا بِنْتٌ'],
      correctIndex: 0,
      explanation: 'نستخدم «هذه» للمؤنث فنقول : هذه بنت.'
    },
    {
      topic: 'الأدوات المدرسية',
      question: 'بِمَاذَا نَكْتُبُ الدَّرْسَ فِي الدَّفْتَرِ ؟',
      options: ['بِالقَلَمِ', 'بِالمِمْحَاةِ', 'بِالمِسْطَرَةِ', 'بِالمِقَصِّ'],
      correctIndex: 0,
      explanation: 'نكتب بالقلم.'
    },
    {
      topic: 'الحركات القصيرة',
      question: 'الحَرَكَةُ فَوْقَ حَرْفِ الدَّالِ فِي كَلِمَةِ «دَار» هِيَ :',
      options: ['الفَتْحَة', 'الضَّمَّة', 'الكَسْرَة', 'السُّكُون'],
      correctIndex: 0,
      explanation: 'الفتحة توضع فوق الحرف.'
    }
  ],
  'education_islamique': [
    {
      topic: 'أركان الإسلام',
      question: 'كَمْ عَدَدُ أَرْكَانِ الإِسْلَامِ ؟',
      options: ['5 أَرْكَان', '3 أَرْكَان', '7 أَرْكَان', '10 أَرْكَان'],
      correctIndex: 0,
      explanation: 'أركان الإسلام خمسة.'
    },
    {
      topic: 'الركن الأول',
      question: 'مَا هُوَ الرُّكْنُ الأَوَّلُ مِنْ أَرْكَانِ الإِسْلَامِ ؟',
      options: ['الشَّهَادَتَانِ', 'الصَّوْمُ', 'الحَجُّ', 'الزَّكَاةُ'],
      correctIndex: 0,
      explanation: 'أول أركان الإسلام هو الشهادتان.'
    },
    {
      topic: 'آداب الأكل',
      question: 'مَاذَا نَقُولُ قَبْلَ أَنْ نَبْدَأَ فِي الأَكْلِ ؟',
      options: ['بِسْمِ اللَّهِ', 'الحَمْدُ لِلَّهِ', 'أَسْتَغْفِرُ اللَّه', 'سُبْحَانَ اللَّه'],
      correctIndex: 0,
      explanation: 'نقول باسم الله قبل تناول الطعام.'
    },
    {
      topic: 'آداب الأكل',
      question: 'بِأَيِّ يَدٍ نَأْكُلُ الطَّعَامَ كَمَا عَلَّمَنَا رَسُولُ اللَّهِ ؟',
      options: ['بِاليَدِ اليُمْنَى', 'بِاليَدِ اليُسْرَى', 'بِاليَدَيْنِ مَعًا', 'لَا فَرْقَ'],
      correctIndex: 0,
      explanation: 'نأكل باليد اليمنى تيمناً وسنة.'
    }
  ],
  'biologie': [
    {
      topic: 'Les 5 sens',
      question: 'Avec quel organe pouvons-nous voir les couleurs et les formes ?',
      options: ['Les yeux', 'Les oreilles', 'Le nez', 'La bouche'],
      correctIndex: 0,
      explanation: 'Les yeux nous permettent de voir.'
    },
    {
      topic: 'Les 5 sens',
      question: 'Avec quel organe pouvons-nous écouter une jolie musique ?',
      options: ['Les oreilles', 'Les yeux', 'Les mains', 'La langue'],
      correctIndex: 0,
      explanation: 'Les oreilles nous permettent d\'entendre.'
    },
    {
      topic: 'L\'hygiène',
      question: 'Avec quoi se lave-t-on les mains avant de manger ?',
      options: ['Avec de l\'eau et du savon', 'Avec du sable', 'Avec un mouchoir sec', 'Avec du jus'],
      correctIndex: 0,
      explanation: 'On utilise de l\'eau propre et du savon.'
    },
    {
      topic: 'Le jour et la nuit',
      question: 'Quand voit-on le soleil briller dans le ciel ?',
      options: ['Pendant le jour', 'Pendant la nuit', 'Pendant la pluie', 'Sous l\'eau'],
      correctIndex: 0,
      explanation: 'Le soleil éclaire la Terre pendant la journée.'
    }
  ],
  'anglais': [
    {
      topic: 'Colors',
      question: 'What color is the sun in the sky?',
      options: ['Yellow', 'Blue', 'Black', 'Purple'],
      correctIndex: 0,
      explanation: 'The sun is yellow.'
    },
    {
      topic: 'Numbers',
      question: 'How many fingers do you have on one hand?',
      options: ['5', '2', '8', '10'],
      correctIndex: 0,
      explanation: 'We have 5 fingers on one hand.'
    },
    {
      topic: 'Animals',
      question: 'Which animal says "meow"?',
      options: ['The cat', 'The dog', 'The cow', 'The duck'],
      correctIndex: 0,
      explanation: 'The cat says meow.'
    }
  ]
};

/**
 * Returns question pool from internal bank for a given subject and difficulty tier.
 */
function getQuestionsFromBank(subjectKey, difficulty = 'Débutant', isPrimaire1 = false) {
  if (isPrimaire1) {
    const cpBank = QUIZ_BANKS_CP[subjectKey] ||
                   (subjectKey === 'education_islamique' ? QUIZ_BANKS_CP['arabe'] : null) ||
                   QUIZ_BANKS_CP['math'];
    if (cpBank && cpBank.length > 0) {
      return cpBank;
    }
  }

  const subjBank = QUIZ_BANKS_BY_SUBJECT[subjectKey] ||
                   (subjectKey === 'education_islamique' ? QUIZ_BANKS_BY_SUBJECT['arabe'] : null) ||
                   (subjectKey === 'physique_chimie' ? QUIZ_BANKS_BY_SUBJECT['math'] : null) ||
                   QUIZ_BANKS_BY_SUBJECT['francais'] ||
                   QUIZ_BANKS_BY_SUBJECT['gestion'];
  const diffTier = ['Débutant', 'Intermédiaire', 'Avancé'].includes(difficulty) ? difficulty : 'Débutant';
  
  if (subjBank[diffTier] && subjBank[diffTier].length > 0) {
    return subjBank[diffTier];
  }
  return subjBank['Débutant'] || subjBank['Intermédiaire'] || [];
}

/**
 * Normalizes text for similarity and anti-repetition comparison.
 */
function normalizeForSimilarity(str = '') {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s\u0600-\u06FF]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates token overlap similarity between two question texts.
 */
function calculateQuestionSimilarity(q1 = '', q2 = '') {
  const norm1 = normalizeForSimilarity(q1);
  const norm2 = normalizeForSimilarity(q2);
  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    if (Math.min(norm1.length, norm2.length) > 20) return 0.85;
  }
  const words1 = new Set(norm1.split(' ').filter(w => w.length > 3));
  const words2 = new Set(norm2.split(' ').filter(w => w.length > 3));
  if (words1.size === 0 || words2.size === 0) return 0;
  let intersection = 0;
  for (let w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Checks if candidate question is a duplicate of any already accepted question or avoided question.
 */
function isQuestionDuplicate(candidateText, acceptedQuestions = [], avoidList = [], threshold = 0.58) {
  if (!candidateText || candidateText.trim().length < 8) return true;
  const candNorm = normalizeForSimilarity(candidateText);
  for (const item of acceptedQuestions) {
    const itemText = typeof item === 'string' ? item : item.question;
    if (calculateQuestionSimilarity(candNorm, itemText) >= threshold) return true;
  }
  for (const avoided of avoidList) {
    if (calculateQuestionSimilarity(candNorm, avoided) >= threshold) return true;
  }
  return false;
}

/**
 * Ensures correctIndex strictly corresponds to the answer explained in explanation.
 */
function alignCorrectIndexWithExplanation(options, correctIndex, explanation, questionText = '') {
  if (!explanation || !Array.isArray(options) || options.length === 0) {
    return (correctIndex >= 0 && correctIndex < options.length) ? correctIndex : 0;
  }
  const normExp = normalizeForSimilarity(explanation);
  const normQ = normalizeForSimilarity(questionText);
  let bestIdx = (correctIndex >= 0 && correctIndex < options.length) ? correctIndex : 0;
  let highestScore = -999;

  options.forEach((opt, idx) => {
    const optNorm = normalizeForSimilarity(opt);
    if (optNorm.length < 2) return;

    let score = 0;
    
    // Explicit answer patterns in explanation
    const explicitPatterns = [
      `bonne reponse est ${optNorm}`,
      `reponse est ${optNorm}`,
      `reponse exacte est ${optNorm}`,
      `reponse correcte est ${optNorm}`,
      `est « ${optNorm} »`,
      `est "${optNorm}"`,
      `est '${optNorm}'`,
      `est ${optNorm}`,
      `c est ${optNorm}`,
      `c'est ${optNorm}`,
      `donc ${optNorm}`,
      `egal a ${optNorm}`,
      `il s agit de ${optNorm}`,
      `il s agit du ${optNorm}`,
      `il s agit d une ${optNorm}`,
      `il s agit d un ${optNorm}`
    ];

    let hasExplicitMarker = false;
    for (const pat of explicitPatterns) {
      if (normExp.includes(pat)) {
        score += 300;
        hasExplicitMarker = true;
        break;
      }
    }

    if (normExp.includes(optNorm)) {
      score += optNorm.length * 4;
      const pos = normExp.indexOf(optNorm);
      score += Math.min(40, pos);
    }

    // Penalize if this option text is just an exact verbatim substring from the question prompt
    // and DOES NOT have an explicit answer marker in explanation
    // (e.g. question asks for antonyme of "heureux", so "heureux" is in the prompt and quoted in explanation!)
    if (normQ && normQ.includes(optNorm) && !hasExplicitMarker) {
      score -= 120;
    }

    // Give slight bias to the original index chosen by the model if plausible
    if (idx === correctIndex && score > 0) {
      score += 25;
    }

    if (score > highestScore) {
      highestScore = score;
      bestIdx = idx;
    }
  });

  return bestIdx;
}

/**
 * Contextual distractors to pad 2-3 valid AI options to 4 instead of dropping valid AI questions.
 */
function getSubjectPaddedDistractors(subjectKey, isArabic, isEnglish, isPrimaire1 = false) {
  if (isPrimaire1) {
    if (isArabic) {
      return ['خِيَارٌ آخَر', 'إِجَابَةٌ أُخْرَى', 'لَا شَيْء مِمَّا سَبَق', 'خِيَارٌ ثَالِث'];
    }
    if (isEnglish) {
      return ['Other', 'None', 'Something else', 'Not this'];
    }
    if (subjectKey === 'math') {
      return ['1', '6', '7', '0'];
    }
    return ['Autre', 'Rien', 'Un autre mot', 'Aucun'];
  }
  if (isArabic) {
    return ['جميع ما سبق غير صحيح', 'لا توجد إجابة صحيحة مما ذُكر', 'حالة استثنائية أخرى', 'لا شيء مما سبق'];
  }
  if (isEnglish) {
    return ['None of the above choices', 'All of the choices are correct', 'This form does not change', 'Not applicable in this sentence'];
  }
  if (subjectKey === 'math' || subjectKey === 'physique_chimie') {
    return ['Aucune des valeurs proposées', 'Données insuffisantes pour répondre', 'Le résultat est indéterminé', 'Valeur indéterminée'];
  }
  return ['Tous les choix ci-dessus sont corrects', 'Aucun de ces termes ne convient', 'Cette forme est invariable', 'Autre règle grammaticale'];
}

function cleanCongratulatoryPrefix(text) {
  if (!text) return '';
  return String(text)
    .replace(/^(bravo|félicitations|felicitations|bien joué|super|excellent|très bien|tres bien|well done|great job)\s*[!.:,-]*\s*/i, '')
    .replace(/^(أحسنت|ممتاز|بارك الله فيك|رائع|عمل رائع)\s*[!.:,-،]*\s*/u, '')
    .trim();
}

/**
 * Semantic consistency gate: detects logical contradictions between the question
 * text and the option marked as correct by Ollama.
 *
 * Returns:
 *  - the corrected correctIndex if we can auto-fix it
 *  - the original correctIndex if no issue detected
 *  - null  if the question is fundamentally broken and must be discarded
 */
function sanitizedSemanticCheck(questionText, options, correctIndex, isPrimaire1 = false) {
  if (!questionText || !Array.isArray(options) || options.length === 0) return correctIndex;

  const qLow = questionText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // ── RULE 1: "commence par la lettre X" / "begin with letter X" ──────────────
  // The correct answer MUST start with that letter (case-insensitive, ignore accents)
  const letterMatch =
    qLow.match(/commence par la lettre\s+[«"']?([a-z])[»"']?/i) ||
    qLow.match(/commence par\s+[«"']?([a-z])[»"']?/i) ||
    qLow.match(/begin(?:ning)? with(?: the)?(?: letter)?\s+[«"']?([a-z])[»"']?/i) ||
    qLow.match(/starts? with(?: the)?(?: letter)?\s+[«"']?([a-z])[»"']?/i);

  if (letterMatch) {
    const targetLetter = letterMatch[1].toUpperCase();
    const normalize = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Find the option(s) that genuinely start with targetLetter
    const validIndices = options
      .map((opt, i) => ({ opt: normalize(opt), i }))
      .filter(({ opt }) => opt.toUpperCase().startsWith(targetLetter));

    if (validIndices.length === 0) {
      // No option starts with the target letter → question is garbage, discard
      console.warn(`[SemanticCheck] Discarding: no option starts with '${targetLetter}' — Q: ${questionText}`);
      return null;
    }

    const currentOpt = normalize(options[correctIndex] || '');
    if (!currentOpt.toUpperCase().startsWith(targetLetter)) {
      // Current correctIndex is wrong → auto-fix to first matching option
      const fixedIdx = validIndices[0].i;
      console.warn(`[SemanticCheck] Auto-corrected correctIndex ${correctIndex}→${fixedIdx}: '${options[correctIndex]}' doesn't start with '${targetLetter}' — Q: ${questionText}`);
      return fixedIdx;
    }
    return correctIndex;
  }

  // ── RULE 2: "est une voyelle" / "is a vowel" ────────────────────────────────
  // The correct answer must be a known vowel letter (A E I O U Y)
  const vowelQ =
    qLow.includes('voyelle') ||
    qLow.includes('vowel');

  if (vowelQ && isPrimaire1) {
    const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);
    const normalize = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
    const currentOpt = normalize(options[correctIndex] || '');

    if (currentOpt.length <= 2 && !VOWELS.has(currentOpt)) {
      // Marked answer is NOT a vowel → look for one in options
      const fixIdx = options.findIndex(opt => VOWELS.has(normalize(opt)));
      if (fixIdx >= 0) {
        console.warn(`[SemanticCheck] Auto-corrected vowel answer: '${options[correctIndex]}' → '${options[fixIdx]}'`);
        return fixIdx;
      }
      // No vowel found among options → discard
      console.warn(`[SemanticCheck] Discarding vowel question — no valid vowel among options`);
      return null;
    }
    return correctIndex;
  }

  // ── RULE 3: "combien font A + B" or "combien font A - B" ────────────────────
  // For simple arithmetic CP questions, verify the numeric answer matches
  const arithMatch =
    qLow.match(/combien font\s+(\d+)\s*\+\s*(\d+)/) ||
    qLow.match(/combien font\s+(\d+)\s*-\s*(\d+)/);

  if (arithMatch && isPrimaire1) {
    const [, aStr, bStr] = arithMatch;
    const a = parseInt(aStr, 10);
    const b = parseInt(bStr, 10);
    const isSubtraction = qLow.includes('-');
    const expected = isSubtraction ? a - b : a + b;

    const normalize = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const currentOpt = normalize(options[correctIndex] || '');

    if (parseInt(currentOpt, 10) !== expected) {
      // Marked answer is arithmetically wrong → auto-fix
      const fixIdx = options.findIndex(opt => parseInt(normalize(opt), 10) === expected);
      if (fixIdx >= 0) {
        console.warn(`[SemanticCheck] Auto-corrected arithmetic: ${a}${isSubtraction?'-':'+'}${b}=${expected}, was '${options[correctIndex]}'`);
        return fixIdx;
      }
      console.warn(`[SemanticCheck] Discarding arithmetic question — correct value ${expected} not among options`);
      return null;
    }
    return correctIndex;
  }

  // ── RULE 4: "nombre de syllabes" ────────────────────────────────────────────
  // Matches any phrasing that includes a hyphenated syllabified word:
  //   "Combien de syllabes a le mot 'ba-na-ne' ?"
  //   "Combien de syllabes entend-on dans « ba-na-ne » ?"
  // Strategy: prefer the hyphenated word inside quotes or after "mot", else the
  // last hyphenated token in the question. Skip liaison words (entend-on, dit-il…).
  const LIAISON_WORDS = new Set([
    'entend-on', 'dit-il', 'dit-elle', 'a-t-il', 'a-t-elle', 'est-ce',
    'n-est', 'n-y', 'peut-on', 'doit-on', 'va-t-il', 'va-t-elle',
    'sont-ils', 'sont-elles', 'trouve-t-on', 'voit-on', 'lit-on'
  ]);
  const syllabeQ = qLow.includes('syllabe');
  if (syllabeQ) {
    // Priority 1: word inside quotes (« », " ", ' ')
    let hyphenWord = null;
    const quotedMatch = questionText.match(/[«"'`\u2018\u2019\u201C\u201D]([\wÀ-ÿ]+-[\wÀ-ÿ]+(?:-[\wÀ-ÿ]+)*)[»"'`\u2018\u2019\u201C\u201D]/);
    if (quotedMatch) {
      hyphenWord = quotedMatch[1];
    }

    // Priority 2: word after "mot" keyword
    if (!hyphenWord) {
      const motMatch = questionText.match(/\b(?:le mot|du mot|au mot|mot)\s+[«"'`]?([\wÀ-ÿ]+-[\wÀ-ÿ]+(?:-[\wÀ-ÿ]+)*)/i);
      if (motMatch) hyphenWord = motMatch[1];
    }

    // Priority 3: all hyphenated tokens, skip known liaison words, take the last one
    if (!hyphenWord) {
      const allHyphens = [...questionText.matchAll(/\b([\wÀ-ÿ]+-[\wÀ-ÿ]+(?:-[\wÀ-ÿ]+)*)\b/g)];
      for (let m of allHyphens.reverse()) {
        if (!LIAISON_WORDS.has(m[1].toLowerCase())) {
          hyphenWord = m[1];
          break;
        }
      }
    }

    if (hyphenWord) {
      const expectedCount = (hyphenWord.match(/-/g) || []).length + 1;
      const normalize = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const currentOpt = normalize(options[correctIndex] || '');
      const currentNum = parseInt(currentOpt, 10);

      if (!isNaN(currentNum) && currentNum !== expectedCount) {
        const fixIdx = options.findIndex(opt => parseInt(normalize(opt), 10) === expectedCount);
        if (fixIdx >= 0) {
          console.warn(`[SemanticCheck] Auto-corrected syllabe count in '${hyphenWord}': expected ${expectedCount}, was '${options[correctIndex]}'`);
          return fixIdx;
        }
        console.warn(`[SemanticCheck] Discarding syllabe question — correct count ${expectedCount} not among options (word: '${hyphenWord}')`);
        return null;
      }
    }
    return correctIndex;
  }

  // No semantic rule triggered → accept as-is
  return correctIndex;
}

/**
 * Cleans options and ensures NO dummy placeholders ('Choix 1', empty, etc.) reach the student.
 * If 2 or 3 valid options are generated by Ollama, pads them to 4 to preserve the AI question.
 * Returns null if the AI candidate question is structurally unusable.
 */
function sanitizeQuestionOptions(q, defaultTopic, subjectKey, targetDifficulty, isPrimaire1 = false) {
  let questionText = (q && q.question ? String(q.question) : '').trim();
  let explanationText = cleanCongratulatoryPrefix(q && q.explanation ? String(q.explanation) : '');
  let topicText = (q && q.topic ? String(q.topic) : defaultTopic).trim();

  let raw = q ? q.options : null;
  let candidateList = [];

  if (Array.isArray(raw)) {
    candidateList = raw.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return item.text || item.label || item.value || item.option || item.choice || Object.values(item)[0] || '';
      }
      return String(item || '');
    });
  } else if (typeof raw === 'object' && raw !== null) {
    candidateList = Object.values(raw).map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return item.text || item.label || item.value || item.option || Object.values(item)[0] || '';
      }
      return String(item || '');
    });
  }

  const cleanedOpts = [];
  for (let opt of candidateList) {
    let s = String(opt || '').trim();
    s = s.replace(/^[A-Da-d\d]\s*[:.)\-]\s*/, '')
         .replace(/^choix\s*\d+\s*[:.)\-]?\s*/i, '')
         .replace(/^option\s*[a-d\d]+\s*[:.)\-]?\s*/i, '')
         .trim();

    // Preserve single digits (e.g. '3', '5') and letters (e.g. 'A') for CP math and reading
    if (!s || s.length < 1) continue;
    if (/^(choix|option|reponse|réponse)\s*[a-d\d]?$/i.test(s)) continue;

    if (!cleanedOpts.includes(s)) {
      cleanedOpts.push(s);
    }
  }

  const isArabic = subjectKey === 'arabe' || subjectKey === 'education_islamique' || /[\u0600-\u06FF]/.test(questionText);
  const isEnglish = subjectKey === 'anglais';

  // If Ollama produced 2 or 3 distinct options, pad to 4 rather than dropping the AI question
  if (cleanedOpts.length >= 2 && cleanedOpts.length < 4) {
    const distractors = getSubjectPaddedDistractors(subjectKey, isArabic, isEnglish, isPrimaire1);
    for (const d of distractors) {
      if (cleanedOpts.length >= 4) break;
      if (!cleanedOpts.includes(d)) cleanedOpts.push(d);
    }
  }

  const minQLen = isPrimaire1 ? 5 : 8;
  if (!questionText || questionText.length < minQLen || cleanedOpts.length < 4) {
    return null;
  }

  let cIdx = 0;
  if (typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < cleanedOpts.length) {
    cIdx = q.correctIndex;
  }
  cIdx = alignCorrectIndexWithExplanation(cleanedOpts, cIdx, explanationText, questionText);

  // ── Semantic consistency check ──────────────────────────────────────────────
  // Detect common Ollama hallucination: "Quel mot commence par X?" but correct
  // answer does not start with X, or "Quelle voyelle?" but answer is a consonant.
  const sanitizedCorrect = sanitizedSemanticCheck(questionText, cleanedOpts, cIdx, isPrimaire1);
  if (sanitizedCorrect === null) {
    // Question is semantically broken and cannot be auto-corrected → discard it
    return null;
  }
  cIdx = sanitizedCorrect;
  // ─────────────────────────────────────────────────────────────────────────────

  return randomizeQuestionOptions({
    question: questionText,
    options: cleanedOpts.slice(0, 4),
    correctIndex: cIdx,
    explanation: explanationText || 'Explication pédagogique claire de la bonne réponse.',
    topic: topicText
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL QUIZ GENERATOR (Infinite Calibrated Supply)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates subject-specific procedural questions (computations, principles, definitions)
 * ensuring 100% mathematical guarantee of reaching requested count without repetition.
 */
function generateProceduralQuizQuestions(subjectKey, targetDifficulty, neededCount, existingQuestions = [], isPrimaire1 = false) {
  const generated = [];
  const existingTexts = existingQuestions.map(q => (q.question || '').toLowerCase().slice(0, 30));

  const addIfUnique = (item) => {
    const txt = (item.question || '').toLowerCase().slice(0, 30);
    if (!existingTexts.includes(txt)) {
      existingTexts.push(txt);
      generated.push(item);
      return true;
    }
    return false;
  };

  if (isPrimaire1) {
    const pairs = [
      [1, 1], [2, 1], [1, 2], [2, 2], [3, 1], [1, 3],
      [3, 2], [2, 3], [4, 1], [1, 4], [3, 3], [4, 2],
      [5, 1], [2, 4], [5, 2], [3, 4], [4, 3], [6, 1]
    ];
    for (let [a, b] of pairs) {
      if (generated.length >= neededCount) break;
      const sum = a + b;
      addIfUnique({
        topic: 'Petite addition (CP)',
        question: `Combien font ${a} + ${b} ?`,
        options: [`${sum}`, `${sum + 1}`, `${Math.max(1, sum - 1)}`, `${sum + 2}`],
        correctIndex: 0,
        explanation: `${a} + ${b} est égal à ${sum}.`
      });
    }
    return generated;
  }

  if (subjectKey === 'gestion') {
    // 1. Calcul de TVA
    const htValues = [400, 650, 800, 1200, 1500, 2400, 3200, 4500, 5000, 6400, 7500];
    for (let ht of htValues) {
      if (generated.length >= neededCount) break;
      const tva = Math.round(ht * 0.20);
      addIfUnique({
        topic: 'Calculs commerciaux et TVA',
        question: `Une facture d'achat de marchandises s'élève à ${ht.toLocaleString('fr-FR')} € HT avec un taux de TVA normal de 20%. Quel est le montant exact de la TVA ?`,
        options: [
          `${tva.toLocaleString('fr-FR')} €`,
          `${(tva + 50).toLocaleString('fr-FR')} €`,
          `${(tva - 40).toLocaleString('fr-FR')} €`,
          `${(ht + tva).toLocaleString('fr-FR')} €`
        ],
        correctIndex: 0,
        explanation: `Montant de la TVA = Montant HT × 20% = ${ht.toLocaleString('fr-FR')} € × 0,20 = ${tva.toLocaleString('fr-FR')} €.`
      });
    }

    // 2. Calcul TTC
    const ttcHtValues = [350, 500, 750, 1100, 1600, 2500, 3800, 4200, 5600];
    for (let ht of ttcHtValues) {
      if (generated.length >= neededCount) break;
      const ttc = Math.round(ht * 1.20);
      addIfUnique({
        topic: 'Facturation et Prix TTC',
        question: `Un client professionnel acquiert un bien facturé ${ht.toLocaleString('fr-FR')} € HT (TVA à 20%). Quel montant total TTC doit-il payer ?`,
        options: [
          `${ttc.toLocaleString('fr-FR')} € TTC`,
          `${ht.toLocaleString('fr-FR')} € TTC`,
          `${(ttc + 120).toLocaleString('fr-FR')} € TTC`,
          `${Math.round(ht * 1.10).toLocaleString('fr-FR')} € TTC`
        ],
        correctIndex: 0,
        explanation: `Prix TTC = Prix HT × 1,20 = ${ht.toLocaleString('fr-FR')} € × 1,20 = ${ttc.toLocaleString('fr-FR')} € TTC.`
      });
    }

    // 3. Marge brute et coefficient
    const paValues = [80, 150, 220, 350, 480, 600, 850, 1100];
    for (let pa of paValues) {
      if (generated.length >= neededCount) break;
      const marge = Math.round(pa * 0.5);
      const pv = pa + marge;
      addIfUnique({
        topic: 'Marge commerciale brute',
        question: `Un commerçant achète un produit pour un coût d'achat de ${pa} € HT et le commercialise au prix de vente de ${pv} € HT. Quelle marge brute unitaire réalise-t-il ?`,
        options: [
          `${marge} €`,
          `${marge + 30} €`,
          `${marge - 20} €`,
          `${pv + pa} €`
        ],
        correctIndex: 0,
        explanation: `Marge commerciale brute = Prix de vente HT - Coût d'achat HT = ${pv} € - ${pa} € = ${marge} €.`
      });
    }

    // 4. Remise commerciale
    const remiseTotals = [600, 1000, 1500, 2000, 3000, 4000, 5000];
    for (let tot of remiseTotals) {
      if (generated.length >= neededCount) break;
      const pct = 10;
      const red = Math.round(tot * pct / 100);
      const net = tot - red;
      addIfUnique({
        topic: 'Négociation et réductions commerciales',
        question: `Sur une commande brute de ${tot.toLocaleString('fr-FR')} € HT, un fournisseur accorde une remise commerciale de ${pct}%. Quel est le net commercial facturé ?`,
        options: [
          `${net.toLocaleString('fr-FR')} €`,
          `${tot.toLocaleString('fr-FR')} €`,
          `${(net - 100).toLocaleString('fr-FR')} €`,
          `${(tot + red).toLocaleString('fr-FR')} €`
        ],
        correctIndex: 0,
        explanation: `Remise de ${pct}% = ${red.toLocaleString('fr-FR')} €. Net commercial = ${tot.toLocaleString('fr-FR')} € - ${red.toLocaleString('fr-FR')} € = ${net.toLocaleString('fr-FR')} €.`
      });
    }

    // 5. Seuil de rentabilité
    const cfList = [12000, 24000, 36000, 48000, 60000, 80000];
    for (let cf of cfList) {
      if (generated.length >= neededCount) break;
      const tmscv = 30;
      const sr = Math.round(cf / (tmscv / 100));
      addIfUnique({
        topic: 'Gestion prévisionnelle - Seuil de rentabilité',
        question: `Une entreprise a des charges fixes de ${cf.toLocaleString('fr-FR')} € et un taux de marge sur coût variable de ${tmscv}%. Quel chiffre d'affaires minimal doit-elle réaliser pour atteindre l'équilibre (point mort) ?`,
        options: [
          `${sr.toLocaleString('fr-FR')} €`,
          `${(sr + 20000).toLocaleString('fr-FR')} €`,
          `${(cf * 2).toLocaleString('fr-FR')} €`,
          `${(sr - 15000).toLocaleString('fr-FR')} €`
        ],
        correctIndex: 0,
        explanation: `Seuil de rentabilité = Charges fixes / Taux MSCV = ${cf.toLocaleString('fr-FR')} € / 0,30 = ${sr.toLocaleString('fr-FR')} €.`
      });
    }
  } else if (subjectKey === 'math') {
    const aVals = [2, 3, 4, 5, 6, 7];
    for (let a of aVals) {
      if (generated.length >= neededCount) break;
      const sol = Math.floor(Math.random() * 8) + 3;
      const b = 5;
      const c = a * sol + b;
      addIfUnique({
        topic: 'Résolution d\'équations',
        question: `Résolvez dans ℝ l'équation : ${a}x + ${b} = ${c}. Quelle est la valeur de x ?`,
        options: [`x = ${sol}`, `x = ${sol + 2}`, `x = ${sol - 1}`, `x = ${sol * 2}`],
        correctIndex: 0,
        explanation: `${a}x = ${c} - ${b} = ${c - b}, donc x = ${c - b} / ${a} = ${sol}.`
      });
    }
  }

  // Fill remainder from banks if any slots remain
  let index = 0;
  const allKnownBank = QUIZ_BANKS_BY_SUBJECT[subjectKey]?.[targetDifficulty] ||
                       QUIZ_BANKS_BY_SUBJECT[subjectKey]?.['Débutant'] ||
                       QUIZ_BANKS_BY_SUBJECT['gestion']['Intermédiaire'] ||
                       QUIZ_BANKS_BY_SUBJECT['gestion']['Débutant'];

  while (generated.length < neededCount && index < allKnownBank.length * 3) {
    const item = allKnownBank[index % allKnownBank.length];
    index++;
    if (item) {
      addIfUnique({ ...item });
    }
  }

  return generated;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED AI FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates dynamic QCM questions for a student using Ollama, with smart batching up to 10-15 questions.
 */
async function generateAiQuiz({ subject, topic, level, difficulty = 'Débutant', count = 10, avoidQuestions = [] }, studentContext = {}) {
  const targetSubject = subject || 'Français';
  const targetLevel = level || studentContext?.student?.education_level || '1ère année primaire';
  const tier = detectEducationTier(targetLevel);
  const isPrimaire1 = tier === 'primaire_1';
  const targetDifficulty = ['Débutant', 'Intermédiaire', 'Avancé'].includes(difficulty) ? difficulty : (isPrimaire1 ? 'Débutant' : 'Débutant');
  const studentName = studentContext?.student?.first_name || 'l\'élève';
  const subjectKey = normalizeSubject(targetSubject);
  const avoidList = (avoidQuestions || []).filter(Boolean);

  // Target count requested (5, 10, or 15 questions)
  const finalCount = Math.max(3, Math.min(15, count || 10));
  // Request 1 extra question to guarantee reaching finalCount even if 1 is filtered
  const countToPrompt = Math.min(15, finalCount + 1);

  // Determine pedagogical blueprint targets to ensure diversity & zero repetitive phrasing
  let targets = [];
  if (topic && topic.trim().length > 3 && !topic.toLowerCase().includes('général') && !topic.toLowerCase().includes('notions clés')) {
    targets = generateTopicTargets(topic.trim(), countToPrompt, subjectKey);
  } else {
    const bps = getBlueprintsForLevelAndSubject(targetLevel, subjectKey);
    targets = bps.slice(0, countToPrompt);
  }

  const isArabic = subjectKey === 'arabe' || subjectKey === 'education_islamique';
  const isEnglish = subjectKey === 'anglais';

  const diffGuidance = {
    'Débutant': `🎯 DIRECTIVE IMPÉRATIVE DE DIFFICULTÉ : [NIVEAU DÉBUTANT - SIMPLE, INTUITIF ET LOGIQUE]
- Tu t'adresses à un débutant complet dans la matière !
- Pose des questions TRÈS SIMPLES, CONCRÈTES, FONDÉES SUR LE BON SENS et les notions élémentaires du quotidien.
- STRICTEMENT AUCUN calcul complexe et AUCUN jargon technique abscons.
- Vocabulaire limpide et accessible.
- RÈGLE FONDAMENTALE : Les 4 options doivent être des phrases ou mots clairs et explicites.
  INTERDICTION FORMELLE d'écrire "Choix 1", "Choix 2", "Option A", "B". Rédige de vraies propositions réelles.
- La bonne réponse doit être évidente pour quelqu'un ayant compris le principe de base sans piège.
- Les 3 mauvaises réponses doivent être simples et clairement fausses sans subtilité trompeuse.`,

    'Intermédiaire': `🎯 DIRECTIVE IMPÉRATIVE DE DIFFICULTÉ : [NIVEAU INTERMÉDIAIRE - APPLICATION DU COURS]
- Questions d'application classique des règles et notions du programme officiel.
- Utilise les termes techniques usuels du cours.
- Calculs simples en 1 ou 2 étapes.
- RÈGLE FONDAMENTALE : 4 propositions complètes et rédigées (INTERDICTION de "Choix 1", "Option A").`,

    'Avancé': `🎯 DIRECTIVE IMPÉRATIVE DE DIFFICULTÉ : [NIVEAU AVANCÉ / EXPERT - HAUT NIVEAU & RÉFLEXION]
- Questions d'analyse approfondie, cas particuliers, pièges de raisonnement et synthèse de niveau concours.
- RÈGLE FONDAMENTALE : 4 propositions complètes et rédigées (INTERDICTION de "Choix 1", "Option A").`
  }[targetDifficulty];

  const formattedBlueprint = targets.map((t, idx) => `Point ${idx + 1} : ${t}`).join('\n');

  let systemPrompt = '';
  let userPrompt = '';

  if (isArabic) {
    if (isPrimaire1) {
      systemPrompt = `أنت Tuteur IA، أستاذ بيداغوجي صبور ومحبب لتلاميذ السنة الأولى ابتدائي (عمر التلميذ: 6 سنوات).
يجب عليك توليد اختبار أسئلة متعددة الاختيارات (QCM) مبسط جداً لـ ${studentName} في مادة ${targetSubject}.

المواضيع والمفاهيم المستهدفة:
${formattedBlueprint}

قواعد بيداغوجية صارمة وخاصة بالسنة الأولى ابتدائي (1ère année primaire / CP) :
1. السن والمستوى: تلميذ في سن 6 سنوات يتعلم مبادئ القراءة والكتابة والحساب الأولي.
2. نص السؤال: جملة قصيرة جداً (3 إلى 6 كلمات فقط) ومشكولة تماماً بالحركات (الفتحة، الضمة، الكسرة، السكون). مثال: « مَا هُوَ الحَرْفُ الأَوَّلُ فِي كَلِمَةِ «دَار» ؟ » أو « نَقُولُ: (هَذَا وَلَدٌ) أَمْ (هَذِهِ وَلَدٌ) ؟ ».
3. الخيارات الأربعة: كل خيار في "options" يجب أن يكون كلمة واحدة فقط أو كلمتين سهلتين مشكولتين.
4. ممنوع منعاً باتاً: الإعراب، القواعد النحوية المعقدة، المفعول به، النواسخ، الجمل الطويلة الصعبة.
5. دقة الإجابة: "correctIndex" (من 0 إلى 3) يجب أن يشير بدقة إلى الخيار الصحيح في "options".
6. التفسير: تفسير بسيط جداً وموضوعي يشرح الإجابة الصحيحة (مثال: «كلمة دار تبدأ بحرف الدال»). ممنوع منعاً باتاً كتابة "أحسنت" أو "ممتاز" داخل التفسير لأن التفسير يعرض للتلميذ حتى في حال الخطأ.

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "topic": "${topic || targetSubject}",
  "questions": [
    {
      "question": "نص السؤال القصير والمشكول...",
      "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
      "correctIndex": 0,
      "explanation": "الإجابة الصحيحة هي [...] لأن [...]"
    }
  ]
}`;
      userPrompt = `قم بتوليد ${targets.length} أسئلة QCM سهلة جداً ومشجعة ومشكولة لتلميذ عمره 6 سنوات بالأولى ابتدائي.`;
    } else {
      systemPrompt = `أنت Tuteur IA، أستاذ بيداغوجي ذكي ومساعد تعليمي للمناهج الدراسية بالمغرب.
يجب عليك توليد اختبار أسئلة متعددة الاختيارات (QCM) لـ ${studentName} في مادة ${targetSubject} (${targetDifficulty}).

المواضيع والمفاهيم المستهدفة:
${formattedBlueprint}

قواعد بيداغوجية صارمة وإلزامية:
1. ممنوع منعاً باتاً نسخ عناوين النقاط في نص السؤال! يجب صياغة سؤال تطبيقي واقعي مع جملة توضيحية مشكولة (مثال: «في جُمْلَةِ: «قَرَأَ الطَّالِبُ القِصَّةَ»، مَا هُوَ الفَاعِلُ؟»).
2. شكل تام: اضبط السؤال والاختيارات بالحركات التامة (الفتحة، الضمة، الكسرة، السكون).
3. 4 خيارات حقيقية: مصفوفة "options" يجب أن تضم بالضبط 4 خيارات واضحة ومختلفة (يمنع الخيارات الناقصة أو المكررة).
4. دقة الإجابة: "correctIndex" (من 0 إلى 3) يجب أن يشير بدقة إلى الخيار الصحيح في "options".
5. التفسير: في "explanation"، اكتب: «الإجابة الصحيحة هي [...] لأن...».

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "topic": "${topic || targetSubject}",
  "questions": [
    {
      "question": "نص السؤال المشكول مع المثال...",
      "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
      "correctIndex": 0,
      "explanation": "الإجابة الصحيحة هي [...] لأن..."
    }
  ]
}`;
      userPrompt = `قم بتوليد ${targets.length} أسئلة QCM تطبيقية مشكولة ومتميزة وفق القواعد أعلاه دون تكرار أي عنوان.`;
    }
  } else if (isEnglish) {
    if (isPrimaire1) {
      systemPrompt = `You are TutorAI, a friendly and gentle primary school tutor for a 6-year-old child in 1st Grade Primary (Moroccan school).
Generate a very simple, cheerful multiple-choice quiz (MCQ) for ${studentName} in ${targetSubject}.

TARGET BLUEPRINT:
${formattedBlueprint}

STRICT CP / 1ST GRADE RULES:
1. 6-YEAR-OLD CHILD LEVEL: Super simple, direct questions (5 to 8 words maximum).
2. TOPICS: Numbers 1 to 5, primary colors (red, blue, yellow, green), familiar animals (cat, dog), simple greetings (Hello, Goodbye).
3. FORBIDDEN: Complex grammar, past tenses, long texts, difficult words.
4. OPTIONS: Exactly 4 short, 1-word options per question.

MANDATORY JSON FORMAT:
{
  "topic": "${topic || targetSubject}",
  "questions": [
    {
      "question": "Short simple question...",
      "options": ["Opt1", "Opt2", "Opt3", "Opt4"],
      "correctIndex": 0,
      "explanation": "Great job! The correct answer is..."
    }
  ]
}`;
      userPrompt = `Generate exactly ${targets.length} very simple questions for a 6-year-old child in 1st Grade Primary.`;
    } else {
      systemPrompt = `You are TutorAI, an expert AI pedagogical tutor.
Generate a complete interactive multiple-choice quiz (MCQ) for ${studentName} in ${targetSubject} (${targetDifficulty} level).

MANDATORY PEDAGOGICAL BLUEPRINT — COVER EACH TARGET POINT WITH 1 UNIQUE QUESTION:
${formattedBlueprint}

CRITICAL RULES:
1. DO NOT copy the blueprint titles! Write full, real, concrete questions with practical examples.
2. 100% DIVERSITY: Zero duplicate sentence structures or phrasing patterns.
3. EXACTLY 4 DISTINCT OPTIONS: Every question MUST have 4 descriptive answer choices in "options". NEVER use dummy labels like "Option A" or "Choice 1".
4. STRICT ALIGNMENT: "correctIndex" (0, 1, 2, or 3) MUST point directly to the correct answer in "options".
5. EXPLANATION: Provide a clear 1-2 sentence pedagogical explanation in "explanation".

MANDATORY JSON FORMAT:
{
  "topic": "${topic || targetSubject}",
  "questions": [
    {
      "question": "Full clear question text...",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correctIndex": 0,
      "explanation": "Clear explanation of why this answer is correct..."
    }
  ]
}`;
      userPrompt = `Generate exactly ${targets.length} distinct MCQ questions covering each point of the curriculum blueprint.`;
    }
  } else {
    if (isPrimaire1) {
      systemPrompt = `Tu es TutorAI, tuteur pédagogique bienveillant et encourageant pour un enfant de 6 ans en 1ère année primaire (CP - 1ère AP au Maroc).
Tu dois créer un quiz QCM très doux, visuel, intuitif et parfaitement adapté à son âge pour ${studentName}.
Matière : ${targetSubject}
Niveau : 1ère année primaire (CP - 6 ans)

PLAN PÉDAGOGIQUE POUR LE CP :
${formattedBlueprint}

DIRECTIVES IMPÉRATIVES DE NIVEAU POUR UN ÉLÈVE DE 1ÈRE ANNÉE PRIMAIRE (CP - 6 ANS) :
1. ÉNONCÉS ULTRA-COURTS : 6 à 12 mots simples maximum. Vocabulaire du quotidien d'un enfant de 6 ans (école, animaux, fruits, jouets, famille, maison).
2. EN MATHÉMATIQUES CP :
   - Strictement limité aux nombres de 1 à 10.
   - Dénombrement d'objets, suite des nombres (qui vient après/avant), comparaison (plus grand/petit).
   - Petites additions sous 10 uniquement (ex: 2 + 1 = 3, 3 + 2 = 5).
   - Formes géométriques simples (rond/cercle, carré, triangle).
   - STRICTEMENT INTERDIT : multiplications (ex: 6×3), divisions, fractions (ex: 2/4), pourcentages, équations avec x, calculs complexes.
3. EN FRANÇAIS CP :
   - Reconnaissance des lettres (alphabet), voyelles (a, e, i, o, u), son initial des mots familiers.
   - Articles simples (un / une, le / la).
   - Mots du quotidien (chat, chien, pomme, maman, table).
   - STRICTEMENT INTERDIT : passé composé, imparfait, futur, COD/COI, subjonctif, grammaire abstraite.
4. EN ÉVEIL SCIENTIFIQUE (SVT) CP :
   - Les 5 sens (yeux pour voir, oreilles pour entendre, nez pour sentir, langue pour goûter, mains pour toucher).
   - Le jour et la nuit, les bébés animaux (chiot, poussin), l'hygiène (se laver les mains avec du savon, se brosser les dents).
5. EXACTEMENT 4 OPTIONS TRÈS COURTES : 1 ou 2 mots simples par option dans "options" (ex: "3", "4", "2", "5" ou "Un chat", "Un chien", "Un oiseau", "Un poisson").
6. EXPLICATION : Une phrase courte et pédagogique expliquant la bonne réponse (« La bonne réponse est ... car ... »). STRICTEMENT INTERDIT d'écrire "Bravo" ou "Félicitations" dans l'explication, car elle est également affichée quand l'élève commet une erreur.

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "topic": "${topic || targetSubject}",
  "questions": [
    {
      "question": "Énoncé court et facile pour un enfant de 6 ans",
      "options": ["Mot 1", "Mot 2", "Mot 3", "Mot 4"],
      "correctIndex": 0,
      "explanation": "La bonne réponse est [...] car [...]"
    }
  ]
}`;
      userPrompt = `Génère exactement les ${targets.length} questions faciles et adaptées à un enfant de 6 ans en 1ère primaire.`;
    } else {
      systemPrompt = `Tu es TutorAI, tuteur pédagogique personnel intelligent.
Tu dois générer un quiz QCM interactif et formateur pour ${studentName}.
Matière : ${targetSubject}
Niveau scolaire : ${targetLevel}
Difficulté cible : ${targetDifficulty.toUpperCase()}
${diffGuidance}

PLAN PÉDAGOGIQUE IMPÉRATIF — COUVRE CHAQUE POINT DU PLAN SUIVANT (1 QUESTION DISTINCTE PAR POINT) :
${formattedBlueprint}

RÈGLES CAPITALES STRICTES :
1. NE RECOPIE PAS les consignes ou titres du plan ! Rédige un VRAI ÉNONCÉ concret, direct et complet pour l'élève avec des exemples réels (ex: « Dans la phrase : ... », « Calculez : ... », « Quel est... »).
2. DIVERSITÉ ABSOLUE : Chaque question a sa propre formulation. STRICTEMENT AUCUN copier-coller ni répétition de structure de phrase.
3. EXACTEMENT 4 OPTIONS DISTINCTES : Chaque question DOIT obligatoirement avoir 4 propositions de réponse complètes et rédigées en toutes lettres dans "options" : [opt1, opt2, opt3, opt4]. Jamais 2, jamais 3, jamais 5. INTERDICTION FORMELLE de placeholders comme "Choix 1", "Option A", texte vide, ou options dupliquées.
4. SYNONYMES ET ANTONYMES : Le mot testé dans la question ne doit JAMAIS figurer dans les 4 propositions de réponse (ex: pour le synonyme de rapide, propose véloce, lent, calme, immobile).
5. ALIGNEMENT STRICT : "correctIndex" (0, 1, 2 ou 3) DOIT pointer précisément vers la réponse juste dans "options".
6. EXPLICATION PÉDAGOGIQUE CLAIRE : Formule obligatoirement : « La bonne réponse est [bonne réponse] car ... ».

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "topic": "${topic || targetSubject}",
  "questions": [
    {
      "question": "Énoncé précis et logique de la question",
      "options": ["Vraie proposition A rédigée", "Vraie proposition B rédigée", "Vraie proposition C rédigée", "Vraie proposition D rédigée"],
      "correctIndex": 0,
      "explanation": "Pourquoi cette réponse est la bonne..."
    }
  ]
}`;
      userPrompt = `Génère exactement les ${targets.length} questions QCM inédites en respectant rigoureusement chaque point du plan pédagogique.`;
    }
  }

  let questions = [];
  let resolvedTopic = topic || `Notions clés en ${targetSubject}`;
  let ollamaAcceptedCount = 0;

  try {
    console.log(`[AI-Quiz] Generating dynamic quiz with Ollama for ${studentName} (${targetSubject} - ${targetDifficulty} - requesting ${targets.length} questions)...`);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const result = await queryOllamaJson(messages, 65000, {
      temperature: 0.5,
      top_p: 0.9
    });
    if (result && Array.isArray(result.questions) && result.questions.length >= 2) {
      resolvedTopic = result.topic || resolvedTopic;
      for (const rawQ of result.questions) {
        const sanitized = sanitizeQuestionOptions(rawQ, resolvedTopic, subjectKey, targetDifficulty, isPrimaire1);
        if (!sanitized) continue;
        if (isQuestionDuplicate(sanitized.question, questions, avoidList, 0.58)) {
          console.log(`[AI-Quiz] Filtered duplicate AI question: "${sanitized.question.slice(0, 35)}..."`);
          continue;
        }
        questions.push(sanitized);
        ollamaAcceptedCount++;
        if (questions.length >= finalCount) break;
      }
    }
  } catch (err) {
    console.warn(`[AI-Quiz] Ollama batch skipped or timed out (${err.message}). Using calibrated backup pool.`);
  }

  // If Ollama completed all requested questions, we are done!
  // Only top-up if Ollama fell short
  if (questions.length < finalCount) {
    console.log(`[AI-Quiz] Ollama provided ${questions.length}/${finalCount} questions. Completing from certified curriculum bank.`);
    const existingTexts = questions.map(q => (q.question || '').toLowerCase().slice(0, 25));
    const lowerAvoided = avoidList.map(q => (q || '').toLowerCase());

    const isExcluded = (txt) => {
      const low = (txt || '').toLowerCase();
      return existingTexts.some(ex => low.includes(ex)) || lowerAvoided.some(av => av.includes(low.slice(0, 20)));
    };

    // 1. Primary candidate pool: target difficulty (or CP bank if CP)
    const primaryBank = shuffleArray(getQuestionsFromBank(subjectKey, targetDifficulty, isPrimaire1));
    for (let item of primaryBank) {
      if (questions.length >= finalCount) break;
      const txt = item.question || '';
      if (!isExcluded(txt)) {
        questions.push(randomizeQuestionOptions(item));
        existingTexts.push(txt.toLowerCase().slice(0, 25));
      }
    }

    // 2. Secondary candidate pool: other difficulties of the SAME subject (only for non-CP)
    if (questions.length < finalCount && !isPrimaire1) {
      const otherTiers = ['Intermédiaire', 'Débutant', 'Avancé'].filter(t => t !== targetDifficulty);
      for (let tier of otherTiers) {
        if (questions.length >= finalCount) break;
        const tierBank = shuffleArray(getQuestionsFromBank(subjectKey, tier, isPrimaire1));
        for (let item of tierBank) {
          if (questions.length >= finalCount) break;
          const txt = item.question || '';
          if (!isExcluded(txt)) {
            questions.push(randomizeQuestionOptions(item));
            existingTexts.push(txt.toLowerCase().slice(0, 25));
          }
        }
      }
    }

    // 3. Third candidate pool: procedural generator
    if (questions.length < finalCount) {
      const needed = finalCount - questions.length;
      const procedural = generateProceduralQuizQuestions(subjectKey, targetDifficulty, needed, questions, isPrimaire1);
      for (let p of procedural) {
        if (questions.length >= finalCount) break;
        questions.push(randomizeQuestionOptions(p));
      }
    }
  }

  const finalQuestions = questions.slice(0, finalCount);

  let generatedBy = 'Tuteur IA (Ollama llama3.2)';
  if (ollamaAcceptedCount === 0) {
    generatedBy = 'Tuteur IA (Banques certifiées)';
  } else if (ollamaAcceptedCount < finalCount) {
    generatedBy = 'Tuteur IA (Ollama llama3.2 + Banques certifiées)';
  }

  return {
    topic: resolvedTopic,
    questions: finalQuestions,
    difficulty: targetDifficulty,
    count: finalQuestions.length,
    generatedBy
  };
}

/**
 * Generates a full practical exercise using Ollama or dynamic procedural templates.
 */
async function generateAiExercise({ subject, topic, level, difficulty = 'Intermédiaire', avoidIds = [] }, studentContext = {}) {
  const targetSubject = subject || 'Général';
  const targetLevel = level || studentContext?.student?.education_level || '1ère année primaire';
  const tier = detectEducationTier(targetLevel);
  const isPrimaire1 = tier === 'primaire_1';
  const targetDifficulty = ['Débutant', 'Intermédiaire', 'Avancé'].includes(difficulty) ? difficulty : (isPrimaire1 ? 'Débutant' : 'Intermédiaire');
  const studentName = studentContext?.student?.first_name || 'l\'élève';
  const studentLevel = targetLevel;

  const exerciseGuidance = {
    'Débutant': `🎯 DIFFICULTÉ DÉBUTANT :
- Énoncé court, concret et très guidé pas-à-pas.
- Situations de la vie quotidienne simples et évidentes.
- Questions directes sans formules compliquées.`,
    'Intermédiaire': `🎯 DIFFICULTÉ INTERMÉDIAIRE :
- Exercice pratique d'application directe du cours scolaire.
- Données réalistes avec étapes de calcul ou de réflexion ordonnées.`,
    'Avancé': `🎯 DIFFICULTÉ AVANCÉE :
- Étude de cas approfondie, cas limites, questions ouvertes et synthèse rigoureuse.`
  }[targetDifficulty];

  let systemPrompt = '';
  if (isPrimaire1) {
    const isAr = targetSubject.toLowerCase().includes('arabe') || targetSubject.toLowerCase().includes('islam');
    if (isAr) {
      systemPrompt = `أنت Tuteur IA، أستاذ بيداغوجي صبور لتلاميذ السنة الأولى ابتدائي (عمر التلميذ: 6 سنوات).
أنشئ ورقة تمرين تطبيقي مصغر وممتع لـ ${studentName} في مادة ${targetSubject}.

قواعد 1ère année primaire (السنة الأولى ابتدائي - 6 سنوات):
1. نص الوضعية (contextContent): قصة قصيرة جداً من سطرين (2 أو 3 جمل مشكولة) من عالم الطفل والمدرسة والبيت (أقلام، تفاح، قطة، ألعاب).
2. الأسئلة: 2 أو 3 أسئلة قصيرة جداً ومباشرة (مثال: السؤال 1: كم عدد الأقلام في المقلمة؟، السؤال 2: كم عدد الأقلام كلها؟).
3. مدة الإنجاز: "5 دقائق"، والنقاط: 20 نقطة.
4. الإرشادات: عبارات مشجعة ومبسطة جداً ("يمكنك العد بأصابع يديك").
5. خطوات الحل: خطوتان مبسطتان مع الجواب الواضح.
6. ممنوع منعاً باتاً: الإعراب، المسائل الرياضية المعقدة، والكلمات الصعبة.

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "title": "ورشة الأقلام والحساب الممتع",
  "category": "تطبيق ميسر • الأولى ابتدائي",
  "estimatedTime": "5 دقائق",
  "points": 20,
  "objective": "العد البسيط وتمييز عناصر المقلمة المدرسية",
  "contextType": "arabic",
  "contextContent": "فِي مِقْلَمَةِ أَمِينٍ 3 أَقْلَامٍ زَرْقَاءَ وَقَلَمَانِ أَحْمَرَانِ.",
  "questions": [
    "كَمْ عَدَدُ الأَقْلَامِ الزَّرْقَاءِ فِي المِقْلَمَةِ ؟",
    "كَمْ عَدَدُ جَمِيعِ الأَقْلَامِ مَعًا (3 + 2) ؟"
  ],
  "hints": [
    { "title": "إرشاد 1", "content": "اجمع 3 مع 2 بالعد على أصابع يديك." }
  ],
  "solutionSteps": [
    { "label": "الخطوة 1", "detail": "الأقلام الزرقاء عددها 3." },
    { "label": "الخطوة 2", "detail": "المجموع الكلي: 3 + 2 = 5 أقلام." }
  ],
  "solutionSummary": "عدد الأقلام الكلي هو 5 أقلام.",
  "pitfalls": ["الانتباه لعدم نسيان أي قلم أثناء العد."],
  "keyTakeaway": "3 + 2 = 5.",
  "checklist": ["عددتُ الأقلام بدقة", "كتبتُ الجواب الصحيح"]
}`;
    } else {
      systemPrompt = `Tu es TutorAI, tuteur bienveillant pour un élève de 6 ans en 1ère année primaire (CP - 1ère AP au Maroc).
Crée un mini-atelier d'exercice très doux, amusant et imagé pour ${studentName}.
Matière : ${targetSubject}
Niveau : 1ère année primaire (CP - 6 ans)
${topic ? `Thème spécifique : ${topic}` : 'Choisis un atelier du quotidien (fruits, animaux, cartable, trousse, formes).'}

DIRECTIVES STRICTES 1ÈRE ANNÉE PRIMAIRE (CP - 6 ANS) :
1. ÉNONCÉ / CONTEXTE (contextContent) : Une petite histoire concrète de 2 ou 3 phrases très simples (ex: « Sarah a 3 billes bleues et 2 billes rouges dans son sac. » ou « Le petit chat boit son bol de lait. »).
2. QUESTIONS : 2 ou 3 questions courtes et très simples (ex: « 1. Combien de billes bleues a Sarah ? », « 2. Combien de billes Sarah a-t-elle en tout (3 + 2) ? »).
3. ESTIMATED TIME : "5 min"
4. POINTS : 20
5. HINTS : 1 ou 2 indices chaleureux et simples (« Tu peux compter sur tes doigts... »).
6. SOLUTION : Résolution en 2 petites étapes claires avec le résultat final.
7. STRICTEMENT INTERDIT : Théorèmes, équations avec x, fractions, pourcentages, vocabulaire universitaire ou abstrait.

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "title": "Titre mignon et adapté (ex: Le panier de pommes de Sarah)",
  "category": "Mini-Atelier Découverte • CP",
  "estimatedTime": "5 min",
  "points": 20,
  "objective": "Compter de petits objets du quotidien",
  "contextType": "text",
  "contextContent": "Courte histoire de 2 phrases adaptées au CP...",
  "questions": [
    "Première question très simple...",
    "Deuxième question très simple..."
  ],
  "hints": [
    { "title": "Indice 1", "content": "Astuce toute simple..." }
  ],
  "solutionSteps": [
    { "label": "Étape 1", "detail": "Réponse à la question 1..." },
    { "label": "Étape 2", "detail": "Réponse à la question 2..." }
  ],
  "solutionSummary": "La bonne réponse expliquée en 1 phrase d'enfant.",
  "pitfalls": ["Prendre son temps pour bien compter."],
  "keyTakeaway": "Ce qu'on a appris de façon amusante.",
  "checklist": ["J'ai bien compté", "J'ai trouvé la réponse"]
}`;
    }
  } else {
    systemPrompt = `Tu es TutorAI, tuteur pédagogique de haut niveau.
Génère un exercice pratique complet, structuré, réaliste et formateur pour ${studentName}.
Matière : ${targetSubject}
Niveau de l'élève : ${studentLevel}
Difficulté souhaitée : ${targetDifficulty.toUpperCase()}
${exerciseGuidance}
${topic ? `Sujet / Concept spécifique : ${topic}` : 'Choisis un cas pratique particulièrement formateur adapté au niveau.'}

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "title": "Titre précis de l'exercice",
  "category": "Catégorie ou domaine",
  "estimatedTime": "15 min",
  "points": 40,
  "objective": "Objectif pédagogique clair",
  "contextType": "text",
  "contextContent": "Texte, énoncé, extrait de code ou données du problème",
  "questions": [
    "Question 1 : analyse initiale...",
    "Question 2 : calcul ou résolution intermédiaire...",
    "Question 3 : interprétation ou généralisation..."
  ],
  "hints": [
    { "title": "Indice 1 : Piste de départ", "content": "Astuce méthodologique..." },
    { "title": "Indice 2 : Règle à appliquer", "content": "Formule ou méthode..." }
  ],
  "solutionSteps": [
    { "label": "Étape 1 : Analyse des données", "detail": "Explication complète..." },
    { "label": "Étape 2 : Résolution mathématique ou technique", "detail": "Démarche pas à pas..." }
  ],
  "solutionSummary": "Résumé concis de la solution trouvée.",
  "pitfalls": ["Erreur fréquente à éviter 1", "Erreur fréquente 2"],
  "keyTakeaway": "Ce qu'il faut absolument retenir de cet exercice.",
  "checklist": [
    "J'ai vérifié les hypothèses de l'énoncé",
    "J'ai détaillé les étapes intermédiaires",
    "J'ai validé la cohérence du résultat final"
  ]
}`;
  }

  try {
    console.log(`[AI-Exercise] Generating exercise with Ollama for ${studentName} (${targetSubject} - ${targetDifficulty} - level: ${targetLevel})...`);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: isPrimaire1 ? `Génère un mini-exercice amusant et facile pour un élève de 6 ans en 1ère primaire (${targetSubject}).` : `Génère un exercice de niveau ${targetDifficulty} en ${targetSubject}.` }
    ];

    const result = await queryOllamaJson(messages, 65000, {
      temperature: 0.5,
      top_p: 0.9
    });
    if (result && result.title && Array.isArray(result.questions) && result.questions.length >= 2) {
      console.log(`[AI-Exercise] Ollama generated exercise: "${result.title}".`);
      return {
        id: `ai-ex-${Date.now()}`,
        title: result.title,
        subject: targetSubject,
        difficulty: targetDifficulty,
        category: result.category || (isPrimaire1 ? `Atelier CP (${targetSubject})` : `Pratique en ${targetSubject}`),
        estimatedTime: result.estimatedTime || (isPrimaire1 ? '5 min' : targetDifficulty === 'Débutant' ? '10 min' : '15 min'),
        points: result.points || (isPrimaire1 ? 20 : targetDifficulty === 'Débutant' ? 30 : targetDifficulty === 'Intermédiaire' ? 40 : 50),
        objective: result.objective || (isPrimaire1 ? `Découverte et entraînement guidé en ${targetSubject}.` : `Maîtrise pratique des notions de ${targetSubject}.`),
        contextType: result.contextType || (targetSubject.toLowerCase().includes('arabe') ? 'arabic' : 'text'),
        contextContent: result.contextContent || '',
        contextTranslation: result.contextTranslation || undefined,
        questions: result.questions,
        hints: Array.isArray(result.hints) ? result.hints : [],
        solutionSteps: Array.isArray(result.solutionSteps) ? result.solutionSteps : [],
        solutionSummary: result.solutionSummary || 'Résolution méthodologique guidée.',
        pitfalls: Array.isArray(result.pitfalls) ? result.pitfalls : ['Attention aux erreurs d\'inattention.'],
        keyTakeaway: result.keyTakeaway || (isPrimaire1 ? 'Bravo pour tes efforts !' : 'Appliquer la méthode rigoureusement étape par étape.'),
        checklist: Array.isArray(result.checklist) ? result.checklist : ['J\'ai répondu à toutes les questions'],
        generatedBy: 'Tuteur IA (Ollama llama3.2)'
      };
    }
  } catch (err) {
    console.warn(`[AI-Exercise] Ollama skipped or timed out (${err.message}). Using dynamic generator.`);
  }

  // If 1ère primaire, return an age-appropriate fallback exercise
  if (isPrimaire1) {
    const isAr = targetSubject.toLowerCase().includes('arabe') || targetSubject.toLowerCase().includes('islam');
    if (isAr) {
      return {
        id: `cp-ex-${Date.now()}`,
        title: `حِسَابٌ بَسِيطٌ : أَقْلَامُ أَمِينٍ فِي المِقْلَمَةِ`,
        subject: targetSubject,
        difficulty: 'Débutant',
        category: `تطبيق ميسر • الأولى ابتدائي`,
        estimatedTime: '5 دقائق',
        points: 20,
        objective: 'العد البسيط وتمييز عناصر المقلمة المدرسية.',
        contextType: 'arabic',
        contextContent: '« فِي مِقْلَمَةِ أَمِينٍ 3 أَقْلَامٍ زَرْقَاءَ وَقَلَمَانِ أَحْمَرَانِ. »',
        questions: [
          'كَمْ عَدَدُ الأَقْلَامِ الزَّرْقَاءِ فِي المِقْلَمَةِ ؟',
          'كَمْ مَجْمُوعُ كُلِّ الأَقْلَامِ مَعًا (3 + 2) ؟'
        ],
        hints: [
          { title: 'إرشاد 1', content: 'احسب الأقلام الزرقاء والحمراء معاً على أصابعك.' }
        ],
        solutionSteps: [
          { label: 'الخطوة 1', detail: 'الأقلام الزرقاء: 3 أقلام.' },
          { label: 'الخطوة 2', detail: 'المجموع الإجمالي: 3 + 2 = 5 أقلام.' }
        ],
        solutionSummary: 'عدد الأقلام الكلي هو 5 أقلام.',
        pitfalls: ['عدم التسرع أثناء العد باليدين.'],
        keyTakeaway: '3 + 2 = 5.',
        checklist: ['عددتُ الأقلام بدقة', 'كتبتُ الجواب النهائي'],
        generatedBy: 'Tuteur IA (Générateur pédagogique CP)'
      };
    } else {
      const sLower = targetSubject.toLowerCase();
      if (sLower.includes('math')) {
        return {
          id: `cp-ex-${Date.now()}`,
          title: `Le petit panier de fruits de Sarah`,
          subject: targetSubject,
          difficulty: 'Débutant',
          category: `Atelier Découverte • CP (1ère primaire)`,
          estimatedTime: '5 min',
          points: 20,
          objective: 'Dénombrer de petits objets et calculer une addition simple (somme <= 5).',
          contextType: 'text',
          contextContent: 'Sarah prépare un goûter. Elle a 3 belles pommes rouges dans son panier. Sa maman lui donne 2 pommes vertes.',
          questions: [
            'Combien de pommes rouges Sarah a-t-elle au début ?',
            'Combien de pommes Sarah a-t-elle en tout dans son panier (3 + 2) ?'
          ],
          hints: [
            { title: 'Indice 1', content: 'Tu peux compter sur tes doigts : mets 3 doigts puis ajoute 2 doigts.' }
          ],
          solutionSteps: [
            { label: 'Étape 1 : Les pommes rouges', detail: 'Sarah a 3 pommes rouges au début.' },
            { label: 'Étape 2 : Le total', detail: '3 + 2 = 5. Sarah a 5 pommes en tout.' }
          ],
          solutionSummary: 'Sarah a 5 pommes au total (3 + 2 = 5).',
          pitfalls: ['Prends bien ton temps pour compter chaque doigt.'],
          keyTakeaway: 'Quand on ajoute 2 à 3, on obtient 5 !',
          checklist: ['J\'ai bien compté les pommes', 'J\'ai écrit le bon résultat'],
          generatedBy: 'Tuteur IA (Générateur pédagogique CP)'
        };
      } else {
        return {
          id: `cp-ex-${Date.now()}`,
          title: `Les animaux de la cour d'école`,
          subject: targetSubject,
          difficulty: 'Débutant',
          category: `Atelier Découverte • CP (1ère primaire)`,
          estimatedTime: '5 min',
          points: 20,
          objective: 'Reconnaître des mots familiers et des caractéristiques simples.',
          contextType: 'text',
          contextContent: 'Dans la cour, un petit chat gris dort au soleil. Soudain, un oiseau chante sur la branche.',
          questions: [
            'Quel animal dort tranquillement au soleil ?',
            'Où chante le petit oiseau ?'
          ],
          hints: [
            { title: 'Indice 1', content: 'Relis la première ligne : quel animal est gris et dort ?' }
          ],
          solutionSteps: [
            { label: 'Étape 1', detail: 'C\'est le petit chat gris qui dort au soleil.' },
            { label: 'Étape 2', detail: 'L\'oiseau chante sur la branche.' }
          ],
          solutionSummary: 'Le petit chat dort au soleil et l\'oiseau chante sur la branche.',
          pitfalls: ['Regarde bien les mots du texte pour ne pas confondre le chat et l\'oiseau.'],
          keyTakeaway: 'On retrouve facilement l\'information dans la petite phrase !',
          checklist: ['J\'ai trouvé le nom de l\'animal', 'J\'ai lu attentivement'],
          generatedBy: 'Tuteur IA (Générateur pédagogique CP)'
        };
      }
    }
  }

  const randomSeed = Math.floor(Math.random() * 900) + 100;
  const exTopic = topic || `Cas d'application pratique n°${randomSeed % 20 + 1}`;
  return {
    id: `dyn-ex-${Date.now()}`,
    title: `Cas pratique guidé : ${exTopic} (${targetSubject})`,
    subject: targetSubject,
    difficulty: targetDifficulty,
    category: `Exercice interactif IA (${targetSubject})`,
    estimatedTime: targetDifficulty === 'Avancé' ? '20 min' : targetDifficulty === 'Débutant' ? '10 min' : '15 min',
    points: targetDifficulty === 'Débutant' ? 30 : targetDifficulty === 'Intermédiaire' ? 40 : 50,
    objective: `Assimiler et appliquer avec méthode les notions de ${exTopic}.`,
    contextType: targetSubject.toLowerCase().includes('arabe') ? 'arabic' : 'text',
    contextContent: targetSubject.toLowerCase().includes('arabe')
      ? '« العِلْمُ صَيْدٌ وَالكِتَابَةُ قَيْدُهُ، قَيِّدْ صُيُودَكَ بِالحِبَالِ الوَاثِقَةِ. »'
      : `Mise en situation concrète n°${randomSeed} portant sur les mécanismes clés de ${exTopic} en ${targetSubject}.`,
    questions: [
      `Identifier les données fondamentales de l'énoncé et repérer la notion principale demandée.`,
      `Développer la démarche de résolution pas-à-pas en appliquant la formule ou le principe adapté.`,
      `Formuler une conclusion claire et vérifier la cohérence du résultat.`
    ],
    hints: [
      {
        title: 'Indice 1 : Analyse des données',
        content: `Isolez clairement les grandeurs connues et la notion recherchée avant tout calcul.`
      },
      {
        title: 'Indice 2 : Méthodologie',
        content: `Rappelez d'abord la règle générale ou la formule de base avant d'injecter les chiffres.`
      }
    ],
    solutionSteps: [
      {
        label: 'Étape 1 : Lecture analytique',
        detail: 'Identification précise des données de départ et du résultat attendu.'
      },
      {
        label: 'Étape 2 : Résolution méthodique',
        detail: 'Déroulement rigoureux du calcul ou du raisonnement pas-à-pas.'
      }
    ],
    solutionSummary: 'Résolution guidée complète de l\'exercice.',
    pitfalls: ['Attention aux erreurs d\'inattention.'],
    keyTakeaway: 'Appliquer la méthode rigoureusement étape par étape.',
    checklist: ['J\'ai répondu à toutes les questions'],
    generatedBy: 'Tuteur IA (Générateur pédagogique)'
  };
}

/**
 * Evaluates the student's solution draft and gives AI-guided feedback.
 */
async function evaluateStudentExercise({ exercise, studentDraft }, studentContext = {}) {
  const studentName = studentContext?.student?.first_name || 'l\'élève';
  const studentLevel = studentContext?.student?.education_level || '';
  const isCP = detectEducationTier(studentLevel) === 'primaire_1';
  const cleanDraft = (studentDraft || '').trim();

  const minLength = isCP ? 1 : 5;
  if (!cleanDraft || cleanDraft.length < minLength) {
    return {
      score: 10,
      passed: false,
      feedback: isCP
        ? 'Écris ton mot ou ton chiffre dans la case pour que le Tuteur IA t\'encourage !'
        : 'Ton brouillon est encore trop court pour une évaluation complète. Prends le temps de développer ton raisonnement pas-à-pas !',
      strengths: ['Bonne initiative d\'avoir commencé l\'exercice'],
      improvements: isCP ? ['Écrire ta réponse'] : ['Détailler les étapes de calcul', 'Rédiger une phrase de conclusion'],
      evaluatedBy: 'Tuteur IA (Guide méthodologique)'
    };
  }

  const systemPrompt = isCP
    ? `Tu es TutorAI, tuteur bienveillant et très encourageant pour un jeune enfant de 6 ans en 1ère année primaire (CP).
Évalue la réponse de ${studentName} pour cet atelier de CP :
Titre : ${exercise.title}
Matière : ${exercise.subject}
Questions : ${JSON.stringify(exercise.questions)}
Solution attendue : ${exercise.solutionSummary}

Réponse rédigée par l'élève :
"""
${cleanDraft}
"""

Consignes d'évaluation pour le CP (6 ans) :
- Les réponses des enfants sont très courtes (ex: "5", "le chat", "rouge"). C'est tout à fait normal !
- Si la réponse correspond à la question ou montre qu'il a compris, attribue une note excellente (entre 75 et 100) et valide l'exercice (passed: true).
- Formule une appréciation chaleureuse, positive et encourageante adaptée à son âge.

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "score": 85,
  "passed": true,
  "feedback": "Bravo champion ! Tu as très bien répondu...",
  "strengths": ["Bonne réponse trouvée", "Super concentration"],
  "improvements": ["Continuer à s'entraîner"]
}`
    : `Tu es TutorAI, tuteur bienveillant et rigoureux.
Évalue le brouillon de travail de ${studentName} pour l'exercice suivant :
Titre : ${exercise.title}
Matière : ${exercise.subject}
Difficulté : ${exercise.difficulty || 'Intermédiaire'}
Questions posées : ${JSON.stringify(exercise.questions)}
Solution attendue : ${exercise.solutionSummary}

Brouillon rédigé par l'élève :
"""
${cleanDraft}
"""

Consignes d'évaluation :
- Sois très encourageant, constructif et formateur.
- Attribue une note réaliste sur 100 en fonction de la pertinence, de la rigueur et du respect de la méthode.
- Si le travail montre une bonne compréhension des bases, la note doit être encourageante (au moins 60-70).
- Identifie 2 à 3 points forts réels dans sa démarche.
- Propose 2 axes d'amélioration précis.

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "score": 75,
  "passed": true,
  "feedback": "Appréciation générale chaleureuse et constructive...",
  "strengths": ["Point fort 1 constaté", "Point fort 2"],
  "improvements": ["Conseil d'amélioration 1", "Conseil 2"]
}`;

  try {
    console.log(`[AI-Eval] Evaluating exercise draft with Ollama for ${studentName}...`);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Évalue mon brouillon et donne-moi ton retour pédagogique.' }
    ];

    const result = await queryOllamaJson(messages, 25000);
    if (result && typeof result.score === 'number') {
      return {
        score: Math.min(100, Math.max(0, result.score)),
        passed: result.score >= 50,
        feedback: result.feedback || 'Bon travail de réflexion ! Continue d\'appliquer cette méthode.',
        strengths: Array.isArray(result.strengths) ? result.strengths : ['Bonne rigueur de départ'],
        improvements: Array.isArray(result.improvements) ? result.improvements : ['Penser à justifier davantage'],
        evaluatedBy: 'Ollama AI (llama3.2)'
      };
    }
  } catch (err) {
    console.warn(`[AI-Eval] Ollama eval skipped (${err.message}). Using pedagogical rule-based evaluator.`);
  }

  const wordCount = cleanDraft.split(/\s+/).length;
  let estimatedScore = Math.min(95, Math.max(40, 50 + Math.floor(wordCount * 0.8)));
  if (cleanDraft.length > 200) estimatedScore = Math.max(estimatedScore, 75);

  return {
    score: estimatedScore,
    passed: estimatedScore >= 50,
    feedback: `Très bonne implication, ${studentName} ! Ton raisonnement est structuré et montre une vraie volonté de décomposer le problème. Continue d\'enrichir tes justifications avec les termes précis du cours.`,
    strengths: [
      'Démarche volontaire et rédaction soignée',
      'Bonne identification des enjeux fondamentaux'
    ],
    improvements: [
      'Penser à expliciter la formule ou la règle de cours au tout début',
      'Conclure par une phrase synthétique répondant directement à la question'
    ],
    evaluatedBy: 'Tuteur IA (Analyse pédagogique)'
  };
}

/**
 * Generates structured feedback at the end of a quiz session.
 */
async function generateQuizFeedback({ subject, score, total, userAnswers = [] }, studentContext = {}) {
  const studentName = studentContext?.student?.first_name || 'l\'élève';
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const safeAnswers = Array.isArray(userAnswers) ? userAnswers : Object.values(userAnswers || {});
  const mistakes = safeAnswers.filter(a => !a?.isCorrect);

  let tone = 'encouraging';
  if (percentage >= 80) tone = 'celebrating';
  else if (percentage < 50) tone = 'supportive';

  const systemPrompt = `Tu es TutorAI, tuteur personnel de ${studentName}.
L'élève vient de terminer un quiz de ${subject}.
Score : ${score} / ${total} (${percentage}%).
Nombre d'erreurs : ${mistakes.length}.

Rédige un bilan pédagogique chaleureux, motivant et constructif :
- Félicite pour les points réussis.
- Si des erreurs ont été commises, dédramatise et donne un conseil méthodologique concret.
- Conclus par une phrase stimulante pour la suite de la progression.

FORMAT JSON :
{
  "summary": "Bilan général synthétique...",
  "tips": ["Conseil 1", "Conseil 2"],
  "encouragement": "Phrase de motivation personnalisée..."
}`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Génère le bilan de ma session de quiz.' }
    ];
    const result = await queryOllamaJson(messages, 20000);
    if (result && result.summary) {
      return {
        score,
        total,
        percentage,
        tone,
        summary: result.summary,
        tips: Array.isArray(result.tips) ? result.tips : ['Revoir attentivement les corrections'],
        encouragement: result.encouragement || 'Chaque entraînement te rapproche de la maîtrise complète !'
      };
    }
  } catch (_) {}

  let summary = `Tu as obtenu ${score}/${total} (${percentage}%). C'est un travail encourageant !`;
  let tips = ['Prends le temps d\'analyser les explications des questions où tu as hésité.'];
  if (percentage >= 80) {
    summary = `Excellent travail ! Tu as obtenu ${score}/${total} (${percentage}%). Ta maîtrise de ce chapitre est très solide.`;
    tips = ['Prêt pour monter au palier supérieur et explorer des cas plus poussés !'];
  } else if (percentage < 50) {
    summary = `Tu as obtenu ${score}/${total} (${percentage}%). Pas d'inquiétude : les erreurs sont la meilleure occasion d'apprendre.`;
    tips = [
      'Relis tranquillement les notions de base et refais une série courte pour ancrer les définitions.',
      'N\'hésite pas à consulter la fiche de synthèse du cours.'
    ];
  }

  return {
    score,
    total,
    percentage,
    tone,
    summary,
    tips,
    encouragement: 'Continue sur cette lancée, la régularité est le secret de la réussite !'
  };
}

/**
 * Checks if a subject is an authorized school curriculum subject.
 */
function isAuthorizedSchoolSubject(subject = '') {
  if (!subject || typeof subject !== 'string') return true;
  const s = subject.toLowerCase().trim();
  const keywords = [
    'francais', 'français', 'math', 'arabe', 'islam', 'anglais', 'english',
    'physique', 'chimie', 'pc', 'svt', 'bio', 'santé', 'éveil', 'eveil',
    'hist', 'géo', 'geo', 'info', 'algo', 'code', 'eps', 'sport',
    'méthod', 'method', 'philo', 'gest', 'compt', 'éco', 'eco', 'droit'
  ];
  return keywords.some(k => s.includes(k));
}

module.exports = {
  isAuthorizedSchoolSubject,
  queryOllamaJson,
  generateAiQuiz,
  generateAiExercise,
  evaluateStudentExercise,
  generateQuizFeedback,
  normalizeSubject,
  QUIZ_BANKS_BY_SUBJECT
};
