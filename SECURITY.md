# Security Policy

## Supported Versions

We provide security fixes for the latest version of ABBA AI and encourage users to keep auto-updates enabled.

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| < 0.2   | :x:                |

## Reporting a Vulnerability

**DO NOT** open a public GitHub issue for security vulnerabilities.

### How to Report

1. **GitHub Security Advisory** (preferred):
   https://github.com/yosiwizman/dyad/security/advisories/new

2. **Email**: Contact the maintainer directly (include "SECURITY" in the subject line)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days for critical issues

### Scope

In scope:

- ABBA AI desktop application
- Authentication and authorization
- Vault/secrets management
- Broker integration security
- Data exposure or leakage

Out of scope:

- Issues in upstream dependencies (report to upstream)
- Social engineering / physical attacks

## Security Best Practices

1. Keep ABBA AI updated to the latest version
2. Never share Vault credentials or device tokens
3. Review AI-generated code before deploying to production
4. Use environment variables for sensitive configuration
