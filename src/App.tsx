import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, Clipboard, Ghost, History, Loader2, Moon, Save, ShieldAlert, Sparkles, Terminal, X } from "lucide-react";
import { analyze, loadJournal, saveJournal } from "./tauri";
import type { Analysis, JournalEntry, RiskLevel } from "./types";

const examples = ["rm -rf ./build", "sudo apt update", "git reset --hard HEAD~1", "curl -fsSL https://example.com/install.sh | sh"];

function App() {
  const [command, setCommand] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  useEffect(() => { void loadJournal().then(setJournal); }, []);

  async function inspect() {
    if (!command.trim() || busy) return;
    setBusy(true);
    setAnalysis(null);
    try { setAnalysis(await analyze(command)); } finally { setBusy(false); }
  }

  async function save() {
    if (!analysis) return;
    const entry: JournalEntry = { id: crypto.randomUUID(), command, analysis, createdAt: new Date().toISOString() };
    await saveJournal(entry);
    setJournal((items) => [entry, ...items]);
  }

  function copy() {
    void navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="shell">
      <div className="grain" />
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Ghost size={22} /></div><div><strong>GHOSTSHELL</strong><span>THE HAUNTED AI TERMINAL</span></div></div>
        <div className="header-actions"><span className="status-dot" /> LOCAL MODE <button className="icon-btn" aria-label="Toggle theme"><Moon size={16} /></button><button className="journal-btn" onClick={() => setShowJournal(true)}><History size={15} /> JOURNAL <b>{journal.length}</b></button></div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={14} /> A FRIENDLY SPIRIT FOR DANGEROUS COMMANDS</div>
        <h1>What will you <em>summon?</em></h1>
        <p>Paste a shell command. GhostShell will explain its intent, inspect its risks, and whisper what the machine remembers.</p>
      </section>

      <section className="terminal-card">
        <div className="terminal-head"><div className="window-dots"><i /><i /><i /></div><span><Terminal size={14} /> command_input</span><span className="never">NEVER EXECUTED</span></div>
        <textarea value={command} onChange={(e) => setCommand(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void inspect(); }} placeholder="type or paste a command here..." spellCheck={false} />
        <div className="terminal-foot"><span>CTRL + ENTER TO INSPECT</span><div><button className="secondary" onClick={copy} disabled={!command}>{copied ? <Check size={15} /> : <Clipboard size={15} />} {copied ? "COPIED" : "COPY"}</button><button className="inspect" onClick={() => void inspect()} disabled={!command.trim() || busy}>{busy ? <Loader2 className="spin" size={16} /> : <ShieldAlert size={16} />} {busy ? "READING..." : "INSPECT COMMAND"}</button></div></div>
      </section>

      <div className="examples"><span>TRY A SPECIMEN</span>{examples.map((item) => <button key={item} onClick={() => setCommand(item)}>{item}</button>)}</div>

      <AnimatePresence mode="wait">
        {analysis && <motion.section className="analysis-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} key={analysis.explanation}>
          <div className="panel explanation"><div className="panel-title"><span><BookOpen size={16} /> EXPLANATION</span><small>LOCAL ANALYSIS</small></div><p>{analysis.explanation}</p><div className={`risk ${analysis.risk}`}><ShieldAlert size={18} /><div><strong>{analysis.risk.toUpperCase()} RISK</strong><span>{analysis.riskReason}</span></div></div>{analysis.findings.length > 0 && <ul>{analysis.findings.map((item) => <li key={item}>{item}</li>)}</ul>}</div>
          <div className="panel ghost-panel"><div className="panel-title"><span><Ghost size={16} /> GHOST RESPONSE</span><small>NO CLOUDS. NO EXECUTION.</small></div><div className="ghost-copy"><div className="ghost-orb"><Ghost size={28} /></div><p>“{analysis.ghost}”</p></div><div className="panel-actions"><button className="secondary" onClick={save}><Save size={15} /> SAVE TO JOURNAL</button><span>Analysis engine: {analysis.source}</span></div></div>
        </motion.section>}
      </AnimatePresence>

      <footer><span><span className="status-dot" /> LOCAL-FIRST &nbsp;·&nbsp; YOUR COMMANDS STAY HERE</span><span>GHOSTSHELL v0.1.0 &nbsp;·&nbsp; <a href="https://github.com/" target="_blank" rel="noreferrer">OPEN SOURCE</a></span></footer>

      <AnimatePresence>{showJournal && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowJournal(false)}><motion.aside className="journal" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} onClick={(e) => e.stopPropagation()}><div className="journal-head"><div><h2>Command Journal</h2><p>Saved locally on this machine.</p></div><button className="icon-btn" onClick={() => setShowJournal(false)} aria-label="Close journal"><X size={18} /></button></div>{journal.length === 0 ? <div className="empty"><BookOpen size={30} /><p>No ghosts recorded yet.</p></div> : journal.map((item) => <button className="journal-item" key={item.id} onClick={() => { setCommand(item.command); setAnalysis(item.analysis); setShowJournal(false); }}><code>{item.command}</code><span><span className={`mini-risk ${item.analysis.risk}`} /> {new Date(item.createdAt).toLocaleString()}</span></button>)}</motion.aside></motion.div>}</AnimatePresence>
    </main>
  );
}

export default App;

export type { RiskLevel };
