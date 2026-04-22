'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CsvPreviewRow } from '@/lib/admin/question-import';
import { buildCsvPreview } from '@/lib/admin/question-import';

export function QuestionImportPreview() {
  const [rows, setRows] = useState<CsvPreviewRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const summary = useMemo(() => {
    const validCount = rows.filter((row) => row.status === 'valid').length;
    const invalidCount = rows.length - validCount;
    return { validCount, invalidCount };
  }, [rows]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setRows([]);
    setError(null);
    setFileName(file?.name ?? null);

    if (!file) {
      return;
    }

    setIsParsing(true);

    try {
      const content = await file.text();
      const previewRows = buildCsvPreview(content);
      setRows(previewRows);
      if (previewRows.length === 0) {
        setError('Önizlenecek veri bulunamadı.');
      }
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'CSV önizlemesi hazırlanamadı.');
    } finally {
      setIsParsing(false);
    }
  }

  function clearPreview() {
    setRows([]);
    setError(null);
    setFileName(null);
  }

  return (
    <Card padding="md" variant="elevated" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-text-secondary">CSV Önizleme</p>
          <p className="text-xs text-text-secondary">
            {fileName ? `${fileName} · ${summary.validCount} geçerli · ${summary.invalidCount} hatalı` : 'Dosya seçildiğinde ilk satırlar burada doğrulanır.'}
          </p>
        </div>
        {rows.length > 0 || error ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearPreview}>Temizle</Button>
        ) : null}
      </div>

      <div>
        <label htmlFor="csv_preview_file" className="mb-2 block text-sm font-medium text-text-primary">Önizleme dosyası</label>
        <input
          id="csv_preview_file"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="w-full rounded-xl border border-white/[0.08] bg-bg-elevated px-4 py-3 text-sm text-text-primary file:mr-3 file:rounded-lg file:border-0 file:bg-primary-500 file:px-3 file:py-2 file:font-semibold file:text-white"
        />
      </div>

      {isParsing ? <p className="text-sm text-text-secondary">CSV önizlemesi hazırlanıyor...</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {rows.length > 0 ? (
        <div className="space-y-2">
          {rows.slice(0, 8).map((row) => (
            <div key={`${row.rowNumber}-${row.questionText}`} className="rounded-xl bg-bg-primary/60 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text-primary">Satır {row.rowNumber}: {row.questionText || 'Soru metni okunamadı'}</p>
                  <p className="mt-1 text-xs text-text-secondary">{row.leagueScope || 'scope yok'} · zorluk {row.difficulty || '—'} · doğru cevap {row.correctAnswer || '—'}</p>
                </div>
                <span className={row.status === 'valid' ? 'text-xs font-semibold text-success' : 'text-xs font-semibold text-danger'}>
                  {row.status === 'valid' ? 'Geçerli' : 'Hatalı'}
                </span>
              </div>
              {row.errors.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-danger">
                  {row.errors.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          {rows.length > 8 ? <p className="text-xs text-text-secondary">Yalnızca ilk 8 satır gösteriliyor.</p> : null}
        </div>
      ) : null}
    </Card>
  );
}
