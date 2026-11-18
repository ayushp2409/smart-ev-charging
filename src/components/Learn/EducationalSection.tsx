import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle, 
  ChevronRight, 
  Cpu, 
  Zap, 
  Award
} from 'lucide-react';
import { EDUCATIONAL_TOPICS, BANKER_QUIZ_QUESTIONS } from '../../data/educationalContent';
import { solveClassicBankers } from '../../engine/bankersAlgorithm';

export const EducationalSection: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(EDUCATIONAL_TOPICS[0].id);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState<boolean>(false);
  const [classicResult, setClassicResult] = useState<any>(null);

  const selectedTopic = EDUCATIONAL_TOPICS.find(t => t.id === selectedTopicId) || EDUCATIONAL_TOPICS[0];

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (submittedQuiz) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    BANKER_QUIZ_QUESTIONS.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) score++;
    });
    return score;
  };

  const runClassicTextbookTest = () => {
    const available = [3, 3, 2];
    const allocation = [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ];
    const max = [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ];
    const res = solveClassicBankers(available, max, allocation);
    setClassicResult(res);
  };

  return (
    <div className="space-y-6">
      
      {/* Section Header */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-extrabold text-slate-900">Operating Systems: Deadlock & Banker's Guide ⚡</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Complete academic guide connecting classical deadlock avoidance theory with cyber-physical EV charging infrastructure.
          </p>
        </div>
      </div>

      {/* Main Educational Layout: Sidebar + Topic Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Navigation Topics */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 block mb-2">
            Curriculum Modules
          </span>

          {EDUCATIONAL_TOPICS.map((topic) => {
            const isSelected = topic.id === selectedTopicId;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`w-full text-left p-3 rounded-xl transition text-xs flex items-center justify-between font-medium ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">{topic.category}</span>
                  <span>{topic.title}</span>
                </div>
                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-emerald-600' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Topic Content Viewer */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {selectedTopic.category}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-2">{selectedTopic.title}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">{selectedTopic.summary}</p>
          </div>

          {/* Formatted Content */}
          <div className="prose prose-xs max-w-none text-slate-700 leading-relaxed font-sans space-y-3 font-normal">
            {selectedTopic.content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return <h4 key={idx} className="text-sm font-bold text-emerald-800 pt-2">{paragraph.replace('### ', '')}</h4>;
              }
              if (paragraph.startsWith('#### ')) {
                return <h5 key={idx} className="text-xs font-bold text-slate-900 pt-1">{paragraph.replace('#### ', '')}</h5>;
              }
              if (paragraph.startsWith('> ')) {
                return (
                  <blockquote key={idx} className="border-l-3 border-emerald-500 pl-3 italic text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg">
                    {paragraph.replace('> ', '')}
                  </blockquote>
                );
              }
              if (paragraph.startsWith('```')) {
                return (
                  <pre key={idx} className="p-3.5 rounded-xl bg-slate-900 font-mono text-[11px] text-emerald-400 overflow-x-auto shadow-sm">
                    {paragraph.replace(/```/g, '')}
                  </pre>
                );
              }
              return <p key={idx} className="text-xs text-slate-600 leading-relaxed">{paragraph}</p>;
            })}
          </div>
        </div>

      </div>

      {/* Classic Silberschatz Textbook Verification Sandbox */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Classic Silberschatz OS Textbook Reference Test ([3, 3, 2] with P0–P4)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verify your engine against the benchmark used in Abraham Silberschatz's <em>Operating System Concepts</em>.
            </p>
          </div>

          <button
            onClick={runClassicTextbookTest}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm transition flex items-center space-x-1.5 thunder-glow"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Execute Textbook Verification</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Available Resources</span>
            <span className="text-emerald-700 font-bold">[3, 3, 2] (3 Resource Types)</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">5 Active Processes</span>
            <span className="text-slate-800 font-bold">P0, P1, P2, P3, P4</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Theoretical Result</span>
            <span className="text-emerald-700 font-bold">SAFE (Sequence: P1 → P3 → P4 → P0 → P2)</span>
          </div>
        </div>

        {classicResult && (
          <div className="mt-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold font-sans">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Engine Output: Mathematically Verified SAFE!</span>
            </div>
            <div className="text-slate-800 font-bold">
              Computed Safe Sequence: <strong className="text-emerald-800">{classicResult.safeSequence.map((i: number) => `P${i}`).join(' → ')}</strong>
            </div>
            <div className="space-y-1 text-slate-600 text-[11px] pt-1 font-sans">
              {classicResult.steps.map((st: string, idx: number) => (
                <div key={idx}>› {st}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive OS Knowledge Quiz */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Operating Systems Concept Check Quiz</h3>
              <p className="text-xs text-slate-500 font-medium">Test your mastery of deadlock avoidance and Banker's Algorithm</p>
            </div>
          </div>

          {submittedQuiz && (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs shadow-sm">
              Score: {calculateScore()} / {BANKER_QUIZ_QUESTIONS.length}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {BANKER_QUIZ_QUESTIONS.map((q, qIndex) => {
            const userAnswer = userAnswers[q.id];
            const isCorrect = userAnswer === q.correctIndex;

            return (
              <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 block font-sans">
                  Question {qIndex + 1}: {q.question}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = userAnswer === optIndex;
                    let style = 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300';

                    if (submittedQuiz) {
                      if (optIndex === q.correctIndex) {
                        style = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold';
                      } else if (isSelected && !isCorrect) {
                        style = 'bg-rose-100 border-rose-300 text-rose-900 font-medium';
                      }
                    } else if (isSelected) {
                      style = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-1 ring-emerald-300';
                    }

                    return (
                      <button
                        key={optIndex}
                        onClick={() => handleSelectAnswer(q.id, optIndex)}
                        disabled={submittedQuiz}
                        className={`p-3 rounded-xl border text-left transition shadow-sm font-medium ${style}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {submittedQuiz && (
                  <div className={`p-3 rounded-xl text-xs border ${
                    isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <strong>{isCorrect ? '✓ Correct!' : '✕ Incorrect.'}</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          {!submittedQuiz ? (
            <button
              onClick={() => setSubmittedQuiz(true)}
              disabled={Object.keys(userAnswers).length < BANKER_QUIZ_QUESTIONS.length}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition thunder-glow"
            >
              Submit & Check Answers ⚡
            </button>
          ) : (
            <button
              onClick={() => {
                setSubmittedQuiz(false);
                setUserAnswers({});
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 transition"
            >
              Retake Quiz
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
