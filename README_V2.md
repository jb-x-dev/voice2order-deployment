# Menüplan-Simulator V2 - Neue Implementation

## Übersicht

Dies ist eine komplett neue, fehlerfreie Version des Menüplan-Simulators mit allen gewünschten Funktionen. Die alte Version bleibt unter `/menu-planner` verfügbar, während die neue Version unter `/menu-planner-v2` erreichbar ist.

## Neue Features

### 1. Erweiterte Menüplan-Verwaltung

#### Status-System
- **Entwurf**: Menüplan in Bearbeitung
- **Vorlage**: Wiederverwendbare Vorlage
- **Aktiv**: Aktuell verwendeter Plan
- **Archiviert**: Abgeschlossene Pläne

#### Budget-Tracking
- Maximales Budget pro Tag festlegen
- Toleranz in Prozent konfigurieren
- Visuelle Warnung bei Budget-Überschreitung
- Tagesweise Budget-Übersicht

#### Menüplan-Duplikation
- Kopieren von Menüplänen für neue Zeiträume
- Automatische Anpassung der Daten
- Übernahme aller Mahlzeiten und Rezepte

### 2. Mehrere Rezepte pro Mahlzeit

#### Hauptrezept + Beilagen
- Unbegrenzte Anzahl von Rezepten pro Mahlzeit
- Hauptgericht, Beilagen, Desserts kombinierbar
- Individuelle Portionsanzahl pro Rezept

#### Alternative Rezepte
- Markierung von Alternativen
- Flexible Auswahl für verschiedene Szenarien

### 3. Bestelllisten-System

#### Automatische Generierung
- Bestellliste aus Menüplan erstellen
- Berücksichtigung aller Rezepte und Portionen
- Zeitstempel-basierte Benennung

#### Zutatenkalkulation
- Automatische Zusammenfassung aller Zutaten
- Gruppierung nach Bestelltag
- Berücksichtigung von Vorlaufzeiten
- Mengenberechnung basierend auf Portionen

#### Export-Funktionen
- **JSON**: Vollständige Datenstruktur
- **CSV**: Tabellarische Übersicht für Excel
- Zwei Bereiche: Menüplan + Zutaten nach Tag

### 4. Verbesserte Benutzeroberfläche

#### Header-Navigation
- Dropdown für schnelle Menüplan-Auswahl
- Konsistentes Layout aller Buttons
- Direktzugriff auf wichtige Funktionen

#### Visuelle Verbesserungen
- Status-Badges mit Farbcodierung
- Budget-Warnungen in Rot
- Übersichtliche Karten-Layouts
- Responsive Design

## Technische Details

### Datenbank-Erweiterungen

#### Neue Tabellen
```sql
-- Bestelllisten
CREATE TABLE orderLists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  menuPlanId INT,
  name VARCHAR(255) NOT NULL,
  status ENUM('entwurf', 'bestaetigt', 'bestellt', 'archiviert'),
  notes TEXT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Bestelllisten-Einträge
CREATE TABLE orderListItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderListId INT NOT NULL,
  recipeId INT NOT NULL,
  portions INT NOT NULL,
  orderDay DATE NOT NULL,
  preparationTime INT DEFAULT 0,
  leadTime INT DEFAULT 0
);

-- Mehrere Rezepte pro Mahlzeit
CREATE TABLE menuPlanRecipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entryId INT NOT NULL,
  recipeId INT NOT NULL,
  portions INT NOT NULL DEFAULT 4,
  isSelected BOOLEAN DEFAULT TRUE,
  isAlternative BOOLEAN DEFAULT FALSE,
  sortOrder INT DEFAULT 0
);
```

#### Erweiterte Felder
```sql
-- menuPlans
ALTER TABLE menuPlans 
ADD COLUMN status ENUM('entwurf', 'vorlage', 'aktiv', 'archiviert'),
ADD COLUMN maxBudgetPerDay INT DEFAULT 0,
ADD COLUMN budgetTolerance DECIMAL(5,2) DEFAULT 10.00;
```

### Backend-API

#### Neue Router-Endpunkte

**menuPlans**
- `duplicate`: Menüplan duplizieren
- `addRecipeToEntry`: Rezept zu Mahlzeit hinzufügen
- `updateRecipeInEntry`: Rezept in Mahlzeit aktualisieren
- `removeRecipeFromEntry`: Rezept aus Mahlzeit entfernen

**orderLists**
- `list`: Alle Bestelllisten abrufen
- `get`: Einzelne Bestellliste mit Items
- `create`: Neue Bestellliste erstellen
- `update`: Bestellliste aktualisieren
- `delete`: Bestellliste löschen
- `generateFromMenuPlan`: Aus Menüplan generieren

### Frontend-Komponenten

#### MenuPlannerV2.tsx
- Hauptkomponente für Menüplanung
- State Management mit React Hooks
- Optimistic Updates für bessere UX
- Error Boundaries für Fehlerbehandlung

