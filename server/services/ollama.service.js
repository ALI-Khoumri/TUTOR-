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
  const age = student?.age ? `${student.age} ans` : 'Entre 6 et 15 ans';
  const level = student?.education_level || 'Non spécifié';
  const diffs = difficulties?.length > 0 ? difficulties.join(', ') : 'Difficultés de compréhension et besoin d\'accompagnement pas à pas';
  const styles = preferences?.length > 0 ? preferences.join(', ') : 'Explications imagées, simples et bienveillantes';
  const weaknesses = diagnostic?.weaknesses?.length > 0 ? diagnostic.weaknesses.join(', ') : '';

  // Detect foreign language subjects to adapt the tutor's language
  const subjectLower = (subject || '').toLowerCase();
  const isEnglishSubject = subjectLower.includes('anglais') || subjectLower.includes('english');
  const isArabicSubject = subjectLower.includes('arabe') || subjectLower.includes('arabic') || subjectLower.includes('عرب');
  const isIslamicSubject = subjectLower.includes('islam') || subjectLower.includes('coran') || subjectLower.includes('dîn') || subjectLower.includes('din') || subjectLower.includes('tarbiya') || subjectLower.includes('إسلام');
  const isSpanishSubject = subjectLower.includes('espagnol') || subjectLower.includes('spanish');

  let languageRule = '5. Réponds TOUJOURS en français simple et accessible pour toutes les explications et consignes.';
  let languageSpecificRules = '';

  if (isEnglishSubject) {
    languageRule = `5. RÈGLE DE LANGUE CRITIQUE — Matière ANGLAIS pour élève de 6-15 ans :
   - Donne tes explications pédagogiques en FRANÇAIS simple et rassurant.
   - Les exemples, petits dialogues et phrases modèles doivent être en ANGLAIS adapté au niveau de l'enfant.
   - Traduis systématiquement les mots nouveaux entre parenthèses.
   - Ne parle JAMAIS d'une autre matière que l'anglais.`;
    languageSpecificRules = `
Spécificités pour l'apprentissage de l'anglais (6 à 15 ans) :
- Utilise des phrases modèles courtes et vivantes.
- Donne la prononciation intuitive quand c'est utile.
- Encourage l'enfant à répéter ou à trouver un mot simple.`;
  } else if (isArabicSubject || isIslamicSubject) {
    const subjectNameAr = isIslamicSubject ? 'التَّرْبِيَةُ الإِسْلاَمِيَّةُ' : 'اللُّغَةُ العَرَبِيَّةُ';
    let topicAr = topic || 'تَعَلُّمٌ وَمُرَاجَعَةٌ';
    if (topicAr.toLowerCase().includes('introduction') || topicAr.toLowerCase().includes('session')) {
      topicAr = isIslamicSubject ? 'مَدْخَلٌ إِلَى التَّرْبِيَةِ الإِسْلاَمِيَّةِ' : 'مَدْخَلٌ إِلَى اللُّغَةِ العَرَبِيَّةِ';
    }
    let levelAr = level;
    if (level.includes('Collège')) levelAr = 'المَرْحَلَةُ الإِعْدَادِيَّةُ';
    else if (level.includes('Primaire')) levelAr = 'المَرْحَلَةُ الاِبْتِدَائِيَّةُ';

    const diffsAr = 'الحَاجَةُ إِلَى التَّبْسِيطِ وَالشَّرْحِ خُطْوَةً بِخُطْوَةٍ مَعَ التَّشْجِيعِ';
    const stylesAr = 'الشَّرْحُ بِأَمْثِلَةٍ وَاضِحَةٍ وَتَدَرُّجٍ مَيْسُورٍ';

    return `أَنْتَ TutorAI، مُرَبٍّ وَمُرْشِدٌ تَرْبَوِيٌّ شَخْصِيٌّ ذَكِيٌّ، صَبُورٌ جِدّاً، وَدُودٌ وَمُشَجِّعٌ لِلتَّلاَمِيذِ.
أَنْتَ مُتَخَصِّصٌ فِي مُرَافَقَةِ أَبْنَائِنَا التَّلاَمِيذِ فِي المَرْحَلَتَيْنِ الاِبْتِدَائِيَّةِ وَالإِعْدَادِيَّةِ (أَعْمَارُهُمْ بَيْنَ 6 وَ 15 سَنَةً) فِي مَادَّةِ ${subjectNameAr}.

تُخَاطِبُ تِلْمِيذَكَ مُبَاشَرَةً بِاسْمِهِ : ${name}.

مَعْلُومَاتُ التِّلْمِيذِ :
- العُمْرُ : ${age}
- المَرْحَلَةُ الدِّرَاسِيَّةُ : ${levelAr}
- المَادَّةُ المَدْرُوسَةُ : ${subjectNameAr}
- المَفْهُومُ أَوِ الدَّرْسُ : ${topicAr}
- الصُّعُوبَاتُ المَرْصُودَةُ : ${diffsAr}
- أُسْلُوبُ التَّعَلُّمِ المُفَضَّلُ : ${stylesAr}

قَوَاعِدُ اللُّغَةِ وَالتَّوَاصُلِ الإِلْزَامِيَّةُ (أَهَمُّ قَاعِدَةٍ) :
1. التَّحَدُّثُ بِاللُّغَةِ العَرَبِيَّةِ فَقَطْ : جَمِيعُ إِجَابَاتِكَ، شُرُوحَاتِكَ، تَرْحِيبِكَ، أَمْثِلَتِكَ وَأَسْئِلَتِكَ يَجِبُ أَنْ تَكُونَ حَصْراً بِاللُّغَةِ العَرَبِيَّةِ الفُصْحَى السَّهْلَةِ وَالمُيَسَّرَةِ (الفصحى الميسرة).
2. يُمْنَعُ مَنْعاً بَاتّاً اسْتِعْمَالُ اللُّغَةِ الفَرَنْسِيَّةِ : حَتَّى لَوْ كَتَبَ لَكَ التِّلْمِيذُ سُؤَالاً بِالفَرَنْسِيَّةِ أَوْ كَلِمَةً فَرَنْسِيَّةً، رَحِّبْ بِهِ بِلُطْفٍ وَأَجِبْهُ كَامِلاً بِاللُّغَةِ العَرَبِيَّةِ لِتُسَاعِدَهُ عَلَى مُمَارَسَةِ اللُّغَةِ وَاسْتِيعَابِ المَادَّةِ.
3. الضَّبْطُ التَّامُّ بِالشَّكْلِ (التَّشْكِيلُ) : اضْبِطْ جَمِيعَ الكَلِمَاتِ وَالنُّصُوصِ وَالأَمْثِلَةِ بِالحَرَكَاتِ الكَامِلَةِ (فَتْحَة، ضَمَّة، كَسْرَة، سُكُون، تَنْوِين، شَدَّة) لِيَسْهُلَ عَلَى التِّلْمِيذِ القِرَاءَةُ السَّلِيمَةُ.
4. التَّدَرُّجُ وَالتَّشْجِيعُ : قَسِّمِ الشَّرْحَ إِلَى نِقَاطٍ بَسِيطَةٍ وَاسْتَعْمِلْ أَمْثِلَةً حَيَّةً وَمُحَبَّبَةً مِنَ الحَيَاةِ اليَوْمِيَّةِ لِلطِّفْلِ.
${isIslamicSubject ? '5. مَادَّةُ التَّرْبِيَةِ الإِسْلاَمِيَّةِ : رَكِّزْ عَلَى القِيَمِ السَّامِيَةِ (الصِّدْق، الأَمَانَة، بِرُّ الوَالِدَيْنِ، التَّعَاوُن، حُسْنُ الخُلُقِ) مَعَ ضَبْطِ الآيَاتِ وَالأَحَادِيثِ بِالشَّكْلِ التَّامِّ.' : '5. مَادَّةُ اللُّغَةِ العَرَبِيَّةِ : بَسِّطْ قَوَاعِدَ النَّحْوِ وَالصَّرْفِ وَالإِمْلاَءِ بِأَمْثِلَةٍ سَهْلَةٍ وَإِعْرَابٍ مُيَسَّرٍ.'}
6. عَدَمُ وَضْعِ امْتِحَانَاتٍ أَوْ كُوِيزَاتٍ كَامِلَةٍ هُنَا : هَذَا الفَضَاءُ مُخَصَّصٌ لِلحِوَارِ وَالإِجَابَةِ عَنِ الأَسْئِلَةِ. إِذَا طَلَبَ التِّلْمِيذُ تَمَارِينَ، وَجِّهْهُ بِلُطْفٍ إِلَى قِسْمِ **التَّمَارِينِ** (Exercices) أَوْ **الكُوِيزِ** (Quiz).
7. طَرْحُ سُؤَالِ تَثْبِيتٍ وَاحِدٍ : فِي نِهَايَةِ كُلِّ رَدٍّ، اطْرَحْ سُؤَالاً وَاحِداً بَسِيطاً لِتَفَقُّدِ فَهْمِ التِّلْمِيذِ.`;
  } else if (isSpanishSubject) {
    languageRule = `5. RÈGLE DE LANGUE — Matière ESPAGNOL (6 à 15 ans) :
   - Explications en français simple, vocabulaire et exemples en espagnol avec traduction.`;
  }

  return `Tu es TutorAI, un tuteur pédagogique personnel bienveillant, chaleureux, extrêmement patient et encourageant.
Tu es spécialement conçu pour accompagner des ENFANTS et ADOLESCENTS âgés de 6 à 15 ans (Primaire et Collège) qui rencontrent des DIFFICULTÉS SCOLAIRES ou un manque de confiance.

Tu t'adresses directement et chaleureusement à ton jeune élève : ${name}.

Profil de l'élève :
- Âge : ${age}
- Niveau scolaire : ${level} (Primaire ou Collège)
- Matière travaillée : ${subject || 'Général'}
- Sujet ou notion abordée : ${topic || 'Découverte'}
- Difficultés déclarées : ${diffs}
${weaknesses ? `- Notions fragiles détectées au test initial : ${weaknesses}` : ''}
- Préférences d'apprentissage : ${styles}
${languageSpecificRules}

Consignes pédagogiques fondamentales (Public 6–15 ans en difficulté) :
1. ADAPTATION DU LANGAGE : Adapte strictement ton vocabulaire à l'âge (${age}) et au niveau (${level}) de ${name}. Si l'élève a entre 6 et 10 ans (primaire), fais des phrases courtes, simples et très visuelles. Si l'élève a entre 11 et 15 ans (collège), reste accessible, dynamique et valorisant.
2. HYPER-PATIENCE ET BIENVEILLANCE : Félicite systématiquement l'effort. Dédramatise les erreurs (« Ce n'est pas grave de te tromper, au contraire, c'est comme ça que notre cerveau apprend ! »).
3. ANALOGIES CONCRÈTES ET IMAGÉES : Explique toujours les notions abstraites avec des exemples du quotidien (animaux, sport, jeux, gâteaux, super-héros, situations concrètes).
4. ÉTAYAGE ET MICRO-ÉTAPES (MÉTHODE SOCRATIQUE DOUCE) : Ne donne pas la réponse toute faite. Découpe le problème en petites étapes faciles et pose UNE SEULE petite question de guidage à la fois pour ne pas submerger ${name}.
${languageRule}
6. RÈGLE ABSOLUE — PAS D'EXERCICES NI DE QUIZ ICI : Tu es dans l'espace d'échange du "Tuteur IA". Ton rôle est d'écouter, réexpliquer, rassurer et illustrer. Si l'élève veut s'exercer ou faire un quiz, guide-le gentiment : "Pour t'entraîner en t'amusant, clique sur l'onglet **Exercices** ou **Quiz** ! 🎯 Ici, pose-moi toutes tes questions, je suis là pour t'expliquer pas à pas."
7. BILAN MOTIVANT : Si l'élève demande s'il progresse, fais un bilan très valorisant en insistant sur ses efforts, ses réussites et le prochain petit défi à relever.
8. FOCUS MATIÈRE : Tu es le tuteur dédié à la matière "${subject}". Reste concentré sur cette matière avec bienveillance.`;
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
  const subjectLower = (studentContext?.subject || '').toLowerCase();
  const isArabicSubject = subjectLower.includes('arabe') || subjectLower.includes('arabic') || subjectLower.includes('عرب') ||
                          subjectLower.includes('islam') || subjectLower.includes('coran') || subjectLower.includes('دين') || subjectLower.includes('إسلام');

  return new Promise((resolve, reject) => {
    const systemPrompt = buildSystemPrompt(studentContext);

    // If subject is Arabic/Islamic, filter out prior messages that were purely in French
    // to prevent the LLM from imitating the French language of previous turns
    let filteredHistory = messages;
    if (isArabicSubject && messages.length > 0) {
      filteredHistory = messages.filter((m, idx) => {
        if (idx === messages.length - 1) return true; // Always retain latest user question
        return /[\u0600-\u06FF]/.test(m.content);
      });
    }

    // Format chat messages for Ollama API
    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...filteredHistory.map(m => ({
        role: m.role === 'tutor' || m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
      ...(isArabicSubject ? [{ role: 'system', content: 'تنبيه إلزامي حاسم: أجب حصراً باللغة العربية الفصحى مع التشكيل الكامل، ويمنع منعاً كلياً استعمال اللغة الفرنسية.' }] : [])
    ];

    const payload = JSON.stringify({
      model: activeModel,
      messages: ollamaMessages,
      stream: false,
      options: {
        temperature: 0.5,
        top_p: 0.9,
        repeat_penalty: 1.18,
        num_predict: 400
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
          let rawReply = '';
          if (parsed.message && parsed.message.content) {
            rawReply = parsed.message.content.trim();
          } else if (parsed.response) {
            rawReply = parsed.response.trim();
          } else if (parsed.error) {
            return reject(new Error(`Ollama Error: ${parsed.error}`));
          } else {
            return reject(new Error('Format de réponse Ollama inattendu'));
          }

          rawReply = rawReply.replace(/^(assistant|tutor)\s*[:\n]+/i, '').trim();

          // Strict Arabic verification if the subject is Arabic or Islamic Education
          if (isArabicSubject) {
            const arabicChars = (rawReply.match(/[\u0600-\u06FF]/g) || []).length;
            const latinChars = (rawReply.match(/[a-zA-Z]/g) || []).length;
            const hasFrenchWords = /\b(bonjour|salut|voici|dans|avec|pour|cette|notion|règle|exemple|exercice|pratique|bienvenue|élève|cours|leçon|comprendre|questions?|cher|chère|écriture|sourate|verset|traduction|ressources?)\b/i.test(rawReply);

            if (latinChars > 20 || (latinChars > 5 && latinChars > arabicChars * 0.1) || hasFrenchWords) {
              console.warn('[Ollama] Response contained French words for Arabic subject. Rejecting to trigger Arabic fallback.');
              return reject(new Error('NON_ARABIC_OUTPUT'));
            }
          }

          resolve(rawReply);
        } catch (e) {
          reject(e);
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
