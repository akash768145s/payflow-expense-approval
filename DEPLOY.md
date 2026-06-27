# PayFlow Production Deployment Guide

This document describes the strategy and steps to deploy PayFlow to production with zero downtime, robust database migrations, and failure rollbacks.

---

## 🚀 1. Production Architecture Overview

In production, PayFlow is structured as a two-tier application:
1. **Frontend**: The React SPA is built into static files (`HTML/JS/CSS`) and served via a CDN (e.g., Cloudflare, CloudFront) or a highly performant web server like **Nginx**.
2. **Backend**: The Fastify Node.js app runs on a cluster of instances (under a process manager like **PM2** or inside **Kubernetes**), bound behind a load balancer (ALB or Nginx reverse proxy).
3. **Database**: Managed PostgreSQL instance (e.g., AWS RDS, GCP Cloud SQL) with automatic backups and connection pooling (using PgBouncer).

---

## 📦 2. Process Management (PM2 & Systemd)

For virtual machines (VMs like AWS EC2, DigitalOcean Droplets), we manage the Fastify process using PM2 or Systemd.

### Option A: PM2 Setup (Recommended)
PM2 provides built-in cluster mode, load balancing, and hot reloads.

1. **Install PM2 globally**:
   ```bash
   npm install -g pm2
   ```
2. **Create `ecosystem.config.js` in the backend root**:
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'payflow-backend',
         script: 'dist/server.js',
         instances: 'max', // Scale across all available CPU cores
         exec_mode: 'cluster',
         env: {
           NODE_ENV: 'production',
           PORT: 3000,
         },
         max_memory_restart: '1G',
         error_file: 'logs/err.log',
         out_file: 'logs/out.log',
         merge_logs: true,
       },
     ],
   };
   ```
3. **Start and configure system startup**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Option B: Systemd Configuration
Alternatively, configure a Linux systemd service.

1. Create `/etc/systemd/system/payflow.service`:
   ```ini
   [Unit]
   Description=PayFlow Backend Service
   After=network.target

   [Service]
   Type=simple
   User=deploy
   WorkingDirectory=/var/www/payflow/backend
   ExecStart=/usr/bin/node dist/server.js
   Restart=on-failure
   Environment=NODE_ENV=production PORT=3000 DATABASE_URL=postgresql://...

   [Install]
   WantedBy=multi-user.target
   ```
2. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable payflow
   sudo systemctl start payflow
   ```

---

## 🔄 3. Database Migration Strategy

To run database migrations in production without breaking active backend instances, follow a **Expand and Contract (Blue-Green)** pattern.

### The Rule
> [!IMPORTANT]
> **Never perform destructive database changes (like dropping columns or renaming tables) directly on a running database.**

### Workflow
1. **Expand**:
   - Write migrations that are backward-compatible (e.g., adding nullable columns, adding new tables).
   - Apply migrations using `npx prisma migrate deploy` during the CI/CD pipeline or deployment phase.
2. **Deploy App**:
   - Deploy the new version of the app which utilizes the new columns/tables.
3. **Contract**:
   - Once all old app servers are terminated and only new ones are running, write and apply a second migration to clean up/remove old columns or tables.

---

## ⚡ 4. Zero Downtime Strategy

To achieve zero downtime (rolling updates), use a load balancer to shift traffic between backend instances during deployment.

### PM2 Reload (Single Server VM)
PM2 cluster mode allows hot reloads, booting up new processes one-by-one and swapping them out without closing ports:
```bash
pm2 reload payflow-backend
```

### Docker / Blue-Green Deployment (Multi-Server)
1. **Spin up a new version (Green) of the service**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build backend-green
   ```
2. **Health Check**: Run integration tests or curl checks to ensure the Green container is healthy.
3. **Route Traffic**: Update Nginx reverse proxy configuration to route `/api` requests to the Green container.
4. **Reload Nginx**:
   ```bash
   nginx -s reload
   ```
5. **Terminate Old Version (Blue)**: Turn off the Blue containers.

---

## 🚨 5. Rollback Strategy

In case of a failure in a new deployment:

### Application Rollback
1. **Revert commit**: Revert the release tag in Git.
2. **Trigger CI/CD**: Deploy the previous stable release artifact.
3. **PM2 Hot Swap**: Trigger `pm2 reload payflow-backend` to swap the running application version back immediately.

### Database Rollback
If a database rollback is required, use Prisma's migration CLI tools:
1. **Generate Down Migration**: Write a custom SQL migration script to revert the changes.
2. **Apply Manual Rollback**: Run the down-migration SQL against the database.
   - For serious migration issues, mark the failed migration as resolved manually:
     ```bash
     npx prisma migrate resolve --rolled-back "20260627000000_failed_migration"
     ```
3. **Re-run the previous stable migrations**.
