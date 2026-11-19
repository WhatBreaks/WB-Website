> **Branch note (`feat/break-the-page`):** This branch replaces the site entry point with the
> **BREAK THE PAGE** static build of the WhatBreaks website (scroll-driven concept: the page
> literally breaks itself as you scroll, then replays the incident in 3D). Everything it needs is
> static: `index.html` + `assets/` (styles, choreography engine, Three.js replay, fonts, embedded
> V1 dashboard demo). No build step required. Preview locally with any static server from the repo
> root, e.g. `npx serve .` or `python3 -m http.server`, then open `/index.html`.
> The original Vite/React scaffold (`src/`, `package.json`, etc.) is left untouched in this PR;
> removing it is a follow-up once this direction is approved.

# WhatBreaks

> **Know what breaks before you change it.**  
> Pre-deploy infrastructure impact analysis and blast-radius prediction for Kubernetes.

[![Status](https://img.shields.io/badge/status-Kubernetes%20V1%20Available%20Now-10b981.svg?style=flat-square)](https://whatbreaks.dev)
[![Website](https://img.shields.io/badge/website-whatbreaks.dev-blue.svg?style=flat-square)](https://whatbreaks.dev)
[![GitHub](https://img.shields.io/badge/github-WhatBreaks-181717.svg?style=flat-square&logo=github)](https://github.com/aaradhychinche-alt/WhatBreaks)
[![License](https://img.shields.io/badge/license-Apache%202.0-lightgrey.svg?style=flat-square)](LICENSE)

---

## Overview

Modern cloud platforms are tightly coupled graphs of services, ingress routes, secrets, and configuration maps. Today, most teams only discover that a minor configuration change broke an upstream dependency **after** deployment alerts fire.

**WhatBreaks** solves this by shifting resilience left. Rather than experimenting with chaos in production, WhatBreaks ingests declarative infrastructure manifests and runtime cluster state, compiles a deterministic dependency graph, and predicts the exact blast radius before a change is applied.

- **Production Domain**: [https://whatbreaks.dev](https://whatbreaks.dev)
- **Official Repository**: [https://github.com/aaradhychinche-alt/WhatBreaks](https://github.com/aaradhychinche-alt/WhatBreaks)
- **Contact & Early Access**: [aaradhy@whatbreaks.dev](mailto:aaradhy@whatbreaks.dev)

---

## Current Product Status: Kubernetes V1

**WhatBreaks V1 is available now for Kubernetes.**

The V1 engine provides native static analysis and cluster-state reconciliation for:
- **Deployments, StatefulSets & DaemonSets** (pod selectors, environment bindings, readiness probes)
- **Services & Ingress Controllers** (endpoint routing, host rules, TLS certificates)
- **ConfigMaps & Secrets** (volume mounts, envFrom references, secret key lookups)
- **Custom Resource Definitions (CRDs)** (operator-managed infrastructure)

> **Note on Roadmap**: Integrations for Terraform plans, Helm chart templating, AWS IAM/RDS topologies, and Docker Compose are in active development. WhatBreaks V1 focuses specifically on deterministic Kubernetes impact analysis.

---

## Core Capabilities

### 1. Blast Radius Analysis
Simulate a proposed manifest mutation (e.g. modifying an ingress rewrite rule, updating a secret key, or deleting a service port) to trace every direct and indirect dependent resource.

### 2. Tier-Aware Risk Scoring
Classify impact across service criticality levels:
- **Tier 0**: Payment gateways, authentication, and core routing.
- **Tier 1**: User-facing APIs and transaction processors.
- **Tier 2**: Internal metrics, background queues, and logging workers.

### 3. Deterministic Dependency Graph
Unlike distributed tracing tools that require active production traffic, WhatBreaks computes dependency paths statically and deterministically from your infrastructure definitions.

### 4. Interactive Simulation Dashboard
A unified web console featuring:
- **Overview**: Real-time cluster health, sync status, and recent change logs.
- **The Change / Simulation Workspace**: Interactive "What if I change this?" engine.
- **Blast Radius Visualizer**: Visual topology graph with node inspection and tier breakdown.
- **Affected Services Drawer**: Immediate list of downstream services that would fail.
- **Audit Reports & Compliance**: Exportable diff reports for review and compliance sign-off.

---

## Command Line Interface (CLI)

WhatBreaks includes a developer CLI for local validation and CI/CD pipelines:

```bash
# Install the WhatBreaks CLI (example)
curl -sSL https://whatbreaks.dev/install.sh | bash

# Scan local Kubernetes manifests to verify graph integrity
whatbreaks scan ./k8s/manifests/

# Predict blast radius for an uncommitted change or patch
whatbreaks blast-radius --change ./patches/ingress-auth-patch.yaml

# Run a simulated mutation against a specific resource
whatbreaks simulate --resource deployment/auth-service --attribute spec.template.spec.containers[0].ports

# Validate changes before merge in CI (exits non-zero if critical risk detected)
whatbreaks check --manifests ./k8s/ --risk-threshold medium
```

---

## CI / CD Integration

Prevent infrastructure outages before PRs merge:

```yaml
# .github/workflows/whatbreaks.yml
name: Infrastructure Impact Analysis
on:
  pull_request:
    paths:
      - 'k8s/**'
      - 'manifests/**'

jobs:
  analyze-blast-radius:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run WhatBreaks Impact Analysis
        uses: whatbreaks/action@v1
        with:
          manifests-dir: './k8s'
          fail-on-risk: 'high'
        env:
          WHATBREAKS_TOKEN: ${{ secrets.WHATBREAKS_TOKEN }}
```

---

## Website & Web App Development

This repository contains the official WhatBreaks website and interactive dashboard web application.

### Tech Stack
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Vanilla CSS (modular design tokens, dual dark/light theme, architectural editorial aesthetic)
- **Icons**: Lucide Icons
- **Typography**: Geist, Inter, Newsreader, IBM Plex Mono

### Getting Started Locally

```bash
# 1. Clone the repository
git clone https://github.com/aaradhychinche-alt/WhatBreaks.git
cd WhatBreaks

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit `http://localhost:5173` to explore the website and interactive dashboard.

### Building for Production

```bash
# Run TypeScript validation and compile optimized production assets
npm run build

# Preview the production build locally
npm run preview
```

---

## Collaboration & Work With Us

For questions, enterprise partnerships, design partner collaboration, or early access:

- **Email**: [aaradhy@whatbreaks.dev](mailto:aaradhy@whatbreaks.dev)
- **Website**: [https://whatbreaks.dev](https://whatbreaks.dev)
- **Open Source Repository**: [https://github.com/aaradhychinche-alt/WhatBreaks](https://github.com/aaradhychinche-alt/WhatBreaks)

---

## License

Copyright © 2026 WhatBreaks, Inc. Licensed under the [Apache License, Version 2.0](LICENSE).
