# Spec: VPS Production Operations

## Purpose

Defines requirements for the production deployment documentation covering VPS baseline hardening, reverse proxy and TLS, PM2 process management, and scheduled backups.

## Requirements

### Requirement: VPS baseline hardening is documented
The deployment documentation SHALL provide repeatable steps for creating a non-root deploy user, enabling SSH-key access, disabling unsafe SSH access where appropriate, enabling UFW, enabling fail2ban, and provisioning 2 GB swap.

#### Scenario: baseline setup completed
- **WHEN** an operator follows the VPS baseline hardening guide
- **THEN** the server has a non-root deploy user, SSH-key login, active firewall rules, active fail2ban protection, and a 2 GB swap file

### Requirement: Nginx reverse proxy and TLS are documented
The deployment documentation SHALL provide Nginx reverse proxy and Certbot TLS steps for routing HTTPS traffic to the backend process.

#### Scenario: HTTPS request reaches backend
- **WHEN** a user accesses the production API over HTTPS
- **THEN** Nginx terminates TLS and proxies the request to the backend application port

### Requirement: PM2 manages the backend process
The deployment documentation SHALL provide PM2 setup steps for starting, persisting, monitoring, restarting, and updating the backend process.

#### Scenario: process survives reboot
- **WHEN** the VPS restarts after PM2 startup persistence is configured
- **THEN** the backend process starts again without manual intervention

### Requirement: Backups run on a schedule
The deployment documentation SHALL provide cron-based backup steps for application data and database assets, including log output and restore verification guidance.

#### Scenario: scheduled backup produced
- **WHEN** the backup cron schedule runs
- **THEN** a timestamped backup artifact is created and a log entry records the result

#### Scenario: backup restore is testable
- **WHEN** an operator needs to verify backup integrity
- **THEN** the documentation describes how to inspect or restore the backup artifact in a controlled location

### Requirement: Production domain serves valid HTTPS on apex and www

The production deployment SHALL serve the site over valid HTTPS on both the apex domain `hmti.my.id` and the `www.hmti.my.id` subdomain. DNS SHALL resolve both names to the production VPS, Nginx SHALL define server blocks for both names, and a valid (non-expired, correctly-chained) TLS certificate SHALL be installed and auto-renewing. Plain HTTP requests SHALL redirect to HTTPS.

#### Scenario: HTTPS loads on apex and www
- **WHEN** a user opens `https://hmti.my.id` or `https://www.hmti.my.id`
- **THEN** the site loads with a valid, trusted TLS certificate and no browser security warning

#### Scenario: HTTP redirects to HTTPS
- **WHEN** a user requests the site over plain `http://`
- **THEN** the server responds with a redirect to the `https://` equivalent

### Requirement: Production site is reachable from mobile browsers

The production domain SHALL be reachable and load correctly on common mobile browsers. DNS records (including `www`) SHALL be fully propagated, and the TLS certificate SHALL present a complete certificate chain so mobile browsers that do not cache intermediate certificates still validate the connection.

#### Scenario: Mobile browser loads the site
- **WHEN** a user opens `hmti.my.id` (with or without `www`) on a mobile browser
- **THEN** the domain resolves, TLS validates via a complete chain, and the site loads without a "cannot be reached" or certificate error
