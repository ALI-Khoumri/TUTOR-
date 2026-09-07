export interface QuizOption {
  letter: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface QuizQuestion {
  questionNumber: number;
  questionText: string;
  options: QuizOption[];
  selectedLetter?: string;
}

export interface ParsedTutorContent {
  isQuiz: boolean;
  introText: string;
  questions: QuizQuestion[];
  outroText: string;
  rawText: string;
}

/**
 * Parses any quiz format from tutor AI messages.
 * Handles:
 * - Numbered or unnumbered questions followed by a), b), c) or A), B), C)
 * - Multiple questions in a single message
 * - Intro and outro separation
 * - Clean option extraction without leaking paragraphs
 */
export function parseQuizFromText(text: string): ParsedTutorContent {
  if (!text) {
    return { isQuiz: false, introText: '', questions: [], outroText: '', rawText: '' };
  }

  const raw = text.trim();

  // Fast check: Must contain option indicators like 'a)' or 'A)' and 'b)' or 'B)'
  const hasA = /(?:^|\s|\n)[aA][\)\.\:\-]\s+/.test(raw);
  const hasB = /(?:^|\s|\n)[bB][\)\.\:\-]\s+/.test(raw);

  if (!hasA || !hasB) {
    return { isQuiz: false, introText: raw, questions: [], outroText: '', rawText: raw };
  }

  // If the message is a pure feedback message without new question, skip
  if (/^(?:très bien|bravo|félicitations|exact|parfait|bonne réponse|mauvaise réponse|c'est correct|c'est faux)/i.test(raw) &&
      !raw.toLowerCase().includes('quelle') &&
      !raw.toLowerCase().includes('combien') &&
      !raw.toLowerCase().includes('voici') &&
      !raw.toLowerCase().includes('calcule') &&
      !raw.toLowerCase().includes('?')) {
    return { isQuiz: false, introText: raw, questions: [], outroText: '', rawText: raw };
  }

  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const questions: QuizQuestion[] = [];
  let introLines: string[] = [];
  let outroLines: string[] = [];

  let currentTitleLines: string[] = [];
  let currentOptions: QuizOption[] = [];
  let inQuizZone = false;
  let finishedQuiz = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is an option: "a) ...", "A) ...", "A. ...", "- A) ..."
    const optMatch = line.match(/^(?:[-*•]\s*)?([a-dA-D])[\)\.\:\-]\s+(.+)$/i);

    // Check if line is a question header: "Question 1 : ...", "1. ...", "Mini-quiz :", "**Question 2 :**"
    const isQHeader = /^(?:\*{0,2})(?:Question\s*\d+|Mini-quiz|Quiz|\d+[\.\)])\s*[:.-]?\s*(.*)$/i.test(line);

    // Check if line is an outro sentence: "Réfléchis à ces questions...", "À toi de jouer...", "Dis-moi ta réponse..."
    const isOutroLine = /^(?:réfléchis|à toi|donne-moi|dis-moi|fais ton choix|je vais te dire|bon courage)/i.test(line);

    if (isOutroLine && currentOptions.length >= 2) {
      // Save current question
      questions.push({
        questionNumber: questions.length + 1,
        questionText: cleanQuestionTitle(currentTitleLines.join(' ')),
        options: currentOptions
      });
      currentTitleLines = [];
      currentOptions = [];
      finishedQuiz = true;
      outroLines.push(line);
      continue;
    }

    if (finishedQuiz) {
      outroLines.push(line);
      continue;
    }

    if (optMatch) {
      inQuizZone = true;
      const letter = optMatch[1].toUpperCase();
      let optContent = optMatch[2].replace(/[\*\_]/g, '').trim();

      // Check if outro was glued to this option
      const outroCut = optContent.search(/(?:Réfléchis|À toi|Dis-moi|Donne-moi|Je vais te dire)/i);
      if (outroCut > 0) {
        outroLines.push(optContent.substring(outroCut).trim());
        optContent = optContent.substring(0, outroCut).trim();
      }

      currentOptions.push({ letter, text: optContent });
    } else {
      // Normal line (not an option line)
      if (currentOptions.length >= 2) {
        // We were in a question and now hit a non-option line -> current question is complete!
        questions.push({
          questionNumber: questions.length + 1,
          questionText: cleanQuestionTitle(currentTitleLines.join(' ')),
          options: currentOptions
        });
        currentOptions = [];
        currentTitleLines = [];
      }

      if (!inQuizZone && !isQHeader && !line.includes('?') && !isQuestionLike(line)) {
        introLines.push(line);
      } else {
        inQuizZone = true;
        // Clean out header prefix like "Question 2 :" or "Mini-quiz :"
        const cleanedTitlePart = line.replace(/^(?:\*{0,2})(?:Question\s*\d+|Mini-quiz|Quiz|\d+[\.\)])\s*[:.-]?\s*/i, '').trim();
        if (cleanedTitlePart.length > 0) {
          currentTitleLines.push(cleanedTitlePart);
        }
      }
    }
  }

  // If there's an active question remaining at the end
  if (currentOptions.length >= 2) {
    questions.push({
      questionNumber: questions.length + 1,
      questionText: cleanQuestionTitle(currentTitleLines.join(' ')),
      options: currentOptions
    });
  } else if (currentTitleLines.length > 0) {
    outroLines.push(...currentTitleLines);
  }

  const isQuiz = questions.length > 0;

  return {
    isQuiz,
    introText: introLines.join('\n').trim(),
    questions,
    outroText: outroLines.join('\n').trim(),
    rawText: raw
  };
}

function isQuestionLike(line: string): boolean {
  const l = line.toLowerCase();
  return l.includes('?') || l.includes('quelle') || l.includes('combien') || l.includes('calcule') || l.includes('trouve') || l.includes('un groupe') || l.includes('un étudiant');
}

function cleanQuestionTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    return 'Question';
  }
  return title
    .replace(/^[\*\s:.-]+|[\*\s:.-]+$/g, '')
    .replace(/^\*{1,2}(.*?)\*{1,2}$/, '$1')
    .trim();
}
