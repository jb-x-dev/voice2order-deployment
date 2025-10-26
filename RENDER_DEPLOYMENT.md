# Render.com Deployment-Anleitung

## Übersicht

Diese Anleitung beschreibt, wie Sie den Menüplan-Simulator V2 dauerhaft auf Render.com bereitstellen.

## Voraussetzungen

- GitHub-Account mit Zugriff auf `jb-x-dev/voice2order-deployment`
- Render.com-Account (kostenlos)
- Kreditkarte für Render.com (auch für Free Tier erforderlich)

## Deployment-Schritte

### 1. Render.com-Account erstellen

1. Gehe zu https://render.com
2. Klicke auf "Get Started"
3. Registriere dich mit GitHub
4. Autorisiere Render.com für GitHub-Zugriff

### 2. Datenbank erstellen

1. Im Render Dashboard: Klicke auf "New +"
2. Wähle "PostgreSQL" (MySQL ist im Free Tier nicht verfügbar)
3. Konfiguration:
   - **Name**: `menuplan-db`
   - **Database**: `menuplan_simulator`
   - **User**: `menuplan_user`
   - **Region**: Frankfurt (EU Central)
   - **Plan**: Free
4. Klicke "Create Database"
5. Warte bis Status "Available" ist
6. **Wichtig**: Kopiere die "Internal Database URL" für später

### 3. Datenbank-Schema anpassen

Da Render.com PostgreSQL statt MySQL verwendet, müssen wir das Schema anpassen:

**Option A: Drizzle ORM nutzen (empfohlen)**

Die Anwendung verwendet bereits Drizzle ORM, das PostgreSQL unterstützt. Wir müssen nur die Konfiguration anpassen.

**Option B: Alternative - Externe MySQL-Datenbank**

Verwende einen externen MySQL-Service wie:
- PlanetScale (kostenlos)
- Railway (kostenlos mit Limits)
- Eigener MySQL-Server

### 4. Web Service erstellen

1. Im Render Dashboard: Klicke auf "New +"
2. Wähle "Web Service"
3. Verbinde GitHub-Repository:
   - Klicke "Connect account" falls noch nicht verbunden
   - Wähle `jb-x-dev/voice2order-deployment`
4. Konfiguration:
   - **Name**: `menuplan-simulator-v2`
   - **Region**: Frankfurt (EU Central)
   - **Branch**: `main`
   - **Root Directory**: (leer lassen)
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Plan**: Free

### 5. Environment-Variablen konfigurieren

Füge folgende Environment-Variablen hinzu:

```
NODE_ENV=production
DATABASE_URL=[Deine Database URL von Schritt 2]
SESSION_SECRET=[Generiere einen zufälligen String]
PORT=10000
```

**SESSION_SECRET generieren:**
```bash
# In Terminal ausführen:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Deploy starten

1. Klicke "Create Web Service"
2. Render startet automatisch den Build-Prozess
3. Warte bis Status "Live" ist (ca. 5-10 Minuten)

### 7. Datenbank-Migration durchführen

Nach erfolgreichem Deployment:

1. Öffne die Render Shell:
   - Gehe zu deinem Web Service
   - Klicke auf "Shell" Tab
   - Oder nutze Render CLI

2. Führe Migration aus:
```bash
# In Render Shell:
cd /opt/render/project/src
node -e "require('./dist/index.js')"
# Oder nutze Drizzle Kit:
pnpm db:push
```

**Alternativ**: Verbinde dich direkt zur Datenbank und führe SQL aus:
```bash
# Lokal mit psql:
psql [DATABASE_URL]
# Dann SQL aus drizzle/0002_add_order_lists_and_extensions.sql ausführen
# (Angepasst für PostgreSQL)
```

### 8. Zugriff auf die Anwendung

Nach erfolgreichem Deployment:

**URL**: `https://menuplan-simulator-v2.onrender.com`

**Routen**:
- Home: `/`
- Rezepte: `/recipes`
- Menüplaner V2: `/menu-planner-v2`
- Bestelllisten: `/order-lists`

## PostgreSQL vs MySQL Anpassungen

### Schema-Änderungen erforderlich

**MySQL → PostgreSQL Mapping:**

```sql
-- MySQL
INT AUTO_INCREMENT PRIMARY KEY
-- PostgreSQL
SERIAL PRIMARY KEY

-- MySQL
DATETIME
-- PostgreSQL
TIMESTAMP

-- MySQL
ENUM('value1', 'value2')
-- PostgreSQL
VARCHAR(50) CHECK (column IN ('value1', 'value2'))
-- Oder: CREATE TYPE als ENUM
```

### Drizzle Schema anpassen

In `drizzle/schema.ts`:

```typescript
// Statt MySQL:
import { mysqlTable, int, varchar, ... } from 'drizzle-orm/mysql-core';

// PostgreSQL verwenden:
import { pgTable, serial, varchar, ... } from 'drizzle-orm/pg-core';

// Beispiel:
export const menuPlans = pgTable('menuPlans', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  // ...
});
```

### Database Connection anpassen

In `server/db.ts`:

```typescript
// Statt MySQL:
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// PostgreSQL verwenden:
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Für Render.com
});

export const db = drizzle(pool);
```

## Alternative: PlanetScale (MySQL)

Falls du MySQL bevorzugst:

### 1. PlanetScale-Account erstellen

1. Gehe zu https://planetscale.com
2. Registriere dich (kostenlos)
3. Erstelle neue Datenbank

### 2. Connection String erhalten

1. Gehe zu Database Settings
2. Kopiere Connection String
3. Format: `mysql://user:pass@host/database?sslaccept=strict`

