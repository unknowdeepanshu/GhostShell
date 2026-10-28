use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Analysis {
    explanation: String,
    risk: String,
    risk_reason: String,
    ghost: String,
    findings: Vec<String>,
    source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct JournalEntry {
    id: String,
    command: String,
    analysis: Analysis,
    created_at: String,
}

#[tauri::command]
fn analyze_command(command: String) -> Analysis {
    let lower = command.to_lowercase();
    let mut risk = "low";
    let mut findings = Vec::new();
    if lower.contains("rm -rf") || lower.contains("mkfs") || lower.contains("format ") {
        risk = "critical";
        findings.push("Recursive deletion or formatting can erase files permanently.".into());
    } else if lower.contains("sudo") || lower.contains("runas") || lower.contains("reset --hard") {
        risk = "high";
        findings.push("This command can change protected system state or discard work.".into());
    } else if lower.contains("curl") || lower.contains("wget") || lower.contains("kill") {
        risk = "medium";
        findings.push("This command reaches the network or changes a running process.".into());
    }
    let ghost = match risk {
        "critical" => "The old machine is rattling. That command carries a scythe; account for every target.",
        "high" => "A cold wind moves through the wires. Power like this needs a lantern.",
        "medium" => "I hear footsteps in the stack. This path deserves a second look.",
        _ => "The terminal whispers approval. Even friendly spirits can hide a loose floorboard.",
    };
    Analysis {
        explanation: format!("This invokes “{}” without executing it. GhostShell inspected its flags and targets locally.", command.split_whitespace().next().unwrap_or("command")),
        risk: risk.into(),
        risk_reason: findings.first().cloned().unwrap_or_else(|| "No destructive or privileged behavior was detected by the local rules.".into()),
        ghost: ghost.into(),
        findings,
        source: "deterministic".into(),
    }
}

fn journal_path() -> Result<PathBuf, String> {
    let dir = dirs::data_dir().ok_or_else(|| "Could not locate the application data directory.".to_string())?.join("GhostShell");
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir.join("journal.json"))
}

#[tauri::command]
fn load_journal() -> Result<Vec<JournalEntry>, String> {
    let path = journal_path()?;
    if !path.exists() { return Ok(Vec::new()); }
    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&content).map_err(|error| error.to_string())
}

#[tauri::command]
fn save_journal_entry(entry: JournalEntry) -> Result<(), String> {
    let mut entries = load_journal()?;
    entries.insert(0, entry);
    entries.truncate(50);
    fs::write(journal_path()?, serde_json::to_string_pretty(&entries).map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![analyze_command, load_journal, save_journal_entry])
        .run(tauri::generate_context!())
        .expect("error while running GhostShell");
}
