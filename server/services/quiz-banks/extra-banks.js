// ─────────────────────────────────────────────────────────────────────────────
// BANQUES DE QUESTIONS VÉRIFIÉES — CYCLES PRIMAIRE & COLLÈGE (6 à 15 ans)
// ─────────────────────────────────────────────────────────────────────────────

const METHODOLOGIE_BANK = {
  'Débutant': [
    {
      topic: 'Gestion du temps & Concentration',
      question: 'En quoi consiste le principe fondamental de la méthode Pomodoro ?',
      options: [
        'Travailler en sessions intenses de 25 minutes entrecoupées de 5 minutes de pause complète',
        'Étudier 8 heures d\'affilée sans jamais s\'interrompre pour aller plus vite',
        'Réviser uniquement la veille au soir entre minuit et 6 heures du matin',
        'Écouter de la musique avec paroles tout en lisant plusieurs cours à la fois'
      ],
      correctIndex: 0,
      explanation: 'La méthode Pomodoro optimise la concentration en alternant effort focalisé (25 min) et récupération cognitive brève (5 min).'
    },
    {
      topic: 'Mémoire & Répétition espacée',
      question: 'Selon la courbe de l\'oubli d\'Ebbinghaus, quelle stratégie permet d\'ancrer durablement une notion en mémoire ?',
      options: [
        'La répétition espacée dans le temps (réviser à J+1, J+3, J+7, J+30)',
        'Relire passivement son cours une seule fois en diagonale la veille du contrôle',
        'Recopier intégralement le livre mot pour mot sans réfléchir',
        'Apprendre par cœur sans chercher à comprendre le sens des mots'
      ],
      correctIndex: 0,
      explanation: 'La répétition espacée réactive la trace mnésique au moment où elle commence à s\'estomper, consolidant le souvenir durablement.'
    },
    {
      topic: 'Apprentissage actif vs passif',
      question: 'Quelle activité d\'étude correspond à une véritable démarche de « Rappel Actif » (Active Recall) ?',
      options: [
        'Fermer son cahier et tenter d\'expliquer la leçon de mémoire ou répondre à un quiz',
        'Surligner toutes les lignes d\'une page avec un feutre fluo sans la cacher',
        'Écouter un cours en faisant autre chose sur son téléphone',
        'Regarder une vidéo explicative sans jamais prendre de notes ni pratiquer'
      ],
      correctIndex: 0,
      explanation: 'L\'effort de récupération mentale (Active Recall) oblige le cerveau à reconstruire les connexions neuronales, ce qui décuple la mémorisation.'
    },
    {
      topic: 'Prise de notes',
      question: 'Quel est l\'avantage majeur de la méthode de prise de notes structurée ?',
      options: [
        'Elle sépare les notes principales, les mots-clés et un résumé pour faciliter la révision',
        'Elle oblige à écrire en abrégé sans aucune ponctuation',
        'Elle interdit totalement d\'utiliser des schémas ou des couleurs',
        'Elle remplace entièrement le cours donné par l\'enseignant'
      ],
      correctIndex: 0,
      explanation: 'Une prise de notes structurée stimule la synthèse immédiate et permet de s\'auto-interroger rapidement.'
    },
    {
      topic: 'Organisation & Objectifs',
      question: 'Quelle est la meilleure façon de fixer un objectif de révision quotidien ?',
      options: [
        'Définir une tâche précise et limitée dans le temps (ex: faire 3 exercices de maths en 30 min)',
        'Se dire vaguement qu\'on va travailler toute la soirée sans plan',
        'Attendre d\'être interrogé au tableau sans ouvrir son cahier',
        'Faire tous ses devoirs de la semaine en 10 minutes'
      ],
      correctIndex: 0,
      explanation: 'Un objectif précis et mesurable permet de rester concentré et d\'évaluer ses progrès.'
    },
    {
      topic: 'Compréhension des consignes',
      question: 'Lors d\'un contrôle, quelle différence existe entre « Citer » et « Justifier » ?',
      options: [
        '« Citer » demande de nommer l\'élément, « Justifier » exige d\'expliquer avec des preuves ou calculs',
        '« Citer » demande de faire un dessin, « Justifier » de recopier le titre',
        'Les deux mots signifient exactement la même chose',
        '« Justifier » signifie donner son avis sans rapport avec le cours'
      ],
      correctIndex: 0,
      explanation: 'Bien respecter le verbe de consigne permet de répondre précisément à ce que demande le professeur.'
    }
  ],
  'Intermédiaire': [
    {
      topic: 'Analyse d\'erreur',
      question: 'Face à une mauvaise note ou une erreur dans un exercice, quelle est l\'attitude la plus productive ?',
      options: [
        'Analyser précisément pourquoi l\'erreur a été commise (inattention, cours non su, mauvaise lecture) et refaire l\'exercice',
        'Déchirer sa copie et oublier la matière',
        'Accuser le hasard ou le correcteur sans chercher à comprendre',
        'Ne plus jamais poser de questions au professeur'
      ],
      correctIndex: 0,
      explanation: 'L\'erreur est le tremplin numéro 1 de l\'apprentissage : en décortiquant son origine, on évite de la reproduire.'
    },
    {
      topic: 'Gestion du temps lors d\'un examen',
      question: 'Quelle gestion du temps est recommandée au début d\'une épreuve écrite ?',
      options: [
        'Parcourir tout le sujet en 2 minutes, commencer par les questions maîtrisées et garder 5 minutes pour relire',
        'Bloquer pendant 40 minutes sur la première question difficile',
        'Écrire à toute vitesse sans relire jusqu\'à la sonnerie',
        'Rendre sa copie le premier sans vérifier'
      ],
      correctIndex: 0,
      explanation: 'Sécuriser les points faciles et réserver un temps de relecture évite les pertes de points par étourderie.'
    }
  ],
  'Avancé': [
    {
      topic: 'Synthèse & Fiches de révision',
      question: 'Qu\'est-ce qui caractérise une fiche de révision réellement efficace ?',
      options: [
        'Elle synthétise les définitions clés, formules et pièges fréquents sous forme de schémas et mots-clés personnels',
        'Elle recopie l\'intégralité du manuel scolaire mot pour mot',
        'Elle ne contient que des dessins décoratifs sans contenu notionnel',
        'Elle est achetée toute faite sans aucun travail de reformulation personnel'
      ],
      correctIndex: 0,
      explanation: 'L\'acte de résumer et de reformuler avec ses propres mots est le cœur du processus de mémorisation.'
    }
  ]
};

