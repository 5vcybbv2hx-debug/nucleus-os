import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Clock, ChevronRight } from 'lucide-react';
import { CHECKIN_QUESTIONS } from '@/components/executive/mockData';

export default function CheckIn() {
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);

  const handleAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = CHECKIN_QUESTIONS.length;

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <Link to="/" className="lg:hidden -ml-1 p-1 rounded-lg hover:bg-secondary">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <div className="flex items-center gap-2.5">
          <ClipboardCheck size={22} className="text-primary" />
          <h1 className="text-2xl font-semibold">Executive Check-In</h1>
        </div>
      </div>

      {!started ? (
        // Start Screen
        <div className="max-w-md">
          <div className="p-8 bg-card border border-border rounded-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-5">
              <ClipboardCheck size={28} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Bereit für den Check-In?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              5–10 Minuten. Nicht jeden Tag dieselben Fragen.
              Die Fragen entstehen später dynamisch aus deinem Arbeitskontext.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
              <Clock size={14} />
              <span>~{totalQuestions} Fragen · ca. 5–10 Minuten</span>
            </div>
            <button
              onClick={() => setStarted(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Check-In starten <ChevronRight size={16} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground/60 text-center mt-4">
            Check-In-Ergebnisse bleiben privat. Sie werden später für personalisierte Tagespläne verwendet.
          </p>
        </div>
      ) : (
        // Questions
        <div className="max-w-2xl space-y-6">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{answeredCount} / {totalQuestions}</span>
          </div>

          {CHECKIN_QUESTIONS.map((q, i) => (
            <div key={q.id} className="p-6 bg-card border border-border rounded-2xl">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm font-medium leading-snug pt-0.5">{q.question}</p>
              </div>

              {q.type === 'text' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={e => handleAnswer(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              )}

              {q.type === 'energy' && (
                <div className="flex gap-2">
                  {q.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(q.id, opt)}
                      className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                        answers[q.id] === opt
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Finish */}
          <div className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl">
            <p className="text-sm text-muted-foreground">
              {answeredCount === totalQuestions ? 'Check-In abgeschlossen' : `${totalQuestions - answeredCount} Fragen offen`}
            </p>
            <Link
              to="/"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                answeredCount === totalQuestions
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {answeredCount === totalQuestions ? 'Fertig' : 'Trotzdem beenden'}
            </Link>
          </div>
        </div>
      )}

      {/* Zurück-Link (Desktop) */}
      <Link to="/" className="hidden lg:inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-8">
        <ArrowLeft size={14} /> Zurück zum Workspace
      </Link>
    </div>
  );
}