### 3. In Render verwenden

Füge die PlanetScale Connection String als `DATABASE_URL` hinzu.

**Vorteil**: Keine Schema-Anpassungen nötig!

## Monitoring & Logs

### Logs anzeigen

1. Gehe zu deinem Web Service in Render
2. Klicke auf "Logs" Tab
3. Siehe Echtzeit-Logs

### Metriken

1. Gehe zu "Metrics" Tab
2. Siehe CPU, Memory, Request-Statistiken

### Alerts einrichten

1. Gehe zu "Settings"
2. Scrolle zu "Notifications"
3. Füge Email-Benachrichtigungen hinzu

## Custom Domain (Optional)

### Eigene Domain verbinden

1. Gehe zu "Settings" → "Custom Domain"
2. Klicke "Add Custom Domain"
3. Gebe deine Domain ein (z.B. `menuplan.example.com`)
4. Füge DNS-Records hinzu:
   ```
   Type: CNAME
   Name: menuplan (oder @)
   Value: menuplan-simulator-v2.onrender.com
   ```
5. Warte auf DNS-Propagierung (bis zu 48h)
6. SSL wird automatisch eingerichtet

## Kosten

### Free Tier Limits

**Web Service (Free)**:
- 750 Stunden/Monat
- Schläft nach 15 Min Inaktivität
- Aufwachen dauert ~30 Sekunden
- 512 MB RAM
- 0.1 CPU

**PostgreSQL (Free)**:
- 1 GB Speicher
- 90 Tage Daten-Retention
- Wird nach 90 Tagen Inaktivität gelöscht

### Upgrade-Optionen

**Starter Plan ($7/Monat)**:
- Kein Sleep
- 512 MB RAM
- 0.5 CPU
- Bessere Performance

**Standard Plan ($25/Monat)**:
- 2 GB RAM
- 1 CPU
- Auto-Scaling

## Troubleshooting

### Build schlägt fehl

**Problem**: `pnpm: command not found`

**Lösung**: Füge `.node-version` Datei hinzu:
```
22.13.0
```

Oder ändere Build Command zu:
```bash
npm install -g pnpm && pnpm install && pnpm build
```

### Database Connection Error

**Problem**: `Connection refused`

**Lösung**: 
1. Prüfe DATABASE_URL ist korrekt
2. Stelle sicher, Datenbank ist "Available"
3. Verwende Internal Database URL, nicht External

### App startet nicht

**Problem**: Port-Fehler

**Lösung**: Render setzt automatisch `PORT` Environment Variable.
Stelle sicher, dein Server nutzt `process.env.PORT`:

```typescript
const PORT = process.env.PORT || 10000;
app.listen(PORT);
```

### Slow Cold Starts

**Problem**: App schläft und braucht lange zum Aufwachen

**Lösung**: 
- Upgrade zu Starter Plan ($7/Monat)
- Oder: Nutze Cron-Job um App wach zu halten:
  - Erstelle "Cron Job" in Render
  - Command: `curl https://menuplan-simulator-v2.onrender.com/api/health`
  - Schedule: `*/14 * * * *` (alle 14 Minuten)

## Backup-Strategie

### Automatische Backups (Paid Plans)

Render bietet automatische Backups für bezahlte Datenbank-Pläne.

### Manuelle Backups

```bash
# PostgreSQL Dump
pg_dump [DATABASE_URL] > backup.sql

# Restore
psql [DATABASE_URL] < backup.sql
```

### Backup-Script erstellen

Erstelle Cron-Job in Render:
```bash
pg_dump $DATABASE_URL | gzip > /tmp/backup-$(date +%Y%m%d).sql.gz
# Upload zu S3 oder anderem Storage
```

## CI/CD

### Automatisches Deployment

Render deployed automatisch bei jedem Push zu `main` Branch.

**Deaktivieren**:
1. Gehe zu Settings
2. Deaktiviere "Auto-Deploy"

**Branch ändern**:
1. Gehe zu Settings
2. Ändere "Branch" zu gewünschtem Branch

### Deploy Hooks

Manuelles Deployment via API:
```bash
curl -X POST [DEPLOY_HOOK_URL]
```

Deploy Hook URL findest du in Settings → Deploy Hook.

## Performance-Optimierung

### Caching

Füge Redis hinzu (optional):
1. Erstelle Redis Instance in Render
2. Verbinde mit Web Service
3. Nutze für Session-Storage

### CDN

Für statische Assets:
1. Nutze Cloudflare (kostenlos)
2. Oder: Render's CDN (automatisch für Static Sites)

## Sicherheit

### Environment Variables

- Niemals in Code committen
- Nutze Render's Environment Variables
- Rotiere Secrets regelmäßig

### SSL/TLS

- Automatisch aktiviert
- Let's Encrypt Zertifikate
- Automatische Erneuerung

### Rate Limiting

Implementiere in der App:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100 // Max 100 Requests
});

app.use('/api/', limiter);
```

## Support

### Render Support

- Dokumentation: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### Application Support

- GitHub Issues: https://github.com/jb-x-dev/voice2order-deployment/issues
- Logs prüfen in Render Dashboard

## Zusammenfassung

**Deployment-Zeit**: ~15-20 Minuten
**Kosten**: Kostenlos (Free Tier)
**URL**: `https://menuplan-simulator-v2.onrender.com`
**Wartung**: Automatische Updates via Git Push

Die Anwendung ist nach dem Deployment dauerhaft verfügbar und wird automatisch bei jedem Push zum Repository aktualisiert.

