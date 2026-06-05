# Hook Stop pour Claude Code (copper-spark-website)
# Lance lint + typecheck UNIQUEMENT si des fichiers .ts/.tsx ont change (git).
# En cas d'echec, renvoie un "decision: block" pour que Claude corrige avant de finir.
# ASCII pur volontairement (PowerShell 5.1 sans BOM = encodage ANSI sur les accents).

# NB: pas de ErrorActionPreference='Stop' -> sous PS 5.1, la moindre ligne stderr
# d'un .exe natif deviendrait une erreur terminante. On laisse 'Continue'.
$ErrorActionPreference = 'Continue'

# 1. Lire l'entree JSON du hook (stdin)
$raw = [Console]::In.ReadToEnd()
$stopActive = $false
if ($raw) {
  try {
    $data = $raw | ConvertFrom-Json
    if ($data.stop_hook_active) { $stopActive = $true }
  } catch { }
}

# 2. Y a-t-il des fichiers .ts/.tsx modifies (working tree + staged) ?
$changed = @()
try {
  $changed = git status --porcelain 2>$null |
    ForEach-Object { ($_ -replace '^.{3}', '').Trim() } |
    Where-Object { $_ -match '\.(ts|tsx)$' }
} catch { }

if (-not $changed -or $changed.Count -eq 0) {
  # Rien de pertinent a verifier -> on laisse Claude terminer.
  exit 0
}

# 3. Lancer lint + typecheck.
# La redirection 2>&1 est faite par cmd /c (pas par PowerShell) pour eviter le
# wrapping des lignes stderr en ErrorRecord sous PS 5.1.
$lintOut = (cmd /c "npm run lint 2>&1") | Out-String
$lintCode = $LASTEXITCODE
$tcOut = (cmd /c "npm run typecheck 2>&1") | Out-String
$tcCode = $LASTEXITCODE

if ($lintCode -eq 0 -and $tcCode -eq 0) {
  # Tout passe -> rien a signaler, sortie silencieuse.
  exit 0
}

# 4. Construire le rapport d'erreurs (tronque pour rester lisible)
$details = ""
if ($lintCode -ne 0) { $details += "== ESLint (echec) ==`n" + $lintOut + "`n" }
if ($tcCode -ne 0)   { $details += "== TypeScript (echec) ==`n" + $tcOut + "`n" }
if ($details.Length -gt 4000) { $details = $details.Substring(0, 4000) + "`n... (tronque)" }

if ($stopActive) {
  # Deuxieme passage : on ne bloque pas de nouveau (anti-boucle), on alerte juste.
  @{ systemMessage = "lint/typecheck encore en echec - a corriger manuellement." } |
    ConvertTo-Json -Compress
  exit 0
}

# 5. Premier passage : bloquer la fin de tache et demander la correction a Claude.
@{
  decision      = "block"
  reason        = "Des erreurs lint/typecheck ont ete detectees sur les fichiers .ts/.tsx modifies. Corrige-les avant de terminer.`n`n$details"
  systemMessage = "Hook Stop : lint/typecheck en echec, correction demandee."
} | ConvertTo-Json -Compress
exit 0
