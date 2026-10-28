import { invoke } from "@tauri-apps/api/core";
import { analyzeCommand } from "./analyzer";
import type { Analysis, JournalEntry } from "./types";

export async function analyze(command: string): Promise<Analysis> {
  if (!("__TAURI_INTERNALS__" in window)) return analyzeCommand(command);
  try {
    return await invoke<Analysis>("analyze_command", { command });
  } catch (error) {
    console.warn("Local Tauri analyzer unavailable; using deterministic fallback.", error);
    return analyzeCommand(command);
  }
}

export async function saveJournal(entry: JournalEntry): Promise<void> {
  if (!("__TAURI_INTERNALS__" in window)) {
    saveBrowserJournal(entry);
    return;
  }
  try {
    await invoke("save_journal_entry", { entry });
  } catch (error) {
    console.warn("Local Tauri journal unavailable; using browser storage.", error);
    saveBrowserJournal(entry);
  }
}

export async function loadJournal(): Promise<JournalEntry[]> {
  if (!("__TAURI_INTERNALS__" in window)) return loadBrowserJournal();
  try {
    return await invoke<JournalEntry[]>("load_journal");
  } catch (error) {
    console.warn("Local Tauri journal unavailable; using browser storage.", error);
    return loadBrowserJournal();
  }
}

function saveBrowserJournal(entry: JournalEntry): void {
  const stored = loadBrowserJournal();
  localStorage.setItem("ghostshell-journal", JSON.stringify([entry, ...stored].slice(0, 50)));
}

function loadBrowserJournal(): JournalEntry[] {
  return JSON.parse(localStorage.getItem("ghostshell-journal") ?? "[]") as JournalEntry[];
}
