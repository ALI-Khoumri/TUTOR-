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

      if (isEnglish) {
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
        tutorReply = `Avec plaisir ${firstName}. Pour aborder cette notion en ${subject} simplement : imagine que nous décomposons le problème en deux étapes faciles. Quelle est la première étape que tu visualises ?`;
      } else if (lowerContent.includes('exemple')) {
        tutorReply = `Voici un exemple d'application concrète en ${subject} adapté à ton niveau (${student ? student.education_level : ''}) : prenons un cas standard pas à pas. Regardons ensemble comment l'énoncé se structure.`;
      } else if (lowerContent.includes('erreur') || lowerContent.includes('trouver')) {
        tutorReply = `Partage-moi ton calcul ou ton raisonnement en ${subject}, et nous allons identifier ensemble précisément la ligne ou le concept qui pose problème.`;
      } else if (lowerContent.includes('quiz') || lowerContent.includes('pratiquer') || lowerContent.includes('exercice')) {
        tutorReply = `Super initiative ${firstName} ! 🎯 Pour les exercices pratiques, rends-toi dans la section **Exercices** de l'application. Pour les quiz, direction la section **Quiz** ! Ici, dans le Tuteur IA, je suis là pour t'expliquer les notions et répondre à tes questions de compréhension en ${subject}. Que souhaites-tu que je t'explique ?`;
      } else if (lowerContent.includes('résum')) {
        tutorReply = `Voici le résumé des points fondamentaux en ${subject} :\n\n1. **Concept clé :** Bien assimiler les définitions de base.\n2. **Méthode :** Suivre une démarche rigoureuse étape par étape.\n3. **Astuce :** Vérifier systématiquement la cohérence de tes résultats.\n\nQuel aspect souhaites-tu approfondir ensemble ?`;
      } else if (lowerContent.includes('avance bien') || lowerContent.includes('progression') || lowerContent.includes('bilan')) {
        tutorReply = `Tu es sur une excellente trajectoire, ${firstName} ! 📈 Ta progression est régulière. Continue à consolider les concepts ici avant de t'entraîner dans la section **Exercices**. Pour voir tes statistiques complètes, visite la section **Progression** du menu !`;
      } else {
        tutorReply = `J'ai bien noté ta question sur ${subject}. Analysons ce point ensemble étape par étape pour consolider ta compréhension.`;
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