const ARABE_EXPANSION = {
  'Débutant': [
    {
      topic: 'أقسام الكلمة',
      question: 'إِلَى كَمْ قِسْمٍ تَنْقَسِمُ الكَلِمَةُ فِي اللُّغَةِ العَرَبِيَّةِ ؟',
      options: ['ثَلاَثَةُ أَقْسَامٍ : اسْمٌ، وَفِعْلٌ، وَحَرْفٌ', 'قِسْمَانِ فَقَطْ : اسْمٌ وَفِعْلٌ', 'أَرْبَعَةُ أَقْسَامٍ', 'خَمْسَةُ أَقْسَامٍ'],
      correctIndex: 0,
      explanation: 'تنقسم الكلمة إلى : اسم (يدل على معنى مجرد من الزمن)، وفعل (مقترن بزمن)، وحرف (لا يظهر معناه إلا مع غيره).'
    },
    {
      topic: 'حروف الجر',
      question: 'أَيٌّ مِنَ الخِيَارَاتِ التَّالِيَةِ يَتَضَمَّنُ حُرُوفَ الجَرِّ فَقَطْ ؟',
      options: ['مِنْ، إِلَى، عَنْ، عَلَى، فِي، البَاءُ، اللاَّمُ', 'إِنَّ، أَنَّ، كَأَنَّ، لَكِنَّ', 'هَذَا، هَذِهِ، هَؤُلاَءِ', 'قَالَ، يَكْتُبُ، اسْمَعْ'],
      correctIndex: 0,
      explanation: 'حروف الجر تجر الاسم الذي يليها بالكسرة أو ما ينوب عنها.'
    },
    {
      topic: 'أسماء الإشارة',
      question: 'مَا هُوَ اسْمُ الإِشَارَةِ المُنَاسِبُ لِلْمُفْرَدَةِ المُؤَنَّثَةِ القَرِيبَةِ ؟',
      options: ['هَذِهِ (مِثْلُ : هَذِهِ تِلْمِيذَةٌ نَشِيطَةٌ)', 'هَذَا', 'هَذَانِ', 'هَؤُلاَءِ'],
      correctIndex: 0,
      explanation: '« هَذِهِ » اسم إشارة للمفردة المؤنثة ولجمع غير العاقل.'
    },
    {
      topic: 'الأسماء الموصولة',
      question: 'مَا هُوَ الاِسْمُ المَوْصُولُ المُنَاسِبُ لِجَمْعِ المُذَكَّرِ العَاقِلِ ؟',
      options: ['الَّذِينَ (مِثْلُ : جَاءَ التَّلاَمِيذُ الَّذِينَ نَجَحُوا)', 'الَّتِي', 'الَّذِي', 'اللَّتَانِ'],
      correctIndex: 0,
      explanation: '« الَّذِينَ » اسم موصول لجماعة الذكور العقلاء.'
    },
    {
      topic: 'اللام الشمسية واللام القمرية',
      question: 'أَيٌّ مِنَ الكَلِمَاتِ التَّالِيَةِ تَحْتَوِي عَلَى « لاَمٍ قَمَرِيَّةٍ » تُنْطَقُ وَتُكْتَبُ ؟',
      options: ['القَلَمُ (تُنْطَقُ اللاَّمُ سَاكِنَةً)', 'الشَّمْسُ (لاَمٌ شَمْسِيَّةٌ مُدْغَمَةٌ)', 'التِّلْمِيذُ', 'الصَّبَاحُ'],
      correctIndex: 0,
      explanation: 'حروف اللام القمرية مجموعة في : « ابغ حجك وخف عقيمه »، والقاف منها.'
    },
    {
      topic: 'التاء المربوطة والمبسوطة',
      question: 'كَيْفَ تُكْتَبُ التَّاءُ فِي كَلِمَةِ « مَدْرَسَةٌ » عِنْدَ الوَقْفِ عَلَيْهَا ؟',
      options: ['تَاءٌ مَرْبُوطَةٌ (ـة / ة) تُلْفَظُ هَاءً عِنْدَ الوَقْفِ', 'تَاءٌ مَبْسُوطَةٌ (ت)', 'أَلِفٌ مَقْصُورَةٌ (ى)', 'وَاوٌ سَاكِنَةٌ'],
      correctIndex: 0,
      explanation: 'التاء المربوطة تنطق هاء عند الوقف (مَدْرَسَهْ)، وتاء عند الوصل.'
    },
    {
      topic: 'الجملة الفعلية',
      question: 'مِمَّ تَتَكَوَّنُ الجُمْلَةُ الفِعْلِيَّةُ الأَسَاسِيَّةُ فِي اللُّغَةِ العَرَبِيَّةِ ؟',
      options: ['مِنْ فِعْلٍ وَفَاعِلٍ (مِثْلُ : جَاءَ الحَقُّ)', 'مِنْ مُبْتَدَأٍ وَخَبَرٍ فَقَطْ', 'مِنْ حَرْفِ جَرٍّ وَاسْمٍ مَجْرُورٍ فَقَطْ', 'مِنْ أَدَاةِ نِدَاءٍ فَقَطْ'],
      correctIndex: 0,
      explanation: 'الجملة الفعلية هي كل جملة تبدأ بفعل، وركناها الأساسيان هما الفعل والفاعل.'
    },
    {
      topic: 'المفعول به وعلامة إعرابه',
      question: 'فِي جُمْلَةِ « رَسَمَ الوَلَدُ اللَّوْحَةَ »، مَا هُوَ إِعْرَابُ كَلِمَةِ « اللَّوْحَةَ » ؟',
      options: ['مَفْعُولٌ بِهِ مَنْصُوبٌ بِالفَتْحَةِ الظَّاهِرَةِ', 'فَاعِلٌ مَرْفُوعٌ بِالضَّمَّةِ', 'مُبْتَدَأٌ مَرْفُوعٌ', 'حَرْفُ عَطْفٍ'],
      correctIndex: 0,
      explanation: '« اللَّوْحَةَ » اسم منصوب وقع عليه فعل الفاعل فهو مفعول به.'
    },
    {
      topic: 'المثنى وإعرابه',
      question: 'مَا هِيَ عَلاَمَةُ رَفْعِ « المُثَنَّى » فِي اللُّغَةِ العَرَبِيَّةِ ؟',
      options: ['الأَلِفُ (مِثْلُ : حَضَرَ التِّلْمِيذَانِ)', 'الضَّمَّةُ', 'الوَاوُ', 'الكَسْرَةُ'],
      correctIndex: 0,
      explanation: 'يرفع المثنى بالألف (طالبانِ)، وينصب ويجر بالياء (طالبَيْنِ).'
    },
    {
      topic: 'أدوات النفي',
      question: 'أَيٌّ مِنَ الأَدَوَاتِ التَّالِيَةِ تُفِيدُ « نَفْيَ الفِعْلِ فِي المُسْتَقْبَلِ » ؟',
      options: ['لَنْ (مِثْلُ : لَنْ أُهْمِلَ وَاجِبَاتِي)', 'لَمْ (تَنْفِي فِي المَاضِي)', 'لاَ النَّاهِيَةُ', 'مَا المَصْدَرِيَّةُ'],
      correctIndex: 0,
      explanation: '« لَنْ » حرف نفي ونصب واستقبال يدخل على الفعل المضارع فينصبه.'
    },
    {
      topic: 'علامات الإعراب الأصلية',
      question: 'مَا هِيَ عَلاَمَةُ الرَّفْعِ الأَصْلِيَّةُ فِي الأَسْمَاءِ المُفْرَدَةِ ؟',
      options: ['الضَّمَّةُ الظَّاهِرَةُ عَلَى آخِرِهِ', 'الفَتْحَةُ', 'الكَسْرَةُ', 'السُّكُونُ'],
      correctIndex: 0,
      explanation: 'الضمة هي علامة الرفع الأصلية للاسم المفرد وجمع التكسير.'
    },
    {
      topic: 'الضمائر المنفصلة',
      question: 'مَا هُوَ ضَمِيرُ المُخَاطَبِ المُنَاسِبُ لِجَمْعِ الإِنَاثِ ؟',
      options: ['أَنْتُنَّ', 'أَنْتُمْ', 'هُمَا', 'هُمْ'],
      correctIndex: 0,
      explanation: '« أَنْتُنَّ » ضمير منفصل لمخاطبة جماعة الإناث.'
    },
    {
      topic: 'الظروف',
      question: 'فِي جُمْلَةِ « وَقَفَ العُصْفُورُ فَوْقَ الغُصْنِ »، مَا هُوَ نَوْعُ كَلِمَةِ « فَوْقَ » ؟',
      options: ['ظَرْفُ مَكَانٍ مَنْصُوبٌ', 'ظَرْفُ زَمَانٍ', 'حَرْفُ جَرٍّ', 'فِعْلٌ مَاضٍ'],
      correctIndex: 0,
      explanation: '« فَوْقَ » اسم يدل على مكان وقوع الفعل فهو ظرف مكان مفعول فيه.'
    },
    {
      topic: 'النعت والمنعوت',
      question: 'فِي جُمْلَةِ « قَرَأْتُ كِتَابًا مُفِيدًا »، مَا هُوَ إِعْرَابُ كَلِمَةِ « مُفِيدًا » ؟',
      options: ['نَعْتٌ (صِفَةٌ) مَنْصُوبٌ يَتْبَعُ المَنْعُوتَ', 'فَاعِلٌ مَرْفُوعٌ', 'مُبْتَدَأٌ مَرْفُوعٌ', 'خَبَرٌ مَرْفُوعٌ'],
      correctIndex: 0,
      explanation: '« مُفِيدًا » نعت تابع للمنعوت « كِتَابًا » في نصبه وتنوينه وتذكيره.'
    },
    {
      topic: 'حروف العطف',
      question: 'مَا هُوَ حَرْفُ العَطْفِ الَّذِي يُفِيدُ المُشَارَكَةَ دُونَ تَرْتِيبٍ ؟',
      options: ['الوَاوُ (مِثْلُ : جَاءَ عَلِيٌّ وَمُحَمَّدٌ)', 'ثُمَّ', 'الفَاءُ', 'حَتَّى'],
      correctIndex: 0,
      explanation: 'الواو تفيد مطلق الجمع والاشتراك بين المعطوف والمعطوف عليه دون ترتيب.'
    }
  ],
  'Intermédiaire': [
    {
      topic: 'إن وأخواتها',
      question: 'مَاذَا تَفْعَلُ « إِنَّ » وَأَخَوَاتُهَا عِنْدَ دُخُولِهَا عَلَى الجُمْلَةِ الاِسْمِيَّةِ ؟',
      options: ['تَنْصِبُ المُبْتَدَأَ وَيُسَمَّى اسْمَهَا، وَتَرْفَعُ الخَبَرَ وَيُسَمَّى خَبَرَهَا', 'تَرْفَعُ المُبْتَدَأَ وَتَنْصِبُ الخَبَرَ', 'تَرْفَعُ الاسْمَيْنِ مَعًا', 'تَجْزِمُ الفِعْلَ المضارع'],
      correctIndex: 0,
      explanation: 'إن وأخواتها حروف ناسخة تنصب المبتدأ وترفع الخبر : « إِنَّ العِلْمَ نُورٌ ».'
    },
    {
      topic: 'كان وأخواتها',
      question: 'مَاذَا تَفْعَلُ « كَانَ » وَأَخَوَاتُهَا عِنْدَ دُخُولِهَا عَلَى الجُمْلَةِ الاِسْمِيَّةِ ؟',
      options: ['تَرْفَعُ المُبْتَدَأَ وَيُسَمَّى اسْمَهَا، وَتَنْصِبُ الخَبَرَ وَيُسَمَّى خَبَرَهَا', 'تَنْصِبُ الاِثْنَيْنِ', 'تَجُرُّ الاِثْنَيْنِ', 'تَجْزِمُ المُبْتَدَأَ'],
      correctIndex: 0,
      explanation: 'كان وأخواتها أفعال ناقصة ناسخة ترفع المبتدأ وتنصب الخبر : « كَانَ الجَوُّ مُمْطِرًا ».'
    },
    {
      topic: 'جمع المذكر السالم',
      question: 'مَا هِيَ عَلاَمَةُ نَصْبِ وَجَرِّ « جَمْعِ المُذَكَّرِ السَّالِمِ » ؟',
      options: ['اليَاءُ (مِثْلُ : رَأَيْتُ المُعَلِّمِينَ، مَرَرْتُ بِالمُعَلِّمِينَ)', 'الفَتْحَةُ', 'الكَسْرَةُ', 'الأَلِفُ'],
      correctIndex: 0,
      explanation: 'يرفع جمع المذكر السالم بالواو (المعلمونَ)، وينصب ويجر بالياء (المعلمينَ).'
    },
    {
      topic: 'الأفعال الخمسة',
      question: 'مَا هِيَ عَلاَمَةُ رَفْعِ « الأَفْعَالِ الخَمْسَةِ » ؟',
      options: ['ثُبُوتُ النُّونِ (مِثْلُ : يَكْتُبُونَ، تَعْمَلِينَ)', 'الضَّمَّةُ المُقَدَّرَةُ', 'حَذْفُ النُّونِ', 'السُّكُونُ'],
      correctIndex: 0,
      explanation: 'ترفع الأفعال الخمسة بثبوت النون، وتجزم وتنصب بحذفها.'
    },
    {
      topic: 'الفعل الصحيح والمعتل',
      question: 'مَا هُوَ الفِعْلُ المِثَالُ فِي اللُّغَةِ العَرَبِيَّةِ ؟',
      options: ['الفِعْلُ المَعْتَلُّ الَّذِي يَكُونُ أَوَّلُهُ حَرْفَ عِلَّةٍ (مِثْلُ : وَعَدَ، يَئِسَ)', 'مَا كَانَ وَسَطُهُ حَرْفَ عِلَّةٍ', 'مَا كَانَ آخِرُهُ حَرْفَ عِلَّةٍ', 'مَا خَلاَ مِنْ حُرُوفِ العِلَّةِ'],
      correctIndex: 0,
      explanation: 'الفعل المثال أوله حرف علة (وَصَلَ)، والأجوف وسطه (قَالَ)، والناقص آخره (رَمَى).'
    }
  ],
  'Avancé': [
    {
      topic: 'الممنوع من الصرف',
      question: 'بِمَاذَا يُجَرُّ الاِسْمُ « المَمْنُوعُ مِنَ الصَّرْفِ » إِذَا لَمْ يُعَرَّفْ بِأَلْ وَلَمْ يُضَفْ ؟',
      options: ['يُجَرُّ بِالفَتْحَةِ النَّائِبَةِ عَنِ الكَسْرَةِ (مِثْلُ : صَلَّيْتُ فِي مَسَاجِدَ كَثِيرَةٍ)', 'يُجَرُّ بِالكَسْرَةِ', 'يُجَرُّ بِاليَاءِ', 'يُجْزَمُ بِالسُّكُونِ'],
      correctIndex: 0,
      explanation: 'الممنوع من الصرف لا ينون ويجر بالفتحة نيابة عن الكسرة إلا إذا اقترن بأل أو أضيف.'
    },
    {
      topic: 'الحال وصاحبها',
      question: 'مَا هِيَ الشُّرُوطُ الأَسَاسِيَّةُ فِي « الحَالِ المُفْرَدَةِ » وَفِي « صَاحِبِ الحَالِ » ؟',
      options: ['الحَالُ تَكُونُ نَكِرَةً مَنْصُوبَةً، وَصَاحِبُ الحَالِ يَكُونُ مَعْرِفَةً غَالِبًا', 'الحَالُ مَرْفُوعَةٌ دَوْمًا', 'الحَالُ مَعْرِفَةٌ وَصَاحِبُهَا نَكِرَةٌ', 'لاَ تُوجَدُ شُرُوطٌ'],
      correctIndex: 0,
      explanation: 'الحال وصف نكرة مشتق يبين هيئة صاحب الحال المعرفة وقت وقوع الفعل : « جَاءَ عَلِيٌّ ضَاحِكًا ».'
    }
  ]
};

