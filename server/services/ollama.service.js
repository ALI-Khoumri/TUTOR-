const http = require('http');

const OLLAMA_HOST = process.env.OLLAMA_HOST || '127.0.0.1';
const OLLAMA_PORT = parseInt(process.env.OLLAMA_PORT || '11434', 10);
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'mistral';

/**
 * Checks if Ollama service is reachable and lists installed models.
 */
function checkOllamaStatus() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: '/api/tags',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const installedModels = parsed.models ? parsed.models.map(m => m.name) : [];
          // Pick the first installed model or fallback to default
          const activeModel = installedModels.length > 0 ? installedModels[0] : DEFAULT_MODEL;

          resolve({
            available: true,
            hasModels: installedModels.length > 0,
            model: activeModel,
            installedModels,
            message: installedModels.length === 0
              ? "Ollama est actif mais aucun modèle n'est encore téléchargé. Lancez 'ollama run llama3.2' ou 'ollama run mistral'."
              : `Ollama connecté avec le modèle ${activeModel}.`
          });
        } catch (e) {
          resolve({ available: true, hasModels: false, model: DEFAULT_MODEL, installedModels: [] });
        }
      });
    });

    req.on('error', () => {
      resolve({
        available: false,
        hasModels: false,
        model: DEFAULT_MODEL,
        installedModels: [],
        message: `Ollama non détecté sur http://${OLLAMA_HOST}:${OLLAMA_PORT}.`
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ available: false, hasModels: false, model: DEFAULT_MODEL, installedModels: [], message: 'Délai d\'attente dépassé pour Ollama.' });
    });

    req.end();
  });
}

/**
 * Builds a tailored pedagogical system prompt for the student context.
 */
