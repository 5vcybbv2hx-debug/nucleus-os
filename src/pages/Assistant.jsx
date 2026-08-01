import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import LegacyBanner from '@/components/LegacyBanner';

const SUGGESTIONS = [
  'Was hat Metro letzten Monat gekostet?',
  'Welche Fristen laufen diesen Monat ab?',
  'Wie hoch waren die Fixkosten im Bar-Bereich?',
  'Welche Dokumente warten noch auf Verarbeitung?',
  'Zeige mir alle offenen Rechnungen',
  'Wann ist der nächste TÜV-Termin?',
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hallo! Ich bin dein Atlas-Assistent. Frag mich nach Dokumenten, Finanzen, Fristen oder Fahrzeugen — ich habe Zugriff auf alle deine Daten.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Fetch all relevant context data
    const [docs, finances, deadlines, vehicles, tasks] = await Promise.all([
      base44.entities.Document.list('-created_date', 50),
      base44.entities.FinanceEntry.list('-date', 100),
      base44.entities.Deadline.list('-dueDate', 50),
      base44.entities.Vehicle.list(),
      base44.entities.Task.list('-created_date', 50),
    ]);

    const context = `
Du bist ein intelligenter Projekt-Assistent. Heutiges Datum: ${new Date().toLocaleDateString('de-DE')}.

DOKUMENTE (${docs.length} insgesamt):
${docs.slice(0, 20).map(d => `- ${d.title} | ${d.documentType} | ${d.bereich} | ${d.status} | Betrag: ${d.ocrBetrag || '-'}€ | Absender: ${d.ocrAbsender || '-'} | Datum: ${d.ocrDatum || d.created_date}`).join('\n')}

FINANZEN (${finances.length} Einträge):
${finances.slice(0, 50).map(f => `- ${f.date} | ${f.type} | ${f.amount}€ | ${f.category || '-'} | ${f.bereich} | ${f.description || ''}`).join('\n')}

FRISTEN (${deadlines.length} insgesamt):
${deadlines.slice(0, 20).map(d => `- ${d.title} | ${d.category} | fällig: ${d.dueDate} | ${d.status} | ${d.bereich}`).join('\n')}

FAHRZEUGE (${vehicles.length} insgesamt):
${vehicles.map(v => `- ${v.name} ${v.kennzeichen || ''} | HU: ${v.huDatum || '-'} | Versicherung: ${v.versicherungAblauf || '-'} | ${v.kilometerstand || 0}km`).join('\n')}

AUFGABEN (${tasks.length} insgesamt):
${tasks.slice(0, 20).map(t => `- ${t.title} | ${t.status} | ${t.bereich}`).join('\n')}

Beantworte die Frage des Nutzers präzise und hilfreich auf Deutsch. Nutze die echten Daten aus dem Kontext.
Wenn du Beträge zusammenrechnest, zeige die Summe. Wenn du Fristen nennst, berechne wie viele Tage noch.
Formatiere die Antwort übersichtlich mit Markdown.
    `;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `${context}\n\nFrage: ${userMsg}`,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: typeof res === 'string' ? res : JSON.stringify(res) }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen pt-14 pb-20">
      <LegacyBanner />
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">KI-Assistent</div>
            <div className="text-xs text-muted-foreground">Zugriff auf alle Daten</div>
          </div>
        </div>
        <button onClick={() => setMessages([{ role: 'assistant', content: 'Hallo! Wie kann ich helfen?' }])} className="p-2 hover:bg-secondary rounded-xl transition-colors">
          <RotateCcw size={14} className="text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground'
            }`}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0">
                  {msg.content}
                </ReactMarkdown>
              ) : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Analysiere Daten...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (only at start) */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Vorschläge:</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)} className="text-xs px-3 py-1.5 bg-secondary border border-border rounded-xl hover:bg-secondary/80 transition-colors text-left">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 items-end bg-card border border-border rounded-2xl px-3 py-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Frag mich etwas..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none max-h-32 min-h-[36px]"
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-40 transition-all flex-shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}