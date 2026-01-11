'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { CombinedData, EventType, PredictionCategory, JournalEntry, DataSnapshot, AiOpinions } from '@/types';
import { createDataSnapshot, generateDataHash } from '@/lib/data';
import { fetchEntryByEventId, createEntryAPI, updateEntryAPI } from '@/lib/journal';
import { DataSnapshotDisplay } from './DataSnapshot';
import { AiOpinions as AiOpinionsDisplay } from './AiOpinions';

interface MemoModeProps {
  data: CombinedData;
  eventId: string;
  eventType: EventType;
  eventDate: string;
  eventTitle: string;
  onClose: () => void;
  onSave: () => void;
}

export function MemoMode({
  data,
  eventId,
  eventType,
  eventDate,
  eventTitle,
  onClose,
  onSave,
}: MemoModeProps) {
  const [category, setCategory] = useState<PredictionCategory>('rate');
  const [prediction, setPrediction] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [usedAiOpinion, setUsedAiOpinion] = useState<string | null>(null);
  const [aiOpinions, setAiOpinions] = useState<AiOpinions | null>(null);
  const [isLoadingOpinions, setIsLoadingOpinions] = useState(false);
  const [existingEntry, setExistingEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const snapshot = createDataSnapshot(data);
  const daysUntil = differenceInDays(new Date(eventDate), new Date());

  useEffect(() => {
    async function loadEntry() {
      try {
        const entry = await fetchEntryByEventId(eventId);
        if (entry) {
          setExistingEntry(entry);
          setCategory(entry.category);
          setPrediction(entry.prediction);
          setMemo(entry.memo);
          setUsedAiOpinion(entry.usedAiOpinion);
          setAiOpinions(entry.aiOpinions);
        } else {
          // 새 엔트리인 경우 AI 의견 생성
          await generateOpinions();
        }
      } catch (error) {
        console.error('Error loading entry:', error);
        await generateOpinions();
      } finally {
        setIsLoading(false);
      }
    }

    loadEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function generateOpinions() {
    setIsLoadingOpinions(true);
    try {
      const currentHash = generateDataHash(snapshot);
      
      // 기존 의견이 있고 데이터가 변경되지 않았으면 재사용
      if (existingEntry?.aiOpinions && existingEntry.aiOpinions.dataHash === currentHash) {
        setAiOpinions(existingEntry.aiOpinions);
        setIsLoadingOpinions(false);
        return;
      }

      const response = await fetch('/api/ai-opinions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          category,
          snapshot,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI opinions');
      }

      const opinions = await response.json();
      setAiOpinions(opinions);
    } catch (error) {
      console.error('Error generating AI opinions:', error);
    } finally {
      setIsLoadingOpinions(false);
    }
  }

  function handleSelectOpinion(opinionId: string) {
    if (!aiOpinions) return;
    
    const opinion = Object.values(aiOpinions.opinions).find(o => o.id === opinionId);
    if (!opinion) return;

    setUsedAiOpinion(opinionId);
    setMemo(opinion.summary);
    setPrediction(
      category === 'rate'
        ? opinion.stance === 'bullish' ? 'raise' : opinion.stance === 'bearish' ? 'cut' : 'hold'
        : opinion.stance === 'bullish' ? 'up' : opinion.stance === 'bearish' ? 'down' : 'neutral'
    );
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const entryData: Omit<JournalEntry, 'id' | 'createdAt'> = {
        eventId,
        eventType,
        eventDate,
        eventTitle,
        snapshot,
        aiOpinions: aiOpinions!,
        aiOpinionsGeneratedAt: aiOpinions!.generatedAt,
        category,
        prediction,
        memo,
        usedAiOpinion,
      };

      if (existingEntry) {
        await updateEntryAPI(existingEntry.id, entryData);
      } else {
        await createEntryAPI(entryData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving entry:', error);
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

  const predictionOptions =
    category === 'rate'
      ? [
          { value: 'raise', label: '인상' },
          { value: 'hold', label: '동결' },
          { value: 'cut', label: '인하' },
        ]
      : [
          { value: 'up', label: '상승' },
          { value: 'neutral', label: '중립' },
          { value: 'down', label: '하락' },
        ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">📝 판단 기록: {eventTitle}</h2>
          <p className="text-sm text-terminal-muted mt-1">
            발표 예정일: {format(new Date(eventDate), 'yyyy-MM-dd')} ({daysUntil}일 후)
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-terminal-muted hover:text-white transition-colors"
        >
          ✕ 닫기
        </button>
      </div>

      {/* Category Selection */}
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
        <label className="text-sm font-medium text-white mb-2 block">카테고리:</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="rate"
              checked={category === 'rate'}
              onChange={async (e) => {
                const newCategory = e.target.value as PredictionCategory;
                setCategory(newCategory);
                setPrediction('');
                setMemo('');
                setUsedAiOpinion(null);
                // 카테고리 변경 시 AI 의견 재생성
                setIsLoadingOpinions(true);
                try {
                  const response = await fetch('/api/ai-opinions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      eventType,
                      category: newCategory,
                      snapshot,
                    }),
                  });
                  if (response.ok) {
                    const opinions = await response.json();
                    setAiOpinions(opinions);
                  }
                } catch (error) {
                  console.error('Error generating AI opinions:', error);
                } finally {
                  setIsLoadingOpinions(false);
                }
              }}
              className="text-terminal-green"
            />
            <span className="text-sm text-white">금리</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="sp500"
              checked={category === 'sp500'}
              onChange={async (e) => {
                const newCategory = e.target.value as PredictionCategory;
                setCategory(newCategory);
                setPrediction('');
                setMemo('');
                setUsedAiOpinion(null);
                // 카테고리 변경 시 AI 의견 재생성
                setIsLoadingOpinions(true);
                try {
                  const response = await fetch('/api/ai-opinions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      eventType,
                      category: newCategory,
                      snapshot,
                    }),
                  });
                  if (response.ok) {
                    const opinions = await response.json();
                    setAiOpinions(opinions);
                  }
                } catch (error) {
                  console.error('Error generating AI opinions:', error);
                } finally {
                  setIsLoadingOpinions(false);
                }
              }}
              className="text-terminal-green"
            />
            <span className="text-sm text-white">S&P 방향</span>
          </label>
        </div>
      </div>

      {/* Data Snapshot */}
      <DataSnapshotDisplay snapshot={snapshot} />

      {/* AI Opinions */}
      {aiOpinions && (
        <div>
          <AiOpinionsDisplay
            opinions={aiOpinions}
            onSelect={handleSelectOpinion}
            selectedId={usedAiOpinion}
            onRegenerate={generateOpinions}
            isLoading={isLoadingOpinions}
          />
        </div>
      )}

      {/* Prediction Form */}
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">예측:</label>
          <div className="flex gap-4">
            {predictionOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  checked={prediction === option.value}
                  onChange={(e) => setPrediction(e.target.value)}
                  className="text-terminal-green"
                />
                <span className="text-sm text-white">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">메모:</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="판단 근거를 입력하세요..."
            className="w-full bg-terminal-bg border border-terminal-border rounded p-3 text-sm text-white placeholder-terminal-muted focus:outline-none focus:border-terminal-green"
            rows={6}
          />
          {usedAiOpinion && (
            <p className="text-xs text-terminal-muted mt-2">
              (AI 의견 '{aiOpinions?.opinions.bullish.id === usedAiOpinion ? aiOpinions.opinions.bullish.title : aiOpinions?.opinions.neutral.id === usedAiOpinion ? aiOpinions.opinions.neutral.title : aiOpinions?.opinions.bearish.title}' 선택됨)
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm border border-terminal-border rounded text-terminal-muted hover:text-white transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={!prediction || !memo || isSaving}
          className="px-4 py-2 text-sm bg-terminal-green text-terminal-bg rounded font-medium hover:bg-terminal-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