const EDUCATION_ISLAMIQUE_BANK = {
  'Débutant': [
    {
      topic: 'القرآن الكريم - سورة الإخلاص',
      question: 'مَا مَعْنَى قَوْلِهِ تَعَالَى « اللَّهُ الصَّمَدُ » فِي سُورَةِ الإِخْلاَصِ ؟',
      options: [
        'الَّذِي تَصْمُدُ وَتَلْجَأُ إِلَيْهِ جَمِيعُ المَخْلُوقَاتِ فِي حَاجَاتِهَا وَلاَ يَحْتَاجُ إِلَى أَحَدٍ',
        'المَخْلُوقُ مِنَ النُّورِ',
        'الَّذِي يَأْكُلُ وَيَشْرَبُ كَالبَشَرِ',
        'الغَائِبُ عَنِ العَالَمِينَ'
      ],
      correctIndex: 0,
      explanation: 'الصمد هو السيد المقصود في الحوائج الذي كمل في صفاته وسؤدده ولا يحتاج لأحد.'
    },
    {
      topic: 'الصلوات - صلاة الجمعة',
      question: 'مَا هُوَ حُكْمُ « صَلاَةِ الجُمُعَةِ » عَلَى الرِّجَالِ المُقِيمِينَ فِي الإِسْلاَمِ ؟',
      options: [
        'فَرْضُ عَيْنٍ تُؤَدَّى رَكْعَتَيْنِ بَعْدَ سَمَاعِ الخُطْبَتَيْنِ',
        'سُنَّةٌ غَيْرُ مُؤَكَّدَةٍ',
        'مُبَاحٌ أَدَاؤُهَا كُلَّ شَهْرٍ مَرَّةً',
        'صَلاَةٌ تَطَوُّعِيَّةٌ كَصَلاَةِ العِيدِ'
      ],
      correctIndex: 0,
      explanation: 'قال تعالى : « يا أيها الذين آمنوا إذا نودي للصلاة من يوم الجمعة فاسعوا إلى ذكر الله وذروا البيع ».'
    },
    {
      topic: 'أخلاق المسلم - حق الجار',
      question: 'كَيْفَ يَكُونُ حُسْنُ الجِوَارِ كَمَا وَصَّانَا النَّبِيُّ صلى الله عليه وسلم ؟',
      options: [
        'بِكَفِّ الأَذَى عَنِ الجَارِ، وَتَفَقُّدِ حَالِهِ، وَمُسَاعَدَتِهِ عِنْدَ الحَاجَةِ',
        'بِرَفْعِ الصَّوْتِ وَإِلْقَاءِ النِّفَايَاتِ أَمَامَ بَابِهِ',
        'بِمُقَاطَعَتِهِ كُلِّيًّا وَعَدَمِ رَدِّ السَّلاَمِ عَلَيْهِ',
        'بِإِزْعَاجِهِ فِي أَوْقَاتِ النَّوْمِ'
      ],
      correctIndex: 0,
      explanation: 'قال النبي ﷺ : « ما زال جبريل يوصيني بالجار حتى ظننت أنه سيورثه ».'
    },
    {
      topic: 'أركان الإسلام - شهر رمضان',
      question: 'فِي أَيِّ شَهْرٍ هِجْرِيٍّ فُرِضَ صِيَامُ رَمَضَانَ وَأُنْزِلَ فِيهِ القُرْآنُ الكَرِيمُ ؟',
      options: [
        'شَهْرُ رَمَضَانَ المُبَارَكُ',
        'شَهْرُ شَعْبَانَ',
        'شَهْرُ رَجَبٍ',
        'شَهْرُ ذِي الحِجَّةِ'
      ],
      correctIndex: 0,
      explanation: 'قال تعالى : « شهر رمضان الذي أنزل فيه القرآن هدى للناس وبينات من الهدى والفرقان ».'
    },
    {
      topic: 'الطهارة - سنن الوضوء',
      question: 'أَيٌّ مِنَ الأَفْعَالِ التَّالِيَةِ يُعَدُّ « سُنَّةً » فِي الوُضُوءِ وَلَيْسَ فَرِيضَةً ؟',
      options: [
        'المَضْمَضَةُ وَالاِسْتِنْشَاقُ',
        'غَسْلُ الوَجْهِ',
        'غَسْلُ الرِّجْلَيْنِ إِلَى الكَعْبَيْنِ',
        'مَسْحُ الرَّأْسِ'
      ],
      correctIndex: 0,
      explanation: 'المضمضة والاستنشاق وغسل الكوعين ومسح الأذنين سنن مستحبة تُكمل أجر الوضوء.'
    },
    {
      topic: 'الآداب الإسلامية - إفشاء السلام',
      question: 'مَا هِيَ التَّحِيَّةُ الشَّرْعِيَّةُ الَّتِي أَمَرَنَا الإِسْلاَمُ بِإِفْشَائِهَا بَيْنَ النَّاسِ ؟',
      options: [
        'السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ',
        'صَبَاحُ الخَيْرِ فَقَطْ دُونَ غَيْرِهَا',
        'مَرْحَبًا بِدُونِ ذِكْرِ السَّلاَمِ',
        'التَّحِيَّةُ بِالإِشَارَةِ بِاليَدِ فَقَطْ'
      ],
      correctIndex: 0,
      explanation: 'قال رسول الله ﷺ : « ألا أدلكم على شيء إذا فعلتموه تحاببتم ؟ أفشوا السلام بينكم ».'
    },
    {
      topic: 'حق البيئة - عمارة الأرض',
      question: 'مَا هُوَ فَضْلُ « غَرْسِ الأَشْجَارِ » وَالنَّبَاتَاتِ فِي الإِسْلاَمِ ؟',
      options: [
        'يُكْتَبُ لِصَاحِبِهِ صَدَقَةٌ جَارِيَةٌ كُلَّمَا أَكَلَ مِنْهُ إِنْسَانٌ أَوْ طَيْرٌ أَوْ حَيَوَانٌ',
        'عَمَلٌ لاَ ثَوَابَ فِيهِ لِأَنَّهُ دُنْيَوِيٌّ',
        'مَكْرُوهٌ لِأَنَّهُ يُضَيِّعُ الوَقْتَ',
        'وَاجِبٌ فَقَطْ عَلَى الفَلاَّحِينَ'
      ],
      correctIndex: 0,
      explanation: 'قال ﷺ : « ما من مسلم يغرس غرسًا أو يزرع زرعًا فيأكل منه طير أو إنسان أو بهيمة إلا كان له به صدقة ».'
    },
    {
      topic: 'أمانة التلميذ - التحذير من الغش',
      question: 'مَا هُوَ حُكْمُ « الغِشِّ فِي الاِمْتِحَانَاتِ » المَدْرَسِيَّةِ فِي الإِسْلاَمِ ؟',
      options: [
        'حَرَامٌ شَرْعًا وَيَتَنَافَى مَعَ الأَمَانَةِ وَالصِّدْقِ',
        'جَائِزٌ لِلْحُصُولِ عَلَى نُقْطَةٍ جَيِّدَةٍ',
        'مُسْتَحَبٌّ إِذَا كَانَ الِامْتِحَانُ صَعْبًا',
        'مُبَاحٌ بِاتِّفَاقِ الزُّمَلاَءِ'
      ],
      correctIndex: 0,
      explanation: 'قال رسول الله ﷺ بعبارة قاطعة : « مَنْ غَشَّنَا فَلَيْسَ مِنَّا ».'
    },
    {
      topic: 'التربية - بر الوالدين',
      question: 'مَا مَعْنَى قَوْلِهِ تَعَالَى « وَلاَ تَنْهَرْهُمَا وَقُلْ لَهُمَا قَوْلاً كَرِيمًا » ؟',
      options: [
        'عَدَمُ رَفْعِ الصَّوْتِ عَلَيْهِمَا أَوْ مُخَاطَبَتِهِمَا بِغِلْظَةٍ، وَالتَّحَدُّثُ مَعَهُمَا بِأَدَبٍ وَاحْتِرَامٍ',
        'مُقَاطَعَتُهُمَا عِنْدَ الغَضَبِ',
        'طَلَبُ المَالِ مِنْهُمَا بِإِلْحَاحٍ',
        'تَرْكُهُمَا وَعَدَمُ زِيَارَتِهِمَا'
      ],
      correctIndex: 0,
      explanation: 'بر الوالدين أعظم القربات بعد توحيد الله تعالى، وقرن الله شكره بشكرهما.'
    },
    {
      topic: 'طلب العلم في الإسلام',
      question: 'مَا هِيَ مَنْزِلَةُ « طَلَبِ العِلْمِ وَالاِجْتِهَادِ فِي الدِّرَاسَةِ » فِي الإِسْلاَمِ ؟',
      options: [
        'فَرِيضَةٌ شَرْعِيَّةٌ وَسَبِيلٌ يُسَهِّلُ اللَّهُ بِهِ طَرِيقًا إِلَى الجَنَّةِ',
        'أَمْرٌ ثَانَوِيٌّ لاَ قِيمَةَ لَهُ فِي الدِّينِ',
        'مَطْلُوبٌ فَقَطْ لِكِبَارِ السِّنِّ',
        'مُبَاحٌ بَيْنَ أَوْقَاتِ الفَرَاغِ'
      ],
      correctIndex: 0,
      explanation: 'قال ﷺ : « مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الجَنَّةِ ».'
    },
    {
      topic: 'الصلوات المفروضة - عدد الركعات',
      question: 'كَمْ عَدَدُ رَكَعَاتِ صَلاَةِ « المَغْرِبِ » المَفْرُوضَةِ ؟',
      options: [
        'ثَلاَثُ رَكَعَاتٍ (رَكْعَتَانِ جَهْرًا وَرَكْعَةٌ سِرًّا)',
        'أَرْبَعُ رَكَعَاتٍ كُلُّهَا سِرًّا',
        'رَكْعَتَانِ فَقَطْ',
        'أَرْبَعُ رَكَعَاتٍ جَهْرًا'
      ],
      correctIndex: 0,
      explanation: 'صلاة المغرب ثلاث ركعات تؤدى فور غروب قرص الشمس.'
    },
    {
      topic: 'القرآن الكريم - عدد الأحزاب',
      question: 'كَمْ عَدَدُ أَحْزَابِ القُرْآنِ الكَرِيمِ كَامِلاً ؟',
      options: [
        'سِتُّونَ (60) حِزْبًا',
        'ثَلاَثُونَ (30) حِزْبًا',
        'أَرْبَعُونَ (40) حِزْبًا',
        'مِائَةٌ وَأَرْبَعَةَ عَشَرَ (114) حِزْبًا'
      ],
      correctIndex: 0,
      explanation: 'القرآن الكريم يتكون من 30 جزءًا مقسمة إلى 60 حزبًا و114 سورة كريمة.'
    },
    {
      topic: 'أركان الإيمان',
      question: 'كَمْ عَدَدُ أَرْكَانِ الإِيمَانِ فِي الإِسْلاَمِ ؟',
      options: ['سِتَّةُ أَرْكَانٍ', 'خَمْسَةُ أَرْكَانٍ', 'أَرْبَعَةُ أَرْكَانٍ', 'سَبْعَةُ أَرْكَانٍ'],
      correctIndex: 0,
      explanation: 'أركان الإيمان ستة : الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر خيره وشره.'
    },
    {
      topic: 'السيرة النبوية - مولد النبي',
      question: 'فِي أَيِّ مَدِينَةٍ وُلِدَ النَّبِيُّ مُحَمَّدٌ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ ؟',
      options: ['مَكَّةُ المُكَرَّمَةُ (فِي عَامِ الفِيلِ)', 'المَدِينَةُ المُنَوَّرَةُ', 'القُدْسُ الشَّرِيفُ', 'الطَّائِفُ'],
      correctIndex: 0,
      explanation: 'ولد النبي المصطفى بمكة المكرمة في عام الفيل، يتيم الأب.'
    },
    {
      topic: 'الصدق والأمانة',
      question: 'بِمَاذَا كَانَ يُلَقَّبُ رَسُولُ اللَّهِ ﷺ بَيْنَ قَوْمِهِ قَبْلَ البِعْثَةِ ؟',
      options: ['الصَّادِقُ الأَمِينُ', 'الشَّاعِرُ الفَصِيحُ', 'التَّاجِرُ الثَّرِيُّ', 'الفَارِسُ المِقْدَامُ'],
      correctIndex: 0,
      explanation: 'اشتهر عليه الصلاة والسلام بالصدق والأمانة حتى لقبه أهل مكة بالصادق الأمين.'
    }
  ],
  'Intermédiaire': [
    {
      topic: 'شروط صحة الصيام',
      question: 'مَا هِيَ شُرُوطُ وُجُوبِ وَصِحَّةِ الصِّيَامِ فِي الإِسْلاَمِ ؟',
      options: [
        'الإِسْلاَمُ، العَقْلُ، البُلُوغُ، القُدْرَةُ، وَالإِقَامَةُ (غَيْرُ مُسَافِرٍ)',
        'الغِنَى وَامْتِلاَكُ مَالٍ كَثِيرٍ فَقَطْ',
        'الصِّيَامُ وَاجِبٌ عَلَى الصِّغَارِ غَيْرِ البَالِغِينَ فَقَطْ',
        'الصِّيَامُ لاَ شُرُوطَ لَهُ'
      ],
      correctIndex: 0,
      explanation: 'يجب الصوم على المسلم العاقل البالغ القادر المقيم، ويسقط عن المريض والمسافر برخصة شرعية.'
    },
    {
      topic: 'سجود السهو',
      question: 'مَتَى يُشْرَعُ « سُجُودُ السَّهْوِ » قَبْلَ السَّلاَمِ فِي الصَّلاَةِ ؟',
      options: [
        'عِنْدَ نُقْصَانِ سُنَّةٍ مُؤَكَّدَةٍ مِنَ الصَّلاَةِ (كَالتَّشَهُّدِ الأَوَّلِ)',
        'عِنْدَ الزِّيَادَةِ فَقَطْ',
        'عِنْدَ الشَّكِّ دُونَ تَرْجِيحٍ',
        'فِي كُلِّ صَلاَةٍ وُجُوبًا'
      ],
      correctIndex: 0,
      explanation: 'يسجد المصلي سجدتي السهو قبل السلام عند النقصان، وبعد السلام عند الزيادة.'
    },
    {
      topic: 'زكاة الفطر',
      question: 'مَتَى يَجِبُ إِخْرَاجُ « زَكَاةِ الفِطْرِ » فِي شَهْرِ رَمَضَانَ ؟',
      options: [
        'قَبْلَ صَلاَةِ عِيدِ الفِطْرِ (وَتَجُوزُ قَبْلَ العِيدِ بِيَوْمٍ أَوْ يَوْمَيْنِ)',
        'بَعْدَ عِيدِ الأَضْحَى',
        'فِي أَيِّ وَقْتٍ مِنَ السَّنَةِ',
        'لاَ تُخْرَجُ إِلاَّ فِي شَهْرِ مُحَرَّمٍ'
      ],
      correctIndex: 0,
      explanation: 'زكاة الفطر طهرة للصائم من اللغو والرفث وطعمة للمساكين، وتخرج قبل صلاة العيد.'
    },
    {
      topic: 'صلح الحديبية',
      question: 'فِي أَيِّ سَنَةٍ هِجْرِيَّةٍ وَقَعَ « صُلْحُ الحُدَيْبِيَةِ » بَيْنَ المُسْلِمِينَ وَقُرَيْشٍ ؟',
      options: ['فِي السَّنَةِ السَّادِسَةِ لِلْهِجْرَةِ (6 هـ)', 'فِي السَّنَةِ الأُولَى', 'فِي السَّنَةِ التَّاسِعَةِ', 'فِي عَامِ الفَتْحِ (8 هـ)'],
      correctIndex: 0,
      explanation: 'وقع صلح الحديبية في ذي القعدة سنة 6 هـ، وسماه القرآن فتحًا مبينًا.'
    },
    {
      topic: 'مدارك الأحكام الشرعية',
      question: 'مَا هُوَ التَّعْرِيفُ الشَّرْعِيُّ لِلْحُكْمِ « المَنْدُوبِ » (المُسْتَحَبِّ) ؟',
      options: [
        'مَا يُثَابُ فَاعِلُهُ امْتِثَالاً وَلاَ يُعَاقَبُ تَارِكُهُ (كَالسِّوَاكِ وَصَلاَةِ الرَّوَاتِبِ)',
        'مَا يُعَاقَبُ تَارِكُهُ حَتْمًا',
        'مَا يُثَابُ تَارِكُهُ وَيُعَاقَبُ فَاعِلُهُ',
        'مَا اسْتَوَى فِعْلُهُ وَتَرْكُهُ'
      ],
      correctIndex: 0,
      explanation: 'المندوب أو المستحب هو ما طلب الشارع فعله طلباً غير جازم.'
    }
  ],
  'Avancé': [
    {
      topic: 'مقاصد الشريعة الإسلامية',
      question: 'مَا هِيَ « الكُلِّيَّاتُ الخَمْسُ » الَّتِي جَاءَتِ الشَّرِيعَةُ الإِسْلاَمِيَّةُ لِحِفْظِهَا ؟',
      options: [
        'حِفْظُ الدِّينِ، وَالنَّفْسِ، وَالعَقْلِ، وَالنَّسْلِ (العِرْضِ)، وَالمَالِ',
        'حِفْظُ التِّجَارَةِ، وَالسَّفَرِ، وَاللَّهْوِ، وَالصَّيْدِ، وَالبِنَاءِ',
        'حِفْظُ القُوَّةِ، وَالشُّهْرَةِ، وَالسُّلْطَانِ، وَالجَاهِ، وَالنَّسَبِ',
        'حِفْظُ الأَسْوَاقِ وَالأَمْوَالِ فَقَطْ'
      ],
      correctIndex: 0,
      explanation: 'تدور أحكام الشريعة ومقاصدها حول حفظ الضروريات الخمس لحماية مصالح البشر في الدارين.'
    },
    {
      topic: 'الاجتهاد والإجماع',
      question: 'مَا هُوَ تَعْرِيفُ « الإِجْمَاعِ » كَمَصْدَرٍ ثَالِثٍ مِنِ مَصَادِرِ التَّشْرِيعِ الإِسْلاَمِيِّ ؟',
      options: [
        'اتِّفَاقُ جَمِيعِ عُلَمَاءِ المُسْلِمِينَ المُجْتَهِدِينَ فِي عَصْرٍ مِنَ العُصُورِ عَلَى حُكْمٍ شَرْعِيٍّ بَعْدَ وَفَاةِ النَّبِيِّ ﷺ',
        'رَأْيُ فَقِيهٍ وَاحِدٍ بِمُفْرَدِهِ',
        'اتِّفَاقُ عَامَّةِ النَّاسِ فِي بَلَدٍ مُعَيَّنٍ',
        'العَمَلُ بِالعَادَاتِ وَالتَّقَالِيدِ القَدِيمَةِ'
      ],
      correctIndex: 0,
      explanation: 'الإجماع هو اتفاق مجتهدي الأمة بعد وفاة النبي ﷺ على أمر ديني لقوله ﷺ : « لا تجتمع أمتي على ضلالة ».'
    }
  ]
};

