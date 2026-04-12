import fs from 'node:fs';
import { extractAfterColon, normalizeText, stripQuotes } from '#parser-utils/text-normalizer';
import type { QuizQuestion, QuizSpec, StudyCard } from '../types.js';

function cleanValue(line: string): string {
  let value = extractAfterColon(line);
  value = value.replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '');
  return normalizeText(stripQuotes(value)).trim();
}

function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function ensureUniqueId(base: string, used: Set<string>, fallback: string): string {
  let id = base || fallback;
  if (!id) {
    id = fallback;
  }
  let candidate = id;
  let counter = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${id}-${counter}`;
    counter += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function parseTitle(lines: string[]): string {
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return normalizeText(trimmed.replace(/^#\s+/, '').trim());
    }
  }
  return '';
}

function parseMetadata(lines: string[]): {
  grade: string;
  subject: string;
  topic: string;
} {
  let grade = '';
  let subject = '';
  let topic = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('---')) {
      break;
    }
    if (/^\*\*Grade:\*\*/i.test(trimmed)) {
      grade = cleanValue(trimmed);
    }
    if (/^\*\*Subject:\*\*/i.test(trimmed)) {
      subject = cleanValue(trimmed);
    }
    if (/^\*\*Topic:\*\*/i.test(trimmed)) {
      topic = cleanValue(trimmed);
    }
  }

  return { grade, subject, topic };
}

function parseStudyCards(lines: string[], startIndex: number, endIndex: number): StudyCard[] {
  const cards: StudyCard[] = [];
  const usedIds = new Set<string>();
  let i = startIndex;

  while (i <= endIndex) {
    const line = lines[i]?.trim() ?? '';
    if (/^###\s*Card:/i.test(line)) {
      const title = normalizeText(line.replace(/^###\s*Card:/i, '').trim());
      const card: StudyCard = {
        id: '',
        title,
        front: '',
        back: '',
      };

      i += 1;
      for (; i <= endIndex; i += 1) {
        const current = lines[i]?.trim() ?? '';
        if (!current) {
          continue;
        }
        if (/^###\s*Card:/i.test(current) || /^##\s+/i.test(current) || current.startsWith('---')) {
          i -= 1;
          break;
        }
        if (/^\*\*Front:\*\*/i.test(current)) {
          card.front = cleanValue(current);
          continue;
        }
        if (/^\*\*Back:\*\*/i.test(current)) {
          card.back = cleanValue(current);
          continue;
        }
        if (/^\*\*Hint:\*\*/i.test(current)) {
          card.hint = cleanValue(current);
        }
      }

      const baseId = slugify(title) || `card-${cards.length + 1}`;
      card.id = ensureUniqueId(baseId, usedIds, `card-${cards.length + 1}`);
      cards.push(card);
    }
    i += 1;
  }

  return cards;
}

function parseQuizQuestions(lines: string[], startIndex: number, endIndex: number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let i = startIndex;

  while (i <= endIndex) {
    const line = lines[i]?.trim() ?? '';
    const headerMatch = line.match(/^###\s*(Q\d+)\s*:\s*(.+)$/i);
    if (headerMatch && headerMatch[1] && headerMatch[2]) {
      const id = normalizeText(headerMatch[1].toUpperCase().trim());
      const questionText = normalizeText(headerMatch[2].trim());
      const optionMap: Record<string, string> = {};
      const question: QuizQuestion = {
        id,
        question: questionText,
        type: 'mcq',
        options: [],
        answer: '',
        explanation: '',
      };

      i += 1;
      for (; i <= endIndex; i += 1) {
        const current = lines[i]?.trim() ?? '';
        if (!current) {
          continue;
        }
        if (
          /^###\s*Q\d+\s*:/i.test(current) ||
          /^##\s+/i.test(current) ||
          current.startsWith('---')
        ) {
          i -= 1;
          break;
        }
        if (/^\*\*Type:\*\*/i.test(current)) {
          const parsedType = cleanValue(current).toLowerCase();
          question.type = parsedType === 'mcq' ? 'mcq' : 'mcq';
          continue;
        }
        const optionMatch = current.match(/^\*\*([A-D]):\*\*/i);
        if (optionMatch && optionMatch[1]) {
          const key = optionMatch[1].toUpperCase();
          optionMap[key] = cleanValue(current);
          continue;
        }
        if (/^\*\*Answer:\*\*/i.test(current)) {
          question.answer = cleanValue(current).toUpperCase();
          continue;
        }
        if (/^\*\*Explanation:\*\*/i.test(current)) {
          question.explanation = cleanValue(current);
          continue;
        }
        if (/^\*\*Topic Tag:\*\*/i.test(current)) {
          question.topicTag = cleanValue(current);
        }
      }

      question.options = ['A', 'B', 'C', 'D'].flatMap((key) => {
        const text = optionMap[key];
        return typeof text === 'string' ? [{ key, text }] : [];
      });

      questions.push(question);
    }
    i += 1;
  }

  return questions;
}

function parseSummary(lines: string[], startIndex: number, endIndex: number): string[] {
  const summary: string[] = [];
  for (let i = startIndex; i <= endIndex; i += 1) {
    const line = lines[i]?.trim() ?? '';
    const match = line.match(/^[-*]\s+(.+)$/);
    if (match && match[1]) {
      summary.push(normalizeText(stripQuotes(match[1].trim())));
    }
  }
  return summary;
}

function findSectionIndices(lines: string[]): {
  studyCardsStart: number;
  quizStart: number;
  summaryStart: number;
} {
  let studyCardsStart = -1;
  let quizStart = -1;
  let summaryStart = -1;

  lines.forEach((line, index) => {
    const trimmed = line.trim().toLowerCase();
    if (trimmed === '## study cards') {
      studyCardsStart = index;
    }
    if (trimmed === '## quiz questions') {
      quizStart = index;
    }
    if (trimmed === '## summary') {
      summaryStart = index;
    }
  });

  return { studyCardsStart, quizStart, summaryStart };
}

export function parseQuizSpecFile(specPath: string): QuizSpec {
  const raw = fs.readFileSync(specPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  const title = parseTitle(lines);
  const { grade, subject, topic } = parseMetadata(lines);
  const { studyCardsStart, quizStart, summaryStart } = findSectionIndices(lines);

  const studyCards =
    studyCardsStart >= 0
      ? parseStudyCards(lines, studyCardsStart + 1, (quizStart > 0 ? quizStart : lines.length) - 1)
      : [];
  const quizQuestions =
    quizStart >= 0
      ? parseQuizQuestions(
          lines,
          quizStart + 1,
          (summaryStart > 0 ? summaryStart : lines.length) - 1
        )
      : [];
  const summary = summaryStart >= 0 ? parseSummary(lines, summaryStart + 1, lines.length - 1) : [];

  const fallbackTitle = [subject, topic].filter(Boolean).join(' - ');
  const finalTitle = title || (fallbackTitle ? `${fallbackTitle} Quiz` : 'Quiz');

  return {
    title: finalTitle,
    grade,
    subject,
    topic,
    studyCards,
    quizQuestions,
    summary,
  };
}
