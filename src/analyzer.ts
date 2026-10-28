import type { Analysis, RiskLevel } from "./types";

const patterns: Array<{ test: RegExp; risk: RiskLevel; finding: string }> = [
  { test: /rm\s+(-rf?|--recursive)/i, risk: "critical", finding: "Recursive deletion can erase files permanently." },
  { test: /format\s+|mkfs|diskpart/i, risk: "critical", finding: "This can reformat or destroy a storage volume." },
  { test: />\s*\/dev\/|dd\s+.*of=/i, risk: "critical", finding: "Raw device writes may overwrite an entire disk." },
  { test: /curl|wget/i, risk: "medium", finding: "Downloads content from the network; inspect the destination first." },
  { test: /sudo|runas/i, risk: "high", finding: "Runs with elevated privileges and can bypass normal protections." },
  { test: /chmod\s+777|icacls.*Everyone.*F/i, risk: "high", finding: "Makes a file or directory broadly writable." },
  { test: /kill|taskkill|Stop-Process/i, risk: "medium", finding: "Stops a running process, which may lose unsaved work." },
  { test: /git\s+(reset|clean).*--(hard|force)/i, risk: "high", finding: "May discard local changes that are difficult to recover." },
  { test: /npm\s+install|pip\s+install|cargo\s+install/i, risk: "low", finding: "Installs third-party code into the local environment." },
];

export function analyzeCommand(command: string): Analysis {
  const trimmed = command.trim();
  const matches = patterns.filter(({ test }) => test.test(trimmed));
  const risk = matches.reduce<RiskLevel>(
    (current, item) => highestRisk(current, item.risk),
    "low",
  );
  const riskReason =
    matches[0]?.finding ?? "No destructive or privileged behavior was detected by the local rules.";
  const verb = trimmed.split(/\s+/)[0] || "command";
  const explanation = trimmed
    ? `This invokes “${verb}” with ${Math.max(trimmed.split(/\s+/).length - 1, 0)} argument(s). GhostShell inspected its flags and targets without executing it.`
    : "The terminal is waiting for a command to inspect.";
  const ghost =
    risk === "critical"
      ? "The old machine is rattling. That command carries a scythe; do not run it until every target is accounted for."
      : risk === "high"
        ? "A cold wind moves through the wires. Power like this should be handled with a lantern, not a blindfold."
        : risk === "medium"
          ? "I hear footsteps in the stack. Nothing has happened yet, but this path deserves a second look."
          : "The terminal whispers approval. Still, even friendly spirits can hide a loose floorboard.";

  return {
    explanation,
    risk,
    riskReason,
    ghost,
    findings: matches.map(({ finding }) => finding),
    source: "deterministic",
  };
}

function highestRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  const order: RiskLevel[] = ["low", "medium", "high", "critical"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}
