#!/usr/bin/env bash
set -e

echo "=== Build & types ==="
npm run typecheck
npm run lint
npm run build

echo "=== .env tracking ==="
if git ls-files | grep -qE '^\.env$'; then
  echo "❌ .env is tracked"; exit 1
fi
echo "✅ .env not tracked"

echo "=== Routes 200 (toutes les URL du sitemap) ==="
for url in $(grep -oP '<loc>\K[^<]+' public/sitemap.xml); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$code" = "200" ]; then
    echo "✅ $code $url"
  else
    echo "❌ $code $url"
  fi
done

echo "=== Canonical correct (3 pages clés) ==="
for url in \
  "https://cuivre-electrique.com/services/bornes-de-recharge" \
  "https://cuivre-electrique.com/electricien-wavre" \
  "https://cuivre-electrique.com/contact"; do
  canonical=$(curl -s "$url" | grep -oP 'rel="canonical"\s+href="\K[^"]+' | head -1)
  if [ "$canonical" = "$url" ]; then
    echo "✅ canonical OK pour $url"
  else
    echo "❌ canonical=$canonical, attendu $url"
  fi
done

echo "=== Headers sécurité (HSTS, CSP, X-Frame-Options) ==="
headers=$(curl -sI https://cuivre-electrique.com/)
for header in "strict-transport-security" "x-frame-options" "x-content-type-options" "content-security-policy"; do
  if echo "$headers" | grep -qi "$header"; then
    echo "✅ $header présent"
  else
    echo "⚠️ $header absent"
  fi
done

echo "=== npm audit (high/critical) ==="
npm audit --audit-level=high || echo "⚠️ vulnérabilités à examiner"

echo ""
echo "✅ Preflight terminé"
