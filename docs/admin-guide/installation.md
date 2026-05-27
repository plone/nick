---
title: Installation
nav_order: 1
permalink: /admin-guide/installation
parent: Admin guide
---

# Installation

This guide covers installing Nick (the backend). Volto installation is covered briefly at the end, or you can use the [official Volto documentation](https://6.docs.plone.org/volto/index.html).

---

## Installation Requirements

To run Nick, you need:

1. **Node.js** — The JavaScript runtime that executes Nick
2. **PostgreSQL** — The database that stores your content
3. **Yeoman** — A scaffolding tool that generates your project structure
4. **pnpm** — A package manager for installing JavaScript dependencies

```
┌─────────────────────────────────────────────────────────┐
│                     Your Nick Site                      │
├─────────────────────────────────────────────────────────┤
│  Nick CMS (Node.js application)                         │
│    ├── REST API endpoints                               │
│    ├── Content management                               │
│    └── Authentication & security                        │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                    │
│    ├── Content storage                                  │
│    ├── User accounts                                    │
│    └── Workflow states                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### 1. Node.js

#### What is Node.js?

Node.js is a JavaScript runtime — it lets you run JavaScript code outside of a web browser. Nick is written in JavaScript and runs on Node.js.

#### Check if Node.js is installed

```bash
node --version
```

You should see something like `v20.10.0` or higher. Nick requires Node.js 18 or later.

#### Installing Node.js

**Option A: Direct download (simplest)**

Visit [nodejs.org](https://nodejs.org/) and download the LTS (Long Term Support) version. Run the installer.

**Option B: Using a version manager (recommended for developers)**

Version managers let you switch between Node.js versions easily.

On macOS/Linux, using nvm:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal, then:
nvm install --lts
nvm use --lts
```

On Windows, using nvm-windows:

- Download from [github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
- Run the installer
- Then in a new terminal:

```bash
nvm install lts
nvm use lts
```

On macOS:

You will also need to install either the Xcode Command Line Tools or the `node-gyp` node package.

#### Verify installation

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher (npm comes with Node.js)
```

#### What is npm?

npm (Node Package Manager) is installed automatically with Node.js. It's a tool for installing JavaScript packages (libraries, tools, frameworks). Think of it like apt/yum for Linux or Homebrew for macOS, but specifically for JavaScript.

---

### 2. PostgreSQL

#### What is PostgreSQL?

PostgreSQL (often called "Postgres") is a relational database. It stores all your Nick content — pages, users, images, workflows — in structured tables.

#### Check if PostgreSQL is installed

```bash
psql --version
```

You should see something like `psql (PostgreSQL) 15.4` or similar.

#### Installing PostgreSQL

**On Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Start on boot
```

**On macOS (using Homebrew):**

```bash
brew install postgresql@15
brew services start postgresql@15
```

**On Windows:**

- Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
- Run the installer
- Remember the password you set for the `postgres` superuser

#### Verify PostgreSQL is running

```bash
# Try connecting as the postgres superuser
sudo -u postgres psql -c "SELECT version();"

# Or on macOS/Windows where you might not need sudo:
psql -U postgres -c "SELECT version();"
```

---

## Step 1: Install the Yeoman Generator

### Check if already installed

If you've used Yeoman or pnpm before, they might already be installed:

```bash
yo --version
```

If you see a version number (e.g., `4.3.1`), Yeoman is installed.

```bash
pnpm --version
```

If you see a version number (e.g., `8.15.0`), pnpm is installed.

```bash
yo --generators
```

If you see `@robgietema/nick` in the list, the Nick generator is installed.

If all three checks pass, you can skip to [Step 2: Create Your Project](#step-2-create-your-project).

### What are these tools?

| Tool                           | What it does                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| **Yeoman (yo)**                | A scaffolding tool — it asks you questions and generates a project structure based on your answers |
| **@robgietema/generator-nick** | The Nick-specific template that Yeoman uses to create your project                                 |
| **corepack**                   | A Node.js tool for managing package managers like pnpm                                             |
| **pnpm**                       | A fast, disk-efficient package manager (alternative to npm)                                        |

#### Why is it called Yeoman?

Historically, a **yeoman** was a servant or attendant in a noble household — someone who did useful work on your behalf. The tool is named with that metaphor: Yeoman is your helpful assistant that does the tedious scaffolding work for you — setting up project structure, creating boilerplate files, configuring build tools.

It was created around 2012 by Google engineers (including Addy Osmani) when the JavaScript ecosystem was exploding with complexity. The idea was to have one tool that could scaffold any type of project through community-contributed "generators" — like `generator-nick` for Nick projects.

### Why pnpm instead of npm?

pnpm is faster and uses less disk space than npm. It stores packages in a global cache and uses hard links, so if 10 projects use the same package, it's only stored once on disk.

### Install the tools

Run each command and wait for it to complete before running the next:

```bash
# Install Yeoman globally (-g means "global" — available everywhere, not just one project)
npm install -g yo

# Install the Nick generator for Yeoman
npm install -g @robgietema/generator-nick

# Install corepack (manages pnpm)
npm install -g corepack@latest

# Enable pnpm through corepack
corepack enable pnpm
```

### Verify installation

Before proceeding, confirm the tools are installed correctly:

```bash
yo --version
```

You should see something like `4.3.1` or higher.

```bash
pnpm --version
```

You should see something like `8.15.0` or higher.

```bash
yo --generators
```

You should see `@robgietema/nick` in the list of available generators.

If any of these commands fail, see the troubleshooting section below.

### Troubleshooting: Permission errors

If you see `EACCES` permission errors on Linux/macOS:

**Option A: Fix npm permissions (recommended)**

```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Option B: Use sudo (not recommended, but works)**

```bash
sudo npm install -g yo
sudo npm install -g @robgietema/generator-nick
sudo npm install -g corepack@latest
sudo corepack enable pnpm
```

---

## Step 2: Create Your Project

### Choose a project name

Pick a name using lowercase letters, numbers, and underscores only. This name will be used for:

- Your project directory
- Your PostgreSQL database
- Your PostgreSQL user

```
Good names:
  my_nick_site
  company_website
  portfolio_2024

Avoid:
  my-nick-site     (hyphens cause quoting issues in PostgreSQL)
  MyNickSite       (mixed case causes issues)
  my nick site     (spaces are problematic everywhere)
```

**What happens if you ignore this?**

```sql
CREATE DATABASE my-nick-project;
-- ERROR:  syntax error at or near "-"
-- LINE 1: CREATE DATABASE my-nick-project;
--                           ^
```

PostgreSQL interprets the hyphen as a minus sign. You'd need to quote the name everywhere, forever: `"my-nick-project"`. This becomes a maintenance burden across SQL, shell scripts, config files, and application code.

See [PostgreSQL Naming Conventions](./postgresql-naming-conventions.md) for detailed explanation.

### Run the generator

```bash
# Replace "my_nick_project" with your chosen name
yo @robgietema/nick my_nick_project
```

Yeoman will:

1. Create a new directory called `my_nick_project`
2. Generate the project files inside it
3. May ask you some configuration questions

### What just happened?

The generator created a project structure like this:

```
my_nick_project/
├── config.js           # Main configuration file
├── package.json        # Project dependencies and scripts
├── src/
│   └── profiles/       # Content type definitions, workflows, etc.
├── blobstorage/        # Where uploaded files will be stored
└── ...
```

---

## Step 3: Create the Database

### Connect to PostgreSQL

```bash
# On Linux:
sudo -u postgres psql

# On macOS (if installed via Homebrew):
psql postgres

# On Windows:
psql -U postgres
# (enter the password you set during installation)
```

You should see a prompt like:

```
postgres=#
```

### Create database and user

Replace `my_nick_project` with your actual project name, and use a strong password:

```sql
-- Create the database
CREATE DATABASE my_nick_project;

-- Create a dedicated user with a strong password
-- IMPORTANT: Generate a real password, don't use this example!
CREATE USER my_nick_project WITH ENCRYPTED PASSWORD 'your-strong-password-here';

-- Make this user the owner of the database
ALTER DATABASE my_nick_project OWNER TO my_nick_project;

-- Exit psql
\q
```

### Generate a strong password

```bash
# On Linux/macOS:
openssl rand -base64 32

# This outputs something like: K7xPq2mN9vBcD3fH1jL5nR8tW0yZ4aE6gI=
# Use this as your password
```

### Verify the database was created

```bash
# List all databases
psql -U postgres -c "\l"

# You should see my_nick_project in the list
```

---

## Step 4: Configure Nick

### Edit the configuration file

```bash
cd my_nick_project
```

Open `config.js` in your editor. Find the database configuration section and update it:

```javascript
// Database configuration
database: {
  client: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'my_nick_project',      // Your database name
    user: 'my_nick_project',          // Your database user
    password: 'your-strong-password-here'  // The password you set
  }
}
```

### Alternative: Use environment variables (more secure)

Instead of putting the password in config.js, you can use environment variables:

```bash
# Create a .env file (this should NOT be committed to git)
echo "DATABASE_URL=postgres://my_nick_project:your-strong-password-here@localhost:5432/my_nick_project" > .env
```

> **Important:** If your password contains special characters like `@`, `:`, `/`, or `#`, you must URL-encode them in the connection string. For example:
>
> - `@` becomes `%40`
> - `:` becomes `%3A`
> - `/` becomes `%2F`
> - `#` becomes `%23`
>
> A password like `p@ss:word` would become `p%40ss%3Aword` in the URL.
>
> To avoid this complexity, consider generating passwords using only alphanumeric characters:
>
> ```bash
> openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32
> ```

Then reference it in your config.js (if the template supports it).

---

## Step 5: Bootstrap and Start

### Bootstrap the project

```bash
cd my_nick_project  # If not already there
pnpm bootstrap
```

> **Note:** In this context, "bootstrap" means initializing your database with the required tables and initial content — not the Bootstrap CSS framework. It's a common term in software meaning "to start up" or "initialize from scratch."

This command:

1. Connects to your PostgreSQL database
2. Creates all the necessary tables
3. Sets up indexes and constraints
4. Loads initial content (if any defined in profiles)

### Start Nick

```bash
pnpm start
```

You should see output indicating Nick is running, typically on port 8080:

```
Nick is running on http://localhost:8080
```

### Verify it works

Open a new terminal and test the API:

```bash
curl -i http://localhost:8080 -H "Accept: application/json"
```

You should see a JSON response with site information.

Or open http://localhost:8080 in your browser.

---

## Step 6: Connect Volto (Optional)

Nick provides the backend API. For the full editing experience, you need Volto (the React frontend).

### Quick Volto setup

```bash
# In a different directory (not inside my_nick_project)
npm install -g @plone/generator-volto
yo @plone/volto my_nick_frontend

cd my_nick_frontend

# Configure it to talk to Nick instead of Plone
# Edit package.json or .env to set:
# RAZZLE_API_PATH=http://localhost:8080

yarn start
```

Volto will start on http://localhost:3000 and connect to Nick on port 8080.

---

## Common Commands Reference

```bash
# Start Nick (development mode with auto-reload)
pnpm start

# Run tests
pnpm test

# Re-bootstrap database (WARNING: may reset data)
pnpm bootstrap

# Check for outdated packages
pnpm outdated

# Update packages
pnpm update
```

---

## Troubleshooting

### "Connection refused" when starting Nick

**Problem:** Nick can't connect to PostgreSQL.

**Check:**

1. Is PostgreSQL running?

   ```bash
   sudo systemctl status postgresql  # Linux
   brew services list                # macOS
   ```

2. Are the database credentials correct in config.js?

3. Can you connect manually?
   ```bash
   psql -U my_nick_project -d my_nick_project -h localhost
   ```

### "Permission denied" during npm install -g

See the "Troubleshooting: Permission errors" section above.

### "yo: command not found" after installation

Yeoman was installed but isn't in your PATH.

**On Linux/macOS:**

```bash
# Check where npm installs global packages
npm config get prefix

# Add to your PATH (adjust path if different)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

> **Note:** If you used `pnpm install -g` instead of `npm install -g`, the global path is different. Check with `pnpm config get global-bin-dir` or look in `~/.local/share/pnpm`.

**On Windows:**
Restart your terminal or command prompt. If still not found, reinstall with administrator privileges.

### "pnpm: command not found" after corepack enable

**Try enabling corepack with sudo (Linux/macOS):**

```bash
sudo corepack enable pnpm
```

**Or install pnpm directly:**

```bash
npm install -g pnpm
```

### "@robgietema/nick" not in generator list

The generator wasn't installed correctly. Try reinstalling:

```bash
npm install -g @robgietema/generator-nick

# Verify
yo --generators | grep nick
```

### "ENOENT: no such file or directory" during bootstrap

Make sure you're in the project directory:

```bash
cd my_nick_project
ls config.js  # Should exist
```

### Port 8080 already in use

Another application is using port 8080. Either:

1. Stop the other application
2. Configure Nick to use a different port in config.js

---

## Next Steps

- Run the security audit on the Nick source code
- Set up a reverse proxy (Nginx/Caddy) for production
- Configure proper logging
- Set up backups for PostgreSQL
- Connect Volto frontend

---

## Quick Reference: Full Installation Sequence

```bash
# 1. Install tools
npm install -g yo
npm install -g @robgietema/generator-nick
npm install -g corepack@latest
corepack enable pnpm

# 2. Verify tools installed correctly
yo --version              # Should show 4.x.x
pnpm --version            # Should show 8.x.x
yo --generators | grep nick  # Should show @robgietema/nick

# 3. Create project
yo @robgietema/nick my_nick_project

# 4. Create database (in psql)
# CREATE DATABASE my_nick_project;
# CREATE USER my_nick_project WITH ENCRYPTED PASSWORD 'strong-password';
# ALTER DATABASE my_nick_project OWNER TO my_nick_project;

# 5. Configure (edit config.js with database credentials)

# 6. Bootstrap and run
cd my_nick_project
pnpm bootstrap
pnpm start
```
