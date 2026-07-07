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
