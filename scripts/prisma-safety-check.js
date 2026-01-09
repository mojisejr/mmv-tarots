const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to Prisma Migrations
const MIGRATIONS_DIR = path.join(__dirname, '../prisma/migrations');

// Colors for output
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m"
};

const getLatestMigration = () => {
  if (!fs.existsSync(MIGRATIONS_DIR)) return null;
  
  const dirs = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => {
      const fullPath = path.join(MIGRATIONS_DIR, f);
      return fs.statSync(fullPath).isDirectory() && f !== 'migration_lock.toml';
    })
    .sort()
    .reverse(); // Newest first

  return dirs.length > 0 ? dirs[0] : null;
};

const checkSafety = async () => {
  console.log(`${COLORS.bold}🔍 Oracle Safety Scanner: Checking for destructive changes...${COLORS.reset}`);
  
  const latestMigration = getLatestMigration();
  if (!latestMigration) {
    console.log(`${COLORS.yellow}⚠️  No migrations found to scan.${COLORS.reset}`);
    return;
  }

  const sqlPath = path.join(MIGRATIONS_DIR, latestMigration, 'migration.sql');
  if (!fs.existsSync(sqlPath)) {
    console.log(`${COLORS.yellow}⚠️  Migration folder ${latestMigration} exists but 'migration.sql' is missing.${COLORS.reset}`);
    return;
  }

  // Read SQL and check for dangerous keywords
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8').toUpperCase();
  const dangerousKeywords = [
    'DROP TABLE', 
    'DROP COLUMN', 
    'TRUNCATE TABLE', 
    'TRUNCATE '
  ];

  const foundDangers = dangerousKeywords.filter(keyword => sqlContent.includes(keyword));

  if (foundDangers.length > 0) {
    console.log(`\n${COLORS.red}${COLORS.bold}🚨 DESTRUCTIVE CHANGES DETECTED IN: ${latestMigration}${COLORS.reset}`);
    foundDangers.forEach(d => console.log(`${COLORS.red}   - ${d} command found${COLORS.reset}`));
    
    console.log(`\n${COLORS.yellow}This migration could result in PERMANENT DATA LOSS.${COLORS.reset}`);
    console.log(`${COLORS.bold}Are you sure you want to proceed?${COLORS.reset}`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`${COLORS.red}Type "CONFIRM" to execute this migration: ${COLORS.reset}`, (answer) => {
        rl.close();
        if (answer === 'CONFIRM') {
          console.log(`\n${COLORS.green}✅ Confirmed. Proceeding with caution...${COLORS.reset}\n`);
          resolve(true);
        } else {
          console.log(`\n${COLORS.red}❌ Migration ABORTED by user safety protocol.${COLORS.reset}`);
          process.exit(1);
        }
      });
    });
  } else {
    console.log(`${COLORS.green}✅ PASSED: No destructive commands found in ${latestMigration}.${COLORS.reset}\n`);
    return Promise.resolve(true);
  }
};

checkSafety();
