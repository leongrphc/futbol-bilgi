type QuestionOption = { key: 'A' | 'B' | 'C' | 'D'; text: string };

type QuestionInsertPayload = {
  league_scope: 'turkey' | 'europe' | 'world';
  league: string | null;
  category: string;
  sub_category: string | null;
  difficulty: number;
  season_range: string | null;
  team_tags: string[];
  era_tag: string | null;
  question_text: string;
  options: QuestionOption[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  media: null;
  times_shown: number;
  times_correct: number;
  avg_answer_time_ms: number;
  reported_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type BuildQuestionInput = {
  league_scope: string;
  league?: string | null;
  category: string;
  sub_category?: string | null;
  difficulty: string | number;
  season_range?: string | null;
  team_tags?: string | null;
  era_tag?: string | null;
  question_text: string;
  correct_answer: string;
  explanation?: string | null;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  options_json?: string | null;
  is_active?: boolean;
};

export type CsvImportSummary = {
  payloads: QuestionInsertPayload[];
  errors: string[];
};

const VALID_SCOPES = new Set(['turkey', 'europe', 'world']);
const VALID_ANSWERS = new Set(['A', 'B', 'C', 'D']);

function normalizeText(value: string | null | undefined) {
  return String(value ?? '').trim();
}

export function parseTeamTags(value: string | null | undefined) {
  return normalizeText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeScope(value: string) {
  const normalized = normalizeText(value).toLowerCase();
  return VALID_SCOPES.has(normalized) ? (normalized as 'turkey' | 'europe' | 'world') : null;
}

function normalizeAnswer(value: string) {
  const normalized = normalizeText(value).toUpperCase();
  return VALID_ANSWERS.has(normalized) ? (normalized as 'A' | 'B' | 'C' | 'D') : null;
}

function normalizeDifficulty(value: string | number) {
  const numeric = typeof value === 'number' ? value : Number(normalizeText(String(value)));
  if (!Number.isFinite(numeric)) return null;
  const rounded = Math.round(numeric);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function buildOptionsFromColumns(input: BuildQuestionInput) {
  const options = [
    { key: 'A' as const, text: normalizeText(input.option_a) },
    { key: 'B' as const, text: normalizeText(input.option_b) },
    { key: 'C' as const, text: normalizeText(input.option_c) },
    { key: 'D' as const, text: normalizeText(input.option_d) },
  ];

  return options.every((option) => option.text) ? options : null;
}

function buildOptionsFromJson(rawJson: string | null | undefined) {
  const source = normalizeText(rawJson);
  if (!source) return null;

  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('Şıklar JSON formatında çözümlenemedi.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Şıklar JSON alanı bir dizi olmalı.');
  }

  const normalized = parsed.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new Error('Şıklar JSON alanındaki her kayıt nesne olmalı.');
    }

    const key = normalizeAnswer(String((item as { key?: unknown }).key ?? ''));
    const text = normalizeText(String((item as { text?: unknown }).text ?? ''));

    if (!key || !text) {
      throw new Error('Şıklar JSON alanında A/B/C/D anahtarı ve metin zorunlu.');
    }

    return { key, text };
  });

  const ordered = ['A', 'B', 'C', 'D'].map((key) => normalized.find((option) => option.key === key)).filter(Boolean) as QuestionOption[];
  return ordered.length === 4 ? ordered : null;
}

export function buildQuestionInsertPayload(input: BuildQuestionInput): QuestionInsertPayload {
  const leagueScope = normalizeScope(input.league_scope);
  if (!leagueScope) {
    throw new Error('Lig scope yalnızca turkey, europe veya world olabilir.');
  }

  const difficulty = normalizeDifficulty(input.difficulty);
  if (!difficulty) {
    throw new Error('Zorluk 1 ile 5 arasında olmalı.');
  }

  const questionText = normalizeText(input.question_text);
  if (!questionText) {
    throw new Error('Soru metni boş bırakılamaz.');
  }

  const category = normalizeText(input.category);
  if (!category) {
    throw new Error('Kategori zorunlu.');
  }

  const correctAnswer = normalizeAnswer(input.correct_answer);
  if (!correctAnswer) {
    throw new Error('Doğru cevap yalnızca A, B, C veya D olabilir.');
  }

  const options = buildOptionsFromColumns(input) ?? buildOptionsFromJson(input.options_json);
  if (!options || options.length !== 4) {
    throw new Error('4 adet geçerli şık zorunlu.');
  }

  if (!options.find((option) => option.key === correctAnswer)) {
    throw new Error('Doğru cevap mevcut şıklarla eşleşmiyor.');
  }

  const now = new Date().toISOString();

  return {
    league_scope: leagueScope,
    league: normalizeText(input.league) || null,
    category,
    sub_category: normalizeText(input.sub_category) || null,
    difficulty,
    season_range: normalizeText(input.season_range) || null,
    team_tags: parseTeamTags(input.team_tags),
    era_tag: normalizeText(input.era_tag) || null,
    question_text: questionText,
    options,
    correct_answer: correctAnswer,
    explanation: normalizeText(input.explanation) || null,
    media: null,
    times_shown: 0,
    times_correct: 0,
    avg_answer_time_ms: 0,
    reported_count: 0,
    is_active: input.is_active ?? true,
    created_at: now,
    updated_at: now,
  };
}

function parseCsvRows(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  const normalized = content.replace(/^﻿/, '').replace(/\r\n/g, '\n');

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const nextChar = normalized[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if (char === '\n' && !inQuotes) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  return rows;
}

export function parseCsvImport(content: string, defaultActive = true): CsvImportSummary {
  const rows = parseCsvRows(content);
  if (rows.length < 2) {
    return { payloads: [], errors: ['CSV içinde başlık satırı ve en az bir veri satırı olmalı.'] };
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => normalizeText(header).toLowerCase());
  const payloads: QuestionInsertPayload[] = [];
  const errors: string[] = [];
  const seenQuestions = new Set<string>();

  dataRows.forEach((row, rowIndex) => {
    if (row.every((cell) => !normalizeText(cell))) {
      return;
    }

    const record = Object.fromEntries(headers.map((header, cellIndex) => [header, row[cellIndex] ?? '']));

    try {
      const payload = buildQuestionInsertPayload({
        league_scope: record.league_scope,
        league: record.league,
        category: record.category,
        sub_category: record.sub_category,
        difficulty: record.difficulty,
        season_range: record.season_range,
        team_tags: record.team_tags,
        era_tag: record.era_tag,
        question_text: record.question_text,
        correct_answer: record.correct_answer,
        explanation: record.explanation,
        option_a: record.option_a,
        option_b: record.option_b,
        option_c: record.option_c,
        option_d: record.option_d,
        options_json: record.options,
        is_active: normalizeText(record.is_active) ? normalizeText(record.is_active).toLowerCase() === 'true' : defaultActive,
      });

      const duplicateKey = payload.question_text.toLocaleLowerCase('tr-TR');
      if (seenQuestions.has(duplicateKey)) {
        errors.push(`Satır ${rowIndex + 2}: Aynı CSV içinde yinelenen soru metni bulundu.`);
        return;
      }

      seenQuestions.add(duplicateKey);
      payloads.push(payload);
    } catch (error) {
      errors.push(`Satır ${rowIndex + 2}: ${error instanceof Error ? error.message : 'Geçersiz veri.'}`);
    }
  });

  return { payloads, errors };
}
