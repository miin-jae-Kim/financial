'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CombinedData, JournalEntry, DataSnapshot } from '@/types';
import { createDataSnapshot } from '@/lib/data';
import { fetchEntryById, updateEntryAPI } from '@/lib/journal';
import { DataComparison } from './DataComparison';
import { AiFeedback } from './AiFeedback';

interface ReviewModeProps {
  data: CombinedData;
  entryId: string;
  onClose: () => void;
}

export function ReviewMode({ data, entryId, onClose }: ReviewModeProps) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [actualResult, setActualResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadEntry() {
      try {
        const loadedEntry = await fetchEntryById(entryId);
        if (loadedEntry) {
          setEntry(loadedEntry);
          if (loadedEntry.result) {
            setActualResult(loadedEntry.result.actual);
          }
        }
      } catch (error) {
        console.error('Error loading entry:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEntry();
  }, [entryId]);

  async function handleGenerateFeedback() {
    if (!entry || !actualResult) return;

    setIsGeneratingFeedback(true);
    try {
      const currentSnapshot = createDataSnapshot(data);

      const response = await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry,
          actualResult,
          currentSnapshot,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }

      const { feedback } = await response.json();
      const isCorrect = entry.prediction === actualResult;

      // 결과 저장
      await updateEntryAPI(entry.id, {
        result: {
          actual: actualResult,
          snapshotAfter: currentSnapshot,
          aiFeedback: feedback,
          feedbackGeneratedAt: new Date().toISOString(),
          isCorrect,
        },
      });

      // 엔트리 다시 로드
      const updatedEntry = await fetchEntryById(entryId);
      if (updatedEntry) {
        setEntry(updatedEntry);
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      alert('피드백 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingFeedback(false);
    }
  }

  async function handleSave() {
    if (!entry || !actualResult) return;

    setIsSaving(true);
    try {
      const currentSnapshot = createDataSnapshot(data);
      const isCorrect = entry.prediction === actualResult;

      // 피드백이 없으면 생성
      if (!entry.result?.aiFeedback) {
        await handleGenerateFeedback();
      } else {
        // 피드백이 있으면 결과만 업데이트
        await updateEntryAPI(entry.id, {
          result: {
            actual: actualResult,
            snapshotAfter: currentSnapshot,
            aiFeedback: entry.result.aiFeedback,
            feedbackGeneratedAt: entry.result.feedbackGeneratedAt,
            isCorrect,
          },
        });
      }

      const updatedEntry = await fetchEntryById(entryId);
      if (updatedEntry) {
        setEntry(updatedEntry);
      }
    } catch (error) {
      console.error('Error saving result:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
          <p className="text-terminal-muted text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-6">
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
          <p className="text-terminal-muted text-sm">엔트리를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const predictionLabels: Record<string, Record<string, string>> = {
    rate: {
      raise: '인상',
      hold: '동결',
      cut: '인하',
    },
    sp500: {
      up: '상승',
      neutral: '중립',
      down: '하락',
    },
  };

  const predictionLabel = predictionLabels[entry.category]?.[entry.prediction] || entry.prediction;
  const actualLabel = predictionLabels[entry.category]?.[actualResult] || actualResult;
  const isCorrect = entry.prediction === actualResult;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">📊 복기: {entry.eventTitle}</h2>
          <p className="text-sm text-terminal-muted mt-1">
            발표일: {format(new Date(entry.eventDate), 'yyyy-MM-dd')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-terminal-muted hover:text-white transition-colors"
        >
          ✕ 닫기
        </button>
      </div>

      {/* Prediction vs Actual */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-terminal-muted mb-2">내 예측</h3>
          <p className="text-xl font-bold text-white">{predictionLabel}</p>
        </div>
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-terminal-muted mb-2">실제 결과</h3>
          {entry.result ? (
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-white">{actualLabel}</p>
              {isCorrect ? (
                <span className="text-terminal-green">✓</span>
              ) : (
                <span className="text-terminal-red">✗</span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                className="w-full bg-terminal-bg border border-terminal-border rounded p-2 text-sm text-white focus:outline-none focus:border-terminal-green"
              >
                <option value="">선택하세요</option>
                {Object.keys(predictionLabels[entry.category] || {}).map((key) => (
                  <option key={key} value={key}>
                    {predictionLabels[entry.category][key]}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSave}
                disabled={!actualResult || isSaving}
                className="w-full px-4 py-2 text-sm bg-terminal-green text-terminal-bg rounded font-medium hover:bg-terminal-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '저장 중...' : '결과 저장'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Comparison */}
      {entry.result && (
        <DataComparison snapshotBefore={entry.snapshot} snapshotAfter={entry.result.snapshotAfter} />
      )}

      {/* Memo */}
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-2">
          내 판단 메모 ({format(new Date(entry.createdAt), 'yyyy-MM-dd')} 작성)
        </h3>
        <p className="text-sm text-terminal-muted whitespace-pre-wrap">{entry.memo}</p>
      </div>

      {/* AI Feedback */}
      {entry.result?.aiFeedback ? (
        <AiFeedback feedback={entry.result.aiFeedback} isCorrect={entry.result.isCorrect} />
      ) : entry.result ? (
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
          <button
            onClick={handleGenerateFeedback}
            disabled={isGeneratingFeedback}
            className="w-full px-4 py-2 text-sm bg-terminal-green text-terminal-bg rounded font-medium hover:bg-terminal-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingFeedback ? '피드백 생성 중...' : '🤖 AI 피드백 생성'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