#### OrderListManager.tsx
- Verwaltung von Bestelllisten
- Tabellarische Darstellung
- Export-Funktionen
- Zutatenkalkulation

## Installation & Deployment

### 1. Datenbank-Migration

```bash
# Migration ausführen
mysql -u [user] -p [database] < drizzle/0002_add_order_lists_and_extensions.sql
```

### 2. Dependencies installieren

```bash
cd /home/ubuntu/voice2order-deployment
pnpm install
```

### 3. Entwicklungsserver starten

```bash
pnpm dev
```

### 4. Production Build

```bash
pnpm build
pnpm start
```

## Verwendung

### Menüplan erstellen

1. Navigiere zu `/menu-planner-v2`
2. Klicke auf "+" bei "Meine Menüpläne"
3. Fülle Name, Zeitraum und Budget aus
4. Klicke auf "Erstellen"

### Mahlzeiten hinzufügen

1. Wähle einen Menüplan aus
2. Klicke bei einem Tag auf "+ Mahlzeit"
3. Wähle Mahlzeitentyp und Rezept
4. Gib Portionsanzahl ein
5. Klicke auf "Hinzufügen"

### Weitere Rezepte zu Mahlzeit hinzufügen

1. Bei einer bestehenden Mahlzeit auf "+ Weiteres Rezept hinzufügen" klicken
2. Rezept auswählen und Portionen eingeben
3. Optional als Alternative markieren
4. Klicke auf "Hinzufügen"

### Bestellliste generieren

1. Wähle einen Menüplan aus
2. Klicke auf "Bestellliste" Button
3. Gib optional einen Namen ein
4. Klicke auf "Generieren"
5. Navigiere zu `/order-lists` um die Liste zu sehen

### Bestellliste exportieren

1. Wähle eine Bestellliste aus
2. Klicke auf "JSON" oder "CSV"
3. Datei wird automatisch heruntergeladen

## Fehlerbehandlung

### Client-Side
- Alle Mutations haben try-catch Blöcke
- User-friendly Fehlermeldungen via alert
- Automatisches Refetch nach erfolgreichen Operationen

### Server-Side
- Input-Validierung mit Zod
- Autorisierungs-Checks für alle Operationen
- Proper Error Responses mit TRPCError

## Bekannte Einschränkungen

1. **PDF-Export**: Noch nicht implementiert (nur JSON und CSV)
2. **Excel-Export**: Aktuell nur CSV (kann in Excel geöffnet werden)
3. **Vorlaufzeit**: UI für Eingabe fehlt noch (Standard: 0 Tage)
4. **Zubereitungszeit**: UI für Eingabe fehlt noch (Standard: 0 Stunden)

## Zukünftige Erweiterungen

### Geplante Features
- [ ] PDF-Export mit schönem Layout
- [ ] Excel-Export mit Formatierung
- [ ] Vorlaufzeit und Zubereitungszeit in UI
- [ ] Kollektive Mengeneinstellung
- [ ] Automatische Menüplan-Generierung
- [ ] Rezept-Vorschläge basierend auf Budget
- [ ] Einkaufslisten-Optimierung
- [ ] Integration mit Lieferanten-APIs

### Verbesserungen
- [ ] Drag & Drop für Rezepte
- [ ] Kalender-Ansicht
- [ ] Rezept-Bilder in Übersichten
- [ ] Nährwertinformationen
- [ ] Allergene-Tracking
- [ ] Mobile App

## Migration von V1 zu V2

### Automatische Migration
Die alten Daten bleiben erhalten. Die neue Version verwendet die gleichen Tabellen mit Erweiterungen.

### Manuelle Schritte
1. Alte Menüpläne können weiterhin in V1 verwendet werden
2. Neue Features sind nur in V2 verfügbar
3. Empfehlung: Neue Menüpläne in V2 erstellen

## Support & Feedback

Bei Fragen oder Problemen:
1. GitHub Issues erstellen
2. Logs prüfen: Browser Console + Server Logs
3. Datenbank-Status überprüfen

## Changelog

### Version 2.0.0 (2024-10-26)
- ✨ Neue Komponente MenuPlannerV2
- ✨ Neue Komponente OrderListManager
- ✨ Status-System für Menüpläne
- ✨ Budget-Tracking mit Toleranz
- ✨ Mehrere Rezepte pro Mahlzeit
- ✨ Bestelllisten-Generierung
- ✨ Export-Funktionen (JSON, CSV)
- ✨ Menüplan-Duplikation
- 🐛 Fix: JavaScript-Fehler beim Speichern
- 🐛 Fix: Element-Zugriff vor DOM-Laden
- 🐛 Fix: Fehlende Null-Checks
- 🎨 Verbessertes UI/UX Design
- 📝 Vollständige Dokumentation

## Lizenz

Siehe Hauptprojekt-Lizenz