function buildSystemPrompt(studentContext) {
  const { student, subject, topic, difficulties, preferences, diagnostic } = studentContext;

  const name = student?.first_name || 'l\'élève';
  const level = student?.education_level || 'Non spécifié';
  const field = student?.field_of_study ? ` (Filière: ${student.field_of_study}, Année: ${student.study_year || ''})` : '';
  const diffs = difficulties?.length > 0 ? difficulties.join(', ') : 'Aucune déclarée';
  const styles = preferences?.length > 0 ? preferences.join(', ') : 'Explications claires et progressives';
  const weaknesses = diagnostic?.weaknesses?.length > 0 ? diagnostic.weaknesses.join(', ') : '';

  // Detect foreign language subjects to adapt the tutor's language
  const subjectLower = (subject || '').toLowerCase();
  const isEnglishSubject = subjectLower.includes('anglais') || subjectLower.includes('english');
  const isArabicSubject = subjectLower.includes('arabe') || subjectLower.includes('arabic');
  const isSpanishSubject = subjectLower.includes('espagnol') || subjectLower.includes('spanish');

  let languageRule = '5. Réponds TOUJOURS en français pour toutes les explications et consignes.';
  let languageSpecificRules = '';

  if (isEnglishSubject) {
    languageRule = `5. RÈGLE DE LANGUE CRITIQUE — La matière travaillée est l'ANGLAIS :
   - Tu dois ABSOLUMENT enseigner en utilisant l'anglais comme langue cible.
   - Donne tes explications pédagogiques en FRANÇAIS, mais les exemples, les phrases à analyser, les exercices et les corrections de grammaire ou de vocabulaire doivent être EN ANGLAIS.
   - Ne parle JAMAIS d'une autre matière que l'anglais (pas de biologie, pas de maths, pas de physique).
   - Concentre-toi sur : la grammaire anglaise, le vocabulaire, la conjugaison, la compréhension de texte, les expressions idiomatiques, la phonétique, la rédaction en anglais.`;
    languageSpecificRules = `
\nSpécificités pour l'enseignement de l'anglais :
- Pour les exercices de grammaire : explique la règle en français, puis donne des exemples en anglais.
- Pour le vocabulaire : donne le mot anglais avec sa prononciation phonétique approximative et un exemple d'usage.
- Pour la conjugaison : utilise des tableaux clairs avec les temps anglais adaptés au niveau de l'élève.
- Pour les QCM en anglais : les questions ET les options de réponse doivent être en ANGLAIS.`;
  } else if (isArabicSubject) {
    languageRule = `5. RÈGLE DE LANGUE — La matière travaillée est l'ARABE :
   - Les explications pédagogiques peuvent être en français ou en arabe selon le contexte.
   - Les exemples de vocabulaire, phrases et textes à analyser doivent être en ARABE.
   - Ne parle JAMAIS d'une autre matière que l'arabe (langue, littérature, grammaire arabe).`;
  } else if (isSpanishSubject) {
    languageRule = `5. RÈGLE DE LANGUE — La matière travaillée est l'ESPAGNOL :
   - Les explications pédagogiques en FRANÇAIS, mais les exemples et exercices en ESPAGNOL.
   - Ne parle JAMAIS d'une autre matière que l'espagnol.`;
  }

  return `Tu es TutorAI, un tuteur pédagogique personnel intelligent, bienveillant et hautement qualifié.
Tu t'adresses directement à ton élève : ${name}.

Profil de l'élève :
- Niveau scolaire : ${level}${field}
- Matière travaillée : ${subject || 'Général'}
- Sujet ou concept : ${topic || 'Introduction'}
- Difficultés déclarées : ${diffs}
${weaknesses ? `- Lacunes détectées au diagnostic : ${weaknesses}` : ''}
- Préférences d'apprentissage : ${styles}
${languageSpecificRules}

Consignes pédagogiques strictes :
1. Adapte systématiquement ton vocabulaire et la complexité de tes explications au niveau exact de l'élève (${level}).
2. Sois toujours bienveillant, encourageant et concis (réponds en 2 à 4 paragraphes maximum).
3. Ne donne pas directement la solution brute d'un exercice : guide l'élève pas à pas en lui posant une question intermédiaire pour le faire réfléchir (méthode socratique).
4. Utilise des exemples concrets, des analogies simples et structure tes explications avec des puces claires.
${languageRule}
6. RÈGLE ABSOLUE — PAS D'EXERCICES NI DE QUIZ : Tu es dans la page "Tuteur IA". Ton rôle est EXCLUSIVEMENT d'expliquer, guider, résumer et répondre aux questions de compréhension. Tu ne dois JAMAIS proposer d'exercice, de QCM, de quiz ou de mise en pratique. Si l'élève te demande un exercice, un quiz ou de pratiquer, réponds-lui poliment : "Pour les exercices pratiques, rendez-vous dans la section **Exercices** de l'application. Pour les quiz, direction la section **Quiz** ! 🎯 Ici, je suis là pour t'expliquer et te guider."
7. RÉPONSE ET BILAN : Quand l'élève demande s'il avance bien ou veut un bilan, fais un résumé bienveillant de sa progression basé sur les informations de son profil (niveau, lacunes, points forts). Encourage-le et propose les prochaines notions à aborder.
8. RÈGLE ABSOLUE : Tu es un tuteur SPÉCIALISÉ dans la matière "${subject}". Ne réponds qu'aux questions relatives à cette matière. Si une question concerne une autre matière, dis poliment que tu es là pour aider uniquement en ${subject} pour le moment.`;
}

/**
 * Sends chat conversation to Ollama /api/chat with automatic model selection.
 */
async function queryOllamaChat(messages, studentContext) {
  const status = await checkOllamaStatus();
  if (!status.available || !status.hasModels) {
    throw new Error(status.message || 'Aucun modèle Ollama disponible');
  }

  const activeModel = status.model;

  return new Promise((resolve, reject) => {
    const systemPrompt = buildSystemPrompt(studentContext);

    // Format chat messages for Ollama API
    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'tutor' || m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    const payload = JSON.stringify({
      model: activeModel,
      messages: ollamaMessages,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9
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
      timeout: 60000 // 60s timeout for local inference
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.message && parsed.message.content) {
            resolve(parsed.message.content.trim());
          } else if (parsed.response) {
            resolve(parsed.response.trim());
          } else if (parsed.error) {
            reject(new Error(`Ollama Error: ${parsed.error}`));
          } else {
            reject(new Error('Format de réponse Ollama inattendu'));
          }
        } catch (e) {
          reject(new Error('Échec du parsing de la réponse Ollama'));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Délai d\'attente dépassé lors de l\'appel à Ollama'));
    });

    req.write(payload);
    req.end();
  });
}

module.exports = {
  checkOllamaStatus,
  queryOllamaChat,
  buildSystemPrompt
};