const PHYSIQUE_CHIMIE_BANK = {
  'Débutant': [
    {
      topic: 'Mécanique & Vitesse',
      question: 'Comment calcule-t-on la vitesse moyenne v d\'un mobile parcourant une distance d pendant une durée t ?',
      options: [
        'v = d / t (distance divisée par le temps)',
        'v = d × t (distance multipliée par le temps)',
        'v = t / d (temps divisé par la distance)',
        'v = d + t (distance plus le temps)'
      ],
      correctIndex: 0,
      explanation: 'La vitesse moyenne s\'exprime par la relation v = d / t, en mètres par seconde (m/s) ou kilomètres par heure (km/h).'
    },
    {
      topic: 'États de la matière',
      question: 'Comment appelle-t-on le passage de l\'état solide à l\'état liquide ?',
      options: ['La fusion', 'La vaporisation', 'La solidification', 'La condensation'],
      correctIndex: 0,
      explanation: 'La fusion est le passage de l\'état solide à liquide (ex: la glace qui fond en eau liquide).'
    },
    {
      topic: 'Le circuit électrique simple',
      question: 'Dans un circuit électrique en série, que se passe-t-il si l\'une des lampes grille ?',
      options: [
        'Le circuit est ouvert et toutes les autres lampes s\'éteignent',
        'Les autres lampes brillent deux fois plus fort',
        'Le générateur explose immédiatement',
        'Le courant électrique continue de circuler normalement'
      ],
      correctIndex: 0,
      explanation: 'Dans un circuit en série, le courant ne dispose que d\'une seule boucle : si un récepteur est défaillant, le circuit est interrompu.'
    },
    {
      topic: 'L\'air et l\'atmosphère',
      question: 'Quels sont les deux gaz majoritaires composant l\'air que nous respirons ?',
      options: [
        'Le diazote (environ 78%) et le dioxygène (environ 21%)',
        'Le dioxyde de carbone (90%) et l\'hélium (10%)',
        'Le dioxygène pur (100%)',
        'Le méthane (50%) et l\'hydrogène (50%)'
      ],
      correctIndex: 0,
      explanation: 'L\'air atmosphérique est constitué d\'environ 78% de diazote (N2) et 21% de dioxygène (O2).'
    },
    {
      topic: 'Masse volumique',
      question: 'Quelle est la masse d\'un litre d\'eau pure liquide à température ambiante ?',
      options: ['1 kilogramme (1 kg)', '100 grammes (100 g)', '10 kilogrammes (10 kg)', '500 grammes'],
      correctIndex: 0,
      explanation: 'La masse volumique de l\'eau pure est de 1 kg/L (ou 1 g/cm³).'
    }
  ],
  'Intermédiaire': [
    {
      topic: 'Loi d\'Ohm',
      question: 'Quelle est la relation traduisant la loi d\'Ohm pour un conducteur ohmique de résistance R ?',
      options: ['U = R × I', 'U = R / I', 'I = U × R', 'R = U × I'],
      correctIndex: 0,
      explanation: 'La tension U aux bornes d\'un résistor est proportionnelle à l\'intensité I : U = R × I (U en volts, R en ohms, I en ampères).'
    },
    {
      topic: 'Solutions acides et basiques (pH)',
      question: 'Quelle est la valeur du pH d\'une solution neutre à 25 °C ?',
      options: ['pH = 7', 'pH = 0', 'pH = 14', 'pH = 1'],
      correctIndex: 0,
      explanation: 'Une solution neutre (comme l\'eau pure) a un pH égal à 7. Si pH < 7, elle est acide ; si pH > 7, elle est basique.'
    },
    {
      topic: 'Poids et Masse',
      question: 'Quelle est la relation exacte entre le poids P d\'un objet et sa masse m sur Terre ?',
      options: [
        'P = m × g (avec g ≈ 9,8 N/kg ou 10 N/kg)',
        'P = m / g',
        'P = m + g',
        'Le poids et la masse sont strictement la même grandeur physique'
      ],
      correctIndex: 0,
      explanation: 'La masse m (en kg) est invariable, tandis que le poids P (en newtons N) est la force de pesanteur exercée sur l\'objet : P = m × g.'
    },
    {
      topic: 'Combustions',
      question: 'Quel gaz trouble l\'eau de chaux et permet ainsi d\'identifier sa présence lors d\'une réaction chimique ?',
      options: [
        'Le dioxyde de carbone (CO2)',
        'Le dioxygène (O2)',
        'Le dihydrogène (H2)',
        'Le diazote (N2)'
      ],
      correctIndex: 0,
      explanation: 'Le dioxyde de carbone (CO2) réagit avec l\'eau de chaux en formant un précipité blanc de carbonate de calcium.'
    },
    {
      topic: 'Puissance et Énergie électrique',
      question: 'Comment calcule-t-on l\'énergie électrique E consommée par un appareil de puissance P pendant une durée t ?',
      options: ['E = P × t', 'E = P / t', 'E = t / P', 'E = P + t'],
      correctIndex: 0,
      explanation: 'L\'énergie électrique s\'exprime par E = P × t (en joules avec t en secondes, ou en watt-heures avec t en heures).'
    }
  ],
  'Avancé': [
    {
      topic: 'Atomes et Ions',
      question: 'Que devient un atome neutre lorsqu\'il perd un électron ?',
      options: [
        'Il devient un ion positif (cation)',
        'Il devient un ion négatif (anion)',
        'Il se transforme en neutron',
        'Sa masse diminue de moitié'
      ],
      correctIndex: 0,
      explanation: 'En perdant un électron chargé négativement, l\'atome possède plus de protons que d\'électrons et devient un cation (ex: Na+).'
    },
    {
      topic: 'Énergie cinétique',
      question: 'Quelle est l\'expression mathématique de l\'énergie cinétique Ec d\'un solide de masse m en translation à la vitesse v ?',
      options: ['Ec = 1/2 × m × v²', 'Ec = m × v', 'Ec = m × g × h', 'Ec = 1/2 × m² × v'],
      correctIndex: 0,
      explanation: 'L\'énergie cinétique dépend du carré de la vitesse : Ec = 1/2 × m × v² (en joules J).'
    }
  ]
};

