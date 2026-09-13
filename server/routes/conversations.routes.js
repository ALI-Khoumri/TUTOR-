const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../database/db');
const { queryOllamaChat, checkOllamaStatus } = require('../services/ollama.service');

function getStudentId(req) {
  return req.headers['x-student-id'] || 'default-student';
}

/**
 * GET /api/conversations/ollama/status
 * Checks if Ollama service is reachable.
 */
router.get('/ollama/status', async (req, res) => {
  try {
    const status = await checkOllamaStatus();
    res.json(status);
  } catch (error) {
    res.json({ available: false, error: error.message });
  }
});

/**
 * GET /api/conversations
 * Retrieves all conversations for the student from MySQL.
 */
router.get('/', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const pool = getPool();

    const [conversations] = await pool.query(`
      SELECT c.*, s.name as subject_name
      FROM conversations c
      LEFT JOIN subjects s ON s.id = c.subject_id
      WHERE c.student_id = ?
      ORDER BY c.updated_at DESC
    `, [studentId]);

    res.json(conversations);
  } catch (error) {
    console.error('[API /api/conversations GET] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversations
 * Creates a new conversation for the student in MySQL.
 */
router.post('/', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { subjectName, topic } = req.body;
    const pool = getPool();
    const convId = uuidv4();

    let subjectId = null;
    if (subjectName) {
      const [subjRows] = await pool.query('SELECT id FROM subjects WHERE name = ?', [subjectName]);
      if (subjRows.length > 0) subjectId = subjRows[0].id;
    }

    await pool.query(`
      INSERT INTO conversations (id, student_id, subject_id, topic)
      VALUES (?, ?, ?, ?)
    `, [convId, studentId, subjectId, topic || `Session ${subjectName || 'Général'}`]);

    const [rows] = await pool.query('SELECT * FROM conversations WHERE id = ?', [convId]);
    res.json(rows[0]);
  } catch (error) {
    console.error('[API /api/conversations POST] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conversations/:id/messages
 * Retrieves all messages for a specific conversation from MySQL.
 */
router.get('/:id/messages', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const convId = req.params.id;
    const pool = getPool();

    const [convRows] = await pool.query('SELECT id FROM conversations WHERE id = ? AND student_id = ?', [convId, studentId]);
    if (convRows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const [messages] = await pool.query(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `, [convId]);

    res.json(messages);
  } catch (error) {
    console.error('[API /api/conversations/:id/messages GET] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversations/:id/messages
 * Adds a user message to MySQL, queries Ollama LLM, and persists the response.
 */
router.post('/:id/messages', async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const convId = req.params.id;
    const { role, content } = req.body;

    if (!content) return res.status(400).json({ error: 'Message content is required.' });

    const pool = getPool();

    // 1. Verify conversation
    const [convRows] = await pool.query(`
      SELECT c.*, s.name as subject_name
      FROM conversations c
      LEFT JOIN subjects s ON s.id = c.subject_id
      WHERE c.id = ? AND c.student_id = ?
    `, [convId, studentId]);

    if (convRows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const conv = convRows[0];
    const userMsgId = uuidv4();

    // 2. Insert user message in MySQL
    await pool.query(`
      INSERT INTO messages (id, conversation_id, role, content)
      VALUES (?, ?, ?, ?)
    `, [userMsgId, convId, role || 'user', content]);

    await pool.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [convId]);

    // 3. Gather student context from MySQL for Ollama
    const [studentRows] = await pool.query('SELECT * FROM students WHERE id = ?', [studentId]);
    const student = studentRows[0];

    const [learningProfileRows] = await pool.query('SELECT * FROM learning_profiles WHERE student_id = ?', [studentId]);
    const learningProfile = learningProfileRows[0];

    const [diffRows] = await pool.query('SELECT difficulty FROM difficulties WHERE student_id = ?', [studentId]);
    const difficulties = diffRows.map(d => d.difficulty);

    const [diagRows] = await pool.query('SELECT * FROM diagnostic_results WHERE student_id = ? ORDER BY created_at DESC LIMIT 1', [studentId]);
    const diagnostic = diagRows[0];

    const studentContext = {
      student,
      subject: conv.subject_name || 'Général',
      topic: conv.topic || 'Session d\'apprentissage',
      difficulties,
      preferences: learningProfile?.learning_preferences ? JSON.parse(learningProfile.learning_preferences) : [],
      diagnostic: diagnostic ? {
        score: diagnostic.score,
        weaknesses: diagnostic.weaknesses ? JSON.parse(diagnostic.weaknesses) : [],
        strengths: diagnostic.strengths ? JSON.parse(diagnostic.strengths) : []
      } : null
    };

    // 4. Retrieve complete conversation history
    const [history] = await pool.query(`
      SELECT role, content FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `, [convId]);

    let tutorReply = '';
    let usedOllama = false;

    // 5. Query Ollama AI
    try {
      console.log(`[Ollama] Sending prompt for student ${student?.first_name || studentId} (${conv.subject_name})...`);
      tutorReply = await queryOllamaChat(history, studentContext);
      usedOllama = true;
      console.log(`[Ollama] Received response (${tutorReply.length} chars).`);
    } catch (ollamaErr) {
      console.warn(`[Ollama] Not reachable or error (${ollamaErr.message}), using pedagogical fallback.`);

      const firstName = student ? student.first_name : 'Élève';
      const subject = conv.subject_name || 'ta matière';
      const lowerContent = content.toLowerCase();
      const subjectLower = subject.toLowerCase();
      const isEnglish = subjectLower.includes('anglais') || subjectLower.includes('english');
      const isArabic = subjectLower.includes('arabe') || subjectLower.includes('arabic') || subjectLower.includes('عرب');
      const isIslam = subjectLower.includes('islam') || subjectLower.includes('coran') || subjectLower.includes('دين') || subjectLower.includes('tarbiya') || subjectLower.includes('إسلام');

      if (isArabic || isIslam) {
        const subjectAr = isIslam ? 'التَّرْبِيَةِ الإِسْلاَمِيَّةِ' : 'اللُّغَةِ العَرَبِيَّةِ';
        if (lowerContent.includes('expliquer') || lowerContent.includes('différemment') || lowerContent.includes('comprends pas') || lowerContent.includes('شرح') || lowerContent.includes('فهم') || lowerContent.includes('بسط')) {
          tutorReply = `مَرْحَباً بِكَ يَا ${firstName} ! 😊 لاَ تَقْلَقْ أَبَداً، فَكُلُّ مَفْهُومٍ جَدِيدٍ يَحْتَاجُ إِلَى تَأَنٍّ وَخُطُوَاتٍ بَسِيطَةٍ. فِي مَادَّةِ ${subjectAr}، دَعْنَا نُقَسِّمِ الفِكْرَةَ إِلَى جُزْأَيْنِ سَهْلَيْنِ. مَا هُوَ الشَّيْءُ الَّذِي وَجَدْتَ فِيهِ صُعُوبَةً فِي البِدَايَةِ ؟`;
        } else if (lowerContent.includes('exemple') || lowerContent.includes('مثال') || lowerContent.includes('تطبيق')) {
          tutorReply = `إِلَيْكَ هَذَا المِثَالَ التَّطْبِيقِيَّ المُمَيَّزَ فِي ${subjectAr} يَا ${firstName} :\n\n📌 **مِثَالٌ تَوْضِيحِيٌّ :**\n> رَكِّزْ عَلَى القَاعِدَةِ الأَسَاسِيَّةِ، وَتَذَكَّرْ أَنَّ التَّطْبِيقَ العَمَلِيَّ يُثَبِّتُ الفَهْمَ السَّلِيمَ فِي الذِّهْنِ.\n\nهَلْ تَرْغَبُ أَنْ نَصُوغَ مِثَالاً آخَرَ مَعاً بِأُسْلُوبِكَ الخَاصِّ ؟`;
        } else if (lowerContent.includes('erreur') || lowerContent.includes('trouver') || lowerContent.includes('خطأ') || lowerContent.includes('صحيح')) {
          tutorReply = `شَارِكْنِي إِجَابَتَكَ أَوْ مَا حَاوَلْتَ كِتَابَتَهُ يَا ${firstName}. ارْتِكَابُ الخَطَأِ أَمْرٌ طَبِيعِيٌّ جِدّاً وَهُوَ أَوَّلُ خُطْوَةٍ لِلتَّعَلُّمِ الصَّحِيحِ ! سَنَتَبَيَّنُ مَعاً مَوْضِعَ الصَّوَابِ لِيَصِيرَ الأَمْرُ وَاضِحاً لَدَيْكَ.`;
        } else if (lowerContent.includes('quiz') || lowerContent.includes('pratiquer') || lowerContent.includes('exercice') || lowerContent.includes('تمرين') || lowerContent.includes('اختبار') || lowerContent.includes('كويز')) {
          tutorReply = `مُبَادَرَةٌ مُمْتَازَةٌ يَا ${firstName} ! 🎯 إِذَا أَرَدْتَ التَّدَرُّبَ عَلَى التَّمَارِينِ التَّفَاعُلِيَّةِ، تَوَجَّهْ إِلَى قِسْمِ **التَّمَارِينِ** (Exercices)، وَلِلاِخْتِبَارَاتِ السَّرِيعَةِ اضْغَطْ عَلَى **الكُوِيزِ** (Quiz). أَمَّا هُنَا، فَأَنَا مَعَكَ لِشَرْحِ كُلِّ مَا يَصْعُبُ عَلَيْكَ فِي ${subjectAr}. مَا الَّذِي تُرِيدُ أَنْ نُرَاجِعَهُ الآنَ ؟`;
        } else if (lowerContent.includes('résum') || lowerContent.includes('تلخيص') || lowerContent.includes('ملخص')) {
          tutorReply = `إِلَيْكَ الخُلاَصَةَ وَالقَوَاعِدَ الذَّهَبِيَّةَ فِي ${subjectAr} يَا ${firstName} :\n\n⭐ **1. الفِكْرَةُ المَرْكَزِيَّةُ :** اقْرَأِ النَّصَّ أَوِ القَاعِدَةَ بِتَمَعُّنٍ وَتَأَنٍّ.\n⭐ **2. المَنْهَجِيَّةُ :** اتَّبِعِ الخُطُوَاتِ المُنَظَّمَةَ وَاضْبِطِ الكَلِمَاتِ بِالشَّكْلِ التَّامِّ.\n⭐ **3. النَّصِيحَةُ :** كُلَّمَا أَشْكَلَ عَلَيْكَ أَمْرٌ، اطْرَحْ سُؤَالَكَ فَوْراً !\n\nهَلْ تُرِيدُ أَنْ نُفَصِّلَ فِي إِحْدَى هَذِهِ النِّقَاطِ ؟`;
        } else if (lowerContent.includes('avance bien') || lowerContent.includes('progression') || lowerContent.includes('bilan') || lowerContent.includes('تقدم') || lowerContent.includes('مستوى') || lowerContent.includes('حصيلة')) {
          tutorReply = `أَنْتَ تَبْذُلُ مَجْهُوداً رَائِعاً يَا ${firstName} ! 🌟 فِي كُلِّ مَرَّةٍ تَسْأَلُ وَتُفَكِّرُ، يَرْتَقِي مُسْتَوَاكَ فِي ${subjectAr}. وَاصِلْ عَلَى هَذَا المِنْوَالِ وَلاَ تَنْسَ الاِطِّلاَعَ عَلَى تَفَاصِيلِ نَجَاحَاتِكَ فِي تَبْوِيبِ **المُتَابَعَةِ** (Progression) !`;
        } else if (lowerContent.includes('vocabulaire') || lowerContent.includes('mot') || lowerContent.includes('مفردات') || lowerContent.includes('معنى') || lowerContent.includes('إعراب')) {
          tutorReply = `أَحْسَنْتَ يَا ${firstName} ! فِي مَادَّةِ ${subjectAr}، إِثْرَاءُ الرَّصِيدِ اللُّغَوِيِّ وَفَهْمُ دَلاَلاَتِ الكَلِمَاتِ وَإِعْرَابِهَا هُوَ سِرُّ التَّفَوُّقِ. مَا هِيَ الكَلِمَةُ أَوْ الجُمْلَةُ الَّتِي تُرِيدُ أَنْ نَتَدَارَسَهَا مَعاً ؟`;
        } else {
          tutorReply = `أَهْلاً وَمَرْحَباً بِكَ يَا ${firstName} فِي مَادَّةِ ${subjectAr} ! أَنَا هُنَا مُرَبِّيكَ الذَّكِيُّ لِمُسَاعَدَتِكَ خُطْوَةً بِخُطْوَةٍ وَتَوْضِيحِ كُلِّ غَامِضٍ بِلُغَةٍ عَرَبِيَّةٍ سَهْلَةٍ وَمُشَكَّلَةٍ. مَا هُوَ المَوْضُوعُ الَّذِي تَوَدُّ أَنْ نَبْدَأَ بِهِ ؟`;
        }
      } else if (isEnglish) {
        // English-specific fallback responses
        if (lowerContent.includes('expliquer') || lowerContent.includes('différemment') || lowerContent.includes('comprends pas')) {
          tutorReply = `Bien sûr ${firstName} ! En anglais, essayons une autre approche. Par exemple, si on parle de conjugaison, prenons le présent simple : "I play", "She plays", "They play". Tu remarques le "s" à la 3ème personne du singulier ? Est-ce que cette règle te semble plus claire maintenant ?`;
        } else if (lowerContent.includes('exemple')) {
          tutorReply = `Voici un exemple concret en anglais pour ${firstName} :\n\n📌 **Grammar example :**\n> "She **doesn't** go to school on Sundays." (négation au présent simple)\n> "They **are studying** right now." (présent continu)\n\nRemarque la différence entre une action habituelle et une action en cours. Peux-tu me donner un exemple similaire en utilisant ces deux temps ?`;
        } else if (lowerContent.includes('erreur') || lowerContent.includes('trouver')) {
          tutorReply = `Partageons ton erreur ensemble ${firstName}. En anglais, les fautes les plus courantes sont :\n- Oublier le "s" à la 3ème personne (he/she/it)\n- Confondre "do/does" dans les questions\n- Utiliser "have" avec "since/for"\n\nQuelle phrase ou exercice te pose problème ? Envoie-le-moi et on l'analyse ensemble.`;
        } else if (lowerContent.includes('quiz') || lowerContent.includes('pratiquer') || lowerContent.includes('exercice')) {
          tutorReply = `Super initiative ${firstName} ! 🎯 Pour pratiquer l'anglais avec des exercices interactifs, rends-toi dans la section **Exercices** de l'application. Pour des quiz, direction la section **Quiz** ! Ici, je suis là pour t'expliquer les notions et répondre à tes questions de compréhension en anglais. Que souhaites-tu que je t'explique ?`;
        } else if (lowerContent.includes('résum') || lowerContent.includes('summary')) {
          tutorReply = `Voici les points clés à retenir en anglais pour cette notion :\n\n1. **Structure :** Sujet + Verbe + Complément.\n2. **Règle essentielle :** Accorder le verbe au sujet et au temps approprié.\n3. **Point d'attention :** Attention aux faux-amis et aux prépositions.\n\nSouhaites-tu que l'on détaille l'un de ces points ?`;
        } else if (lowerContent.includes('avance bien') || lowerContent.includes('progression') || lowerContent.includes('bilan')) {
          tutorReply = `Tu avances très bien, ${firstName} ! 🚀 Tu as complété ton diagnostic et tu es actif sur la plateforme. Tes bases sont en place. En continuant à poser des questions et à clarifier chaque doute, tu vas consolider ton niveau rapidement. Tu peux aussi consulter tes statistiques détaillées dans l'onglet **Progression** !`;
        } else if (lowerContent.includes('vocabulaire') || lowerContent.includes('mot')) {
          tutorReply = `Voici quelques mots de vocabulaire utiles en anglais pour ${firstName} :\n\n- **Nevertheless** /ˌnevəðəˈles/ → Néanmoins, cependant\n- **Furthermore** /ˈfɜːðəˌmɔːr/ → De plus, en outre\n- **Although** /ɔːlˈðoʊ/ → Bien que, quoique\n\nCes mots sont très utiles pour structurer des arguments. Veux-tu pratiquer avec une phrase d'exemple ?`;
        } else {
          tutorReply = `J'ai bien compris ta question sur l'anglais, ${firstName}. En anglais, il est important de pratiquer régulièrement. Dis-moi : préfères-tu qu'on travaille sur la **grammaire** (verbes, temps, structure de phrase), le **vocabulaire**, ou la **compréhension de texte** ?`;
        }
      } else if (lowerContent.includes('expliquer') || lowerContent.includes('différemment') || lowerContent.includes('comprends pas')) {
        tutorReply = `Ne t'inquiète pas du tout, ${firstName} ! C'est tout à fait normal de ne pas comprendre du premier coup. 😊 Pour cette notion en ${subject}, découpons-la en deux étapes très simples. Dis-moi, qu'est-ce qui te paraît le plus difficile au départ ?`;
      } else if (lowerContent.includes('exemple')) {
        tutorReply = `Voici un exemple imagé et concret en ${subject} pour toi, ${firstName} : imagine une situation de la vie de tous les jours où on utilise cette règle. Prenons les choses pas à pas ensemble !`;
      } else if (lowerContent.includes('erreur') || lowerContent.includes('trouver')) {
        tutorReply = `Montre-moi ce que tu as essayé d'écrire ou de calculer, ${firstName}. Se tromper est la meilleure façon d'apprendre ! On va regarder ensemble où ça coince pour que ça devienne limpide.`;
      } else if (lowerContent.includes('quiz') || lowerContent.includes('pratiquer') || lowerContent.includes('exercice')) {
        tutorReply = `Super idée ${firstName} ! 🎯 Pour t'amuser et t'entraîner, file dans la section **Exercices** ou **Quiz**. Ici, je suis là pour t'expliquer calmement tout ce qui te pose problème en ${subject}. Que veux-tu qu'on revoie ensemble ?`;
      } else if (lowerContent.includes('résum')) {
        tutorReply = `Voici la règle d'or à retenir en ${subject}, ${firstName} :\n\n⭐ **1. L'idée clé :** Reste calme et lis bien la consigne.\n⭐ **2. La méthode :** Fais les étapes une par une sans te presser.\n⭐ **3. Le conseil :** Si tu as un doute, demande-moi !\n\nVeux-tu qu'on illustre cela avec un exemple amusant ?`;
      } else if (lowerContent.includes('avance bien') || lowerContent.includes('progression') || lowerContent.includes('bilan')) {
        tutorReply = `Tu fais de super efforts, ${firstName} ! 🌟 Chaque fois que tu poses une question, tu progresses. Continue comme ça, prends ton temps, et n'oublie pas de fêter tes petites victoires dans l'onglet **Progression** !`;
      } else {
        tutorReply = `C'est une excellente question sur ${subject}, ${firstName} ! Prenons le temps d'y répondre ensemble pas à pas pour que ce soit facile à comprendre.`;
      }
    }

    // 6. Save AI Tutor message to MySQL
    const assistantMsgId = uuidv4();
    await pool.query(`
      INSERT INTO messages (id, conversation_id, role, content)
      VALUES (?, ?, 'assistant', ?)
    `, [assistantMsgId, convId, tutorReply]);

    res.json({
      userMessage: { id: userMsgId, role: 'user', content, created_at: new Date().toISOString() },
      assistantMessage: { id: assistantMsgId, role: 'assistant', content: tutorReply, created_at: new Date().toISOString() },
      usedOllama
    });
  } catch (error) {
    console.error('[API /api/conversations/:id/messages POST] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
