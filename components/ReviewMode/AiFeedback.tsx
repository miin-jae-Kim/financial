'use client';

interface AiFeedbackProps {
  feedback: string;
  isCorrect: boolean;
}

export function AiFeedback({ feedback, isCorrect }: AiFeedbackProps) {
  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <h3 className="text-sm font-medium text-white">AI 피드백</h3>
        {isCorrect && (
          <span className="text-xs bg-terminal-green/20 text-terminal-green px-2 py-1 rounded">
            ✓ 예측 적중
          </span>
        )}
      </div>
      <div className="text-sm text-terminal-muted whitespace-pre-wrap">
        {feedback}
      </div>
    </div>
  );
}
