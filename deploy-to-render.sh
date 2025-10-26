#!/bin/bash

# Deployment-Script für Render.com
# Dieses Script bereitet das Repository für Render.com vor

echo "🚀 Vorbereitung für Render.com Deployment..."

# Prüfe ob wir im richtigen Verzeichnis sind
if [ ! -f "package.json" ]; then
    echo "❌ Fehler: package.json nicht gefunden"
    echo "Bitte führe dieses Script im Projekt-Root aus"
    exit 1
fi

# Prüfe ob render.yaml existiert
if [ ! -f "render.yaml" ]; then
    echo "❌ Fehler: render.yaml nicht gefunden"
    exit 1
fi

echo "✅ Alle erforderlichen Dateien gefunden"

# Git Status prüfen
echo ""
echo "📋 Git Status:"
git status --short

# Frage ob committen
echo ""
read -p "Möchtest du die Änderungen committen? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    git commit -m "chore: Add Render.com deployment configuration"
    echo "✅ Änderungen committed"
fi

# Frage ob pushen
echo ""
read -p "Möchtest du zum Repository pushen? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo "✅ Änderungen gepusht"
fi

echo ""
echo "🎉 Vorbereitung abgeschlossen!"
echo ""
echo "📝 Nächste Schritte:"
echo "1. Gehe zu https://render.com"
echo "2. Klicke auf 'New +' → 'Web Service'"
echo "3. Verbinde das GitHub Repository: jb-x-dev/voice2order-deployment"
echo "4. Render erkennt automatisch die render.yaml Konfiguration"
echo "5. Klicke 'Apply' und dann 'Create Web Service'"
echo ""
echo "📖 Vollständige Anleitung: RENDER_DEPLOYMENT.md"
echo ""