const EDUCATION_PHYSIQUE_EXPANSION = {
  'Débutant': [
    {
      topic: 'Échauffement & Prévention',
      question: 'Pourquoi est-il indispensable de s\'échauffer progressivement avant un effort physique ?',
      options: [
        'Augmenter la température des muscles, le rythme cardiaque et prévenir les blessures',
        'Pour se fatiguer avant même de commencer le match',
        'Pour avoir froid plus rapidement',
        'C\'est une perte de temps inutile'
      ],
      correctIndex: 0,
      explanation: 'L\'échauffement prépare le système cardiovasculaire, augmente l\'élasticité musculaire et prévient claquages et entorses.'
    },
    {
      topic: 'Hydratation',
      question: 'Quelle est la bonne attitude concernant l\'hydratation lors d\'une séance de sport ?',
      options: [
        'Boire régulièrement par petites gorgées d\'eau fraîche avant, pendant et après l\'effort',
        'Ne jamais boire pendant l\'effort même en été',
        'Boire 2 litres de soda glacé en une seule fois à la mi-temps',
        'Attendre d\'avoir la gorge totalement sèche pour commencer à boire'
      ],
      correctIndex: 0,
      explanation: 'Une perte de 1% du poids du corps en eau réduit les capacités physiques de 10% : boire par petites gorgées régulières est essentiel.'
    }
  ],
  'Intermédiaire': [
    {
      topic: 'Fréquence cardiaque & Récupération',
      question: 'Qu\'indique une fréquence cardiaque qui redescend rapidement vers son niveau de repos après un effort ?',
      options: [
        'Une bonne condition physique et une bonne récupération cardiovasculaire',
        'Une anomalie cardiaque grave',
        'Que l\'athlète n\'a fait aucun effort',
        'Que la séance était trop longue'
      ],
      correctIndex: 0,
      explanation: 'La vitesse de récupération du rythme cardiaque après l\'effort est un indicateur direct de l\'endurance et de l\'entraînement du cœur.'
    }
  ],
  'Avancé': [
    {
      topic: 'Filières énergétiques',
      question: 'Lors d\'une course d\'endurance prolongée (ex: 20 minutes de demi-fond), quelle filière énergétique fournit l\'essentiel de l\'énergie ?',
      options: [
        'La filière aérobie (consommation d\'oxygène)',
        'La filière anaérobie alactique (efforts explosifs de moins de 10 secondes)',
        'La force magnétique terrestre',
        'La déshydratation'
      ],
      correctIndex: 0,
      explanation: 'Les efforts d\'endurance de moyenne et longue durée reposent sur la filière aérobie qui utilise l\'oxygène pour oxyder sucres et lipides.'
    }
  ]
};

module.exports = {
  METHODOLOGIE_BANK,
  ARABE_EXPANSION,
  EDUCATION_ISLAMIQUE_BANK,
  PHYSIQUE_CHIMIE_BANK,
  EDUCATION_PHYSIQUE_EXPANSION
};
