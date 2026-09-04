import { Workspace, Project, Item, ProjectModule, TeamMember } from '../types';

export const DEMO_WORKSPACE_ID = 'demo-workspace-ventrix';

export const DEMO_WORKSPACE: Workspace = {
  id: DEMO_WORKSPACE_ID,
  name: 'Ventrix RMS',
  path: 'leeflet://workspaces/ventrix-rms',
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-09-04T05:00:00.000Z',
  settings: {
    defaultPriority: 'none',
    defaultType: 'task',
    globalShortcut: 'Alt+L',
    theme: 'dark',
    compactMode: false,
  },
};

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-pos-terminal',
    name: 'POS Terminal & Hardware',
    color: '#0284c7', // Sky / Cyan Blue
    description: 'Next-gen touch register client, ESC/POS hardware peripheral drivers, offline cache, and payment gateway integration.',
    githubRepo: 'ventrix-rms/pos-terminal',
    githubLastSyncedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    githubSyncState: 'open',
    createdAt: '2026-08-05T09:00:00.000Z',
    updatedAt: '2026-09-04T04:20:00.000Z',
  },
  {
    id: 'proj-inventory-engine',
    name: 'Omnichannel Inventory',
    color: '#10b981', // Emerald
    description: 'Real-time multi-store stock ledger, warehouse transfers, barcode matrix, and replenishment triggers.',
    githubRepo: 'ventrix-rms/inventory-engine',
    githubLastSyncedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    githubSyncState: 'open',
    createdAt: '2026-08-08T10:30:00.000Z',
    updatedAt: '2026-09-03T18:15:00.000Z',
  },
  {
    id: 'proj-loyalty-crm',
    name: 'Promotions & Loyalty CRM',
    color: '#8b5cf6', // Violet
    description: 'Tiered rewards points ledger, coupon rules engine, customer purchase history, and gift card accounts.',
    githubRepo: 'ventrix-rms/loyalty-crm',
    githubLastSyncedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    githubSyncState: 'open',
    createdAt: '2026-08-12T11:00:00.000Z',
    updatedAt: '2026-09-02T16:00:00.000Z',
  },
  {
    id: 'proj-analytics-eod',
    name: 'Store Operations & EOD',
    color: '#f59e0b', // Amber
    description: 'Cash drawer variance reconciliation, End-of-Day (Z-Reports), cashier audit trails, and margin reporting.',
    githubRepo: 'ventrix-rms/store-analytics',
    githubLastSyncedAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    githubSyncState: 'open',
    createdAt: '2026-08-15T14:00:00.000Z',
    updatedAt: '2026-09-04T02:30:00.000Z',
  },
];

export const DEMO_COMPONENTS: ProjectModule[] = [
  {
    id: 'comp-hardware',
    workspaceId: DEMO_WORKSPACE_ID,
    projectId: 'proj-pos-terminal',
    name: 'Hardware Drivers & Peripherals',
    color: '#0284c7',
    memberIds: ['member-elena'],
    createdAt: '2026-08-05T09:00:00.000Z',
    updatedAt: '2026-08-05T09:00:00.000Z',
  },
  {
    id: 'comp-offline-sync',
    workspaceId: DEMO_WORKSPACE_ID,
    projectId: 'proj-pos-terminal',
    name: 'Offline Transaction Spooling',
    color: '#38bdf8',
    memberIds: ['member-elena', 'member-marcus'],
    createdAt: '2026-08-06T11:00:00.000Z',
    updatedAt: '2026-08-06T11:00:00.000Z',
  },
  {
    id: 'comp-stock-ledger',
    workspaceId: DEMO_WORKSPACE_ID,
    projectId: 'proj-inventory-engine',
    name: 'Real-Time Stock Allocation',
    color: '#10b981',
    memberIds: ['member-marcus'],
    createdAt: '2026-08-08T10:30:00.000Z',
    updatedAt: '2026-08-08T10:30:00.000Z',
  },
  {
    id: 'comp-bopis',
    workspaceId: DEMO_WORKSPACE_ID,
    projectId: 'proj-inventory-engine',
    name: 'BOPIS & Store Transfers',
    color: '#34d399',
    memberIds: ['member-marcus'],
    createdAt: '2026-08-09T14:00:00.000Z',
    updatedAt: '2026-08-09T14:00:00.000Z',
  },
  {
    id: 'comp-rules-engine',
    workspaceId: DEMO_WORKSPACE_ID,
    projectId: 'proj-loyalty-crm',
    name: 'Pricing & Promotions Engine',
    color: '#8b5cf6',
    memberIds: ['member-sophia'],
    createdAt: '2026-08-12T11:00:00.000Z',
    updatedAt: '2026-08-12T11:00:00.000Z',
  },
  {
    id: 'comp-gift-cards',
    workspaceId: DEMO_WORKSPACE_ID,
    projectId: 'proj-loyalty-crm',
    name: 'Gift Cards & Wallet Passes',
    color: '#a78bfa',
    memberIds: ['member-sophia'],
    createdAt: '2026-08-13T15:30:00.000Z',
    updatedAt: '2026-08-13T15:30:00.000Z',
  },
  {
    id: 'comp-reconciliation',
    workspaceId: DEMO_WORKSPACE_ID,
    projectId: 'proj-analytics-eod',
    name: 'Register Cash & EOD Audits',
    color: '#f59e0b',
    memberIds: ['member-devonte'],
    createdAt: '2026-08-15T14:00:00.000Z',
    updatedAt: '2026-08-15T14:00:00.000Z',
  },
  {
    id: 'comp-reporting',
    workspaceId: DEMO_WORKSPACE_ID,
    projectId: 'proj-analytics-eod',
    name: 'Gross Margin & Telemetry',
    color: '#fbbf24',
    memberIds: ['member-devonte'],
    createdAt: '2026-08-16T09:30:00.000Z',
    updatedAt: '2026-08-16T09:30:00.000Z',
  },
];

export const DEMO_MEMBERS: TeamMember[] = [
  {
    id: 'member-elena',
    name: 'Elena Chen',
    email: 'elena.chen@ventrixrms.com',
    role: 'Admin',
    status: 'active',
    joinedAt: 'Workspace Owner',
    avatarColor: 'bg-violet-600',
    avatarMascot: 'bot-spark',
  },
  {
    id: 'member-marcus',
    name: 'Marcus Vance',
    email: 'marcus.vance@ventrixrms.com',
    role: 'Member',
    status: 'active',
    joinedAt: 'May 2026',
    avatarColor: 'bg-emerald-600',
    avatarMascot: 'fox-clever',
  },
  {
    id: 'member-sophia',
    name: 'Sophia Sterling',
    email: 'sophia.s@ventrixrms.com',
    role: 'Member',
    status: 'active',
    joinedAt: 'Jun 2026',
    avatarColor: 'bg-blue-600',
    avatarMascot: 'cat-purr',
  },
  {
    id: 'member-devonte',
    name: 'Devonte Reed',
    email: 'devonte.r@ventrixrms.com',
    role: 'Member',
    status: 'active',
    joinedAt: 'Jul 2026',
    avatarColor: 'bg-amber-600',
    avatarMascot: 'owl-wise',
  },
  {
    id: 'member-claire',
    name: 'Claire Dumont',
    email: 'claire.d@ventrixrms.com',
    role: 'Member',
    status: 'invited',
    joinedAt: 'Invited 2 days ago',
    avatarColor: 'bg-rose-600',
    avatarMascot: 'panda-calm',
  },
];

export const DEMO_ITEMS: Item[] = [
  // ── IN PROGRESS ITEMS ──────────────────────────────────────────────────────
  {
    id: 'demo-item-1',
    projectId: 'proj-pos-terminal',
    title: 'Ingenico Lane/3000 EMV payment terminal USB disconnect on TLS keep-alive timeout',
    content: `## EMV Terminal Disconnect Investigation
Under peak checkout volumes, USB-over-IP and raw USB virtual COM ports on Lane/3000 terminals drop connection during TLS handshake keep-alive retries.

### Root Cause
Heartbeat interval is currently set to 15000ms with a 3000ms timeout. When serial queues buffer burst transactions, acknowledgment frames arrive after timeout threshold, triggering an unhandled port reset.

### Implementation Checklist
- Decrease heartbeat interval to 1000ms with non-blocking async poll
- Add graceful auto-reconnect fallback with frame sequence recovery
- Buffer offline contactless tenders in SQLite ledger if Lane/3000 terminal enters recovery cycle
- Verify zero transaction drop during physical cable disconnection test`,
    status: 'in_progress',
    priority: 'critical',
    type: 'bug',
    tags: ['pos-hardware', 'emv-payment', 'ingenico', 'pci-dss'],
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    assigneeId: 'member-elena',
    componentId: 'comp-hardware',
    checklist: [
      { id: 'c1-1', itemId: 'demo-item-1', title: 'Trace USB serial COM bus traffic with Wireshark USBPcap', isCompleted: true, position: 0 },
      { id: 'c1-2', itemId: 'demo-item-1', title: 'Implement async heartbeat keep-alive worker loop', isCompleted: true, position: 1 },
      { id: 'c1-3', itemId: 'demo-item-1', title: 'Add automatic reconnect state machine with exponential backoff', isCompleted: false, position: 2 },
      { id: 'c1-4', itemId: 'demo-item-1', title: 'Verify EMV L2 certification sandbox transaction flows', isCompleted: false, position: 3 },
    ],
    attachments: [],
    githubIssueNumber: 184,
    githubIssueUrl: 'https://github.com/ventrix-rms/pos-terminal/issues/184',
    githubIssueState: 'open',
    createdAt: '2026-08-30T09:15:00.000Z',
    updatedAt: '2026-09-04T03:45:00.000Z',
  },
  {
    id: 'demo-item-2',
    projectId: 'proj-inventory-engine',
    title: 'Distributed Redis lock race condition during high-velocity holiday flash sales',
    content: `## Multi-Store Stock Reservation Concurrency
When two physical store registers and the online storefront concurrently claim the final available SKU inventory, intermittent overselling occurs.

### Technical Approach
- Replace naive SETNX lock with Redlock distributed locking across regional clusters
- Introduce pessimistic reserve TTL of 45 seconds during cart checkout
- Auto-release reservation if customer abandons tender screen or payment fails`,
    status: 'in_progress',
    priority: 'critical',
    type: 'task',
    tags: ['inventory-sync', 'redis', 'concurrency', 'high-volume'],
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    assigneeId: 'member-marcus',
    componentId: 'comp-stock-ledger',
    checklist: [
      { id: 'c2-1', itemId: 'demo-item-2', title: 'Simulate 5,000 concurrent checkout requests in k6 load tests', isCompleted: true, position: 0 },
      { id: 'c2-2', itemId: 'demo-item-2', title: 'Implement Redis Lua atomic compare-and-decrement script', isCompleted: true, position: 1 },
      { id: 'c2-3', itemId: 'demo-item-2', title: 'Add dead-letter queue for failed stock rollback events', isCompleted: false, position: 2 },
      { id: 'c2-4', itemId: 'demo-item-2', title: 'Benchmark transaction latency impact (<12ms threshold)', isCompleted: false, position: 3 },
    ],
    attachments: [],
    githubIssueNumber: 209,
    githubIssueUrl: 'https://github.com/ventrix-rms/inventory-engine/issues/209',
    githubIssueState: 'open',
    createdAt: '2026-09-01T11:20:00.000Z',
    updatedAt: '2026-09-04T04:10:00.000Z',
  },
  {
    id: 'demo-item-3',
    projectId: 'proj-pos-terminal',
    title: 'Cryptographic SHA-256 forward hash-chain for offline register transaction spooling',
    content: `## Store Survivability & Offline Audit Security
Ensure retail store cashiers can continue tendering card and cash sales up to $250 without network connectivity, while guaranteeing transaction immutability.

### Requirements
- Every offline receipt payload hashed with SHA-256 containing previous transaction signature
- Store-specific Ed25519 private key stored in OS hardware TPM / Secure Enclave
- Automatic sequential drain to cloud gateway upon broadband recovery`,
    status: 'in_progress',
    priority: 'high',
    type: 'task',
    tags: ['offline-sync', 'cryptography', 'sqlite', 'audit-trail'],
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    assigneeId: 'member-elena',
    componentId: 'comp-offline-sync',
    checklist: [
      { id: 'c3-1', itemId: 'demo-item-3', title: 'Design tamper-evident block structure schema in SQLite', isCompleted: true, position: 0 },
      { id: 'c3-2', itemId: 'demo-item-3', title: 'Implement TPM key retrieval abstraction for Windows & macOS', isCompleted: false, position: 1 },
      { id: 'c3-3', itemId: 'demo-item-3', title: 'Simulate 24-hour broadband failure & automated ledger sync', isCompleted: false, position: 2 },
    ],
    attachments: [],
    githubIssueNumber: 192,
    githubIssueUrl: 'https://github.com/ventrix-rms/pos-terminal/issues/192',
    githubIssueState: 'open',
    createdAt: '2026-09-01T14:30:00.000Z',
    updatedAt: '2026-09-03T17:20:00.000Z',
  },
  {
    id: 'demo-item-4',
    projectId: 'proj-loyalty-crm',
    title: 'Real-time loyalty points earn-and-burn calculator at POS checkout tender selection',
    content: `## Dynamic Loyalty Redemption at Checkout
Allow cashiers to look up loyalty members via phone or QR code and dynamically apply reward points towards eligible transaction basket lines.

### Acceptance Criteria
- Instant entitlement lookup (<180ms response time)
- Restrict point burn on gift cards, tobacco, and clearance items
- Display post-transaction point balance on receipt printer slip`,
    status: 'in_progress',
    priority: 'high',
    type: 'task',
    tags: ['loyalty', 'pos-tender', 'real-time', 'promotions'],
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
    assigneeId: 'member-sophia',
    componentId: 'comp-rules-engine',
    checklist: [
      { id: 'c4-1', itemId: 'demo-item-4', title: 'Wire loyalty member lookup modal to keyboard shortcut (F6)', isCompleted: true, position: 0 },
      { id: 'c4-2', itemId: 'demo-item-4', title: 'Validate point-to-currency conversion ratios against ledger service', isCompleted: true, position: 1 },
      { id: 'c4-3', itemId: 'demo-item-4', title: 'Add dual-customer display prompt for cashier redemption confirmation', isCompleted: false, position: 2 },
    ],
    attachments: [],
    githubIssueNumber: 147,
    githubIssueUrl: 'https://github.com/ventrix-rms/loyalty-crm/issues/147',
    githubIssueState: 'open',
    createdAt: '2026-08-29T10:00:00.000Z',
    updatedAt: '2026-09-04T01:50:00.000Z',
  },
  {
    id: 'demo-item-5',
    projectId: 'proj-analytics-eod',
    title: 'PCI-DSS 4.0 requirement compliance for cashier supervisor price-override logs',
    content: `## Security & Supervisory Audit Logging
Under PCI-DSS 4.0 requirement 10.2, all supervisory override events (manager price discounts, cash drawer openings without sale, return authorizations) must log strict telemetry.

### Specification
- Log cashier badge ID, authorizing supervisor biometric / PIN hash, terminal MAC, and timestamp
- Store in immutable append-only JSON-lines audit buffer
- Transmit to centralized enterprise SIEM via mutual TLS`,
    status: 'in_progress',
    priority: 'high',
    type: 'task',
    tags: ['pci-dss', 'security', 'audit-logs', 'compliance'],
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(),
    assigneeId: 'member-devonte',
    componentId: 'comp-reconciliation',
    checklist: [
      { id: 'c5-1', itemId: 'demo-item-5', title: 'Audit current cashier override event triggers in codebase', isCompleted: true, position: 0 },
      { id: 'c5-2', itemId: 'demo-item-5', title: 'Define standardized RFC-5424 structured syslog schema', isCompleted: true, position: 1 },
      { id: 'c5-3', itemId: 'demo-item-5', title: 'Conduct external QSA compliance review signoff', isCompleted: false, position: 2 },
    ],
    attachments: [],
    githubIssueNumber: 116,
    githubIssueUrl: 'https://github.com/ventrix-rms/store-analytics/issues/116',
    githubIssueState: 'open',
    createdAt: '2026-08-31T15:10:00.000Z',
    updatedAt: '2026-09-03T19:00:00.000Z',
  },

  // ── PLANNED ITEMS ─────────────────────────────────────────────────────────
  {
    id: 'demo-item-6',
    projectId: 'proj-inventory-engine',
    title: 'BOPIS (Click & Collect) store fulfillment routing with 15-minute SLA pick-path optimization',
    content: `## In-Store Order Fulfillment Engine
Optimize order picking paths for retail associates fulfilling Buy-Online-Pickup-In-Store orders.

### Goal
Reduce average fulfillment pick time from 9.4 minutes to <5.2 minutes per order basket by sequencing SKU locations based on aisle and bin physical geometry.`,
    status: 'planned',
    priority: 'high',
    type: 'task',
    tags: ['bopis', 'fulfillment', 'routing', 'warehouse'],
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(),
    assigneeId: 'member-marcus',
    componentId: 'comp-bopis',
    checklist: [
      { id: 'c6-1', itemId: 'demo-item-6', title: 'Build store floorplan graph model with aisle coordinates', isCompleted: false, position: 0 },
      { id: 'c6-2', itemId: 'demo-item-6', title: 'Implement Dijkstra shortest-path warehouse traversal algorithm', isCompleted: false, position: 1 },
      { id: 'c6-3', itemId: 'demo-item-6', title: 'Mobile handheld zebra scanner UI for item barcode verification', isCompleted: false, position: 2 },
    ],
    attachments: [],
    githubIssueNumber: 215,
    githubIssueUrl: 'https://github.com/ventrix-rms/inventory-engine/issues/215',
    githubIssueState: 'open',
    createdAt: '2026-09-02T11:00:00.000Z',
    updatedAt: '2026-09-03T14:10:00.000Z',
  },
  {
    id: 'demo-item-7',
    projectId: 'proj-analytics-eod',
    title: 'Automated cash drawer variance anomaly detection flagging shortages >$15 threshold',
    content: `## End-of-Day Register Reconciliation Anomaly Model
Automatically correlate cashier cash drop totals with transaction tender sums to detect systemic till shortages, coin denomination errors, or potential shrinkage.

### Features
- Flags shift variances outside 2 standard deviations
- Alerts store general manager via push notification prior to final vault bank deposit
- Export certified EOD Z-Report directly to accounting ERP (NetSuite / SAP)`,
    status: 'planned',
    priority: 'high',
    type: 'idea',
    tags: ['eod-audit', 'cash-drawer', 'anomaly-detection', 'reporting'],
    assigneeId: 'member-devonte',
    componentId: 'comp-reconciliation',
    checklist: [
      { id: 'c7-1', itemId: 'demo-item-7', title: 'Collect 90-day historic till drop variance dataset', isCompleted: false, position: 0 },
      { id: 'c7-2', itemId: 'demo-item-7', title: 'Design store manager reconciliation review screen', isCompleted: false, position: 1 },
      { id: 'c7-3', itemId: 'demo-item-7', title: 'Integrate NetSuite GL journal entry API for daily closing', isCompleted: false, position: 2 },
    ],
    attachments: [],
    createdAt: '2026-09-02T16:45:00.000Z',
    updatedAt: '2026-09-03T10:15:00.000Z',
  },
  {
    id: 'demo-item-8',
    projectId: 'proj-pos-terminal',
    title: 'Epson TM-T88VI ESC/POS thermal printer driver migration from serial baud to native USB bulk',
    content: `## High-Speed Receipt Printing Optimization
Eliminate receipt printer bottleneck during holiday queue surges.

### Metrics
- Current print latency: 1,850ms per receipt slip over virtual COM baud 9600
- Target latency: <180ms using direct WinUSB / libusb bulk transfer endpoints
- Full support for raster logos, GS1 DataBar QR codes, and cutter kick pulses`,
    status: 'planned',
    priority: 'medium',
    type: 'improvement',
    tags: ['receipt-printer', 'esc-pos', 'epson', 'performance'],
    assigneeId: 'member-elena',
    componentId: 'comp-hardware',
    checklist: [
      { id: 'c8-1', itemId: 'demo-item-8', title: 'Write Rust native binding for libusb bulk endpoint communication', isCompleted: true, position: 0 },
      { id: 'c8-2', itemId: 'demo-item-8', title: 'Optimize raster 1-bit bitmap dithering for store logos', isCompleted: false, position: 1 },
      { id: 'c8-3', itemId: 'demo-item-8', title: 'Test paper jam detection and paper-out sensor callbacks', isCompleted: false, position: 2 },
    ],
    attachments: [],
    githubIssueNumber: 199,
    githubIssueUrl: 'https://github.com/ventrix-rms/pos-terminal/issues/199',
    githubIssueState: 'open',
    createdAt: '2026-09-01T08:30:00.000Z',
    updatedAt: '2026-09-03T16:40:00.000Z',
  },
  {
    id: 'demo-item-9',
    projectId: 'proj-loyalty-crm',
    title: 'Apple VAS (Value Added Services) NFC pass protocol support for 1-tap loyalty identification',
    content: `## Apple Wallet 1-Tap Customer Experience
Enable customers to tap their iPhone or Apple Watch at payment terminals to convey loyalty membership without scanning barcodes or entering phone numbers.

### Technical Scope
- Integrate Apple VAS merchant certificate and encryption private key
- Handle dual-tap (loyalty identification + Apple Pay tender in single tap gesture)`,
    status: 'planned',
    priority: 'medium',
    type: 'research',
    tags: ['apple-vas', 'nfc', 'apple-wallet', 'contactless'],
    assigneeId: 'member-sophia',
    componentId: 'comp-gift-cards',
    checklist: [
      { id: 'c9-1', itemId: 'demo-item-9', title: 'Review Apple VAS specification & acquire Merchant ID certificates', isCompleted: false, position: 0 },
      { id: 'c9-2', itemId: 'demo-item-9', title: 'Configure Ingenico Telium TETRA payment terminal firmware for VAS', isCompleted: false, position: 1 },
      { id: 'c9-3', itemId: 'demo-item-9', title: 'Prototype loyalty pass signing service in Go', isCompleted: false, position: 2 },
    ],
    attachments: [],
    createdAt: '2026-09-03T12:00:00.000Z',
    updatedAt: '2026-09-03T12:00:00.000Z',
  },
  {
    id: 'demo-item-10',
    projectId: 'proj-inventory-engine',
    title: 'Automated warehouse transfer manifest barcode validation during inter-store stock shipments',
    content: `## Inter-Store Stock Movement Integrity
Eliminate inventory shrinkage and discrepancy disputes between retail branches when transferring high-value merchandise.

### Workflow
- Origin warehouse generates sealed transfer manifest with Master Tracking QR
- Inbound store manager performs multi-box scan verification before items become sellable stock`,
    status: 'planned',
    priority: 'medium',
    type: 'task',
    tags: ['warehouse', 'barcode-scan', 'manifest', 'logistics'],
    assigneeId: 'member-marcus',
    componentId: 'comp-stock-ledger',
    checklist: [
      { id: 'c10-1', itemId: 'demo-item-10', title: 'Add transfer order status transition state machine', isCompleted: false, position: 0 },
      { id: 'c10-2', itemId: 'demo-item-10', title: 'Build difference report UI for partial shipment receipts', isCompleted: false, position: 1 },
    ],
    attachments: [],
    createdAt: '2026-09-02T13:40:00.000Z',
    updatedAt: '2026-09-02T13:40:00.000Z',
  },

  // ── INBOX ITEMS ───────────────────────────────────────────────────────────
  {
    id: 'demo-item-11',
    projectId: 'proj-inventory-engine',
    title: 'Barcode scanner GS1-128 parsing truncates variable-weight produce identifiers (AI 01 + AI 3922)',
    content: `## Produce Scanner Triage Bug
Cashiers at West End Flagship Store reported deli counter and butcher scales output barcodes with embedded price identifiers (Application Identifier 01 for GTIN and AI 3922 for amount payable).

Current regex parser only strips standard UPC-A 12-digit strings and throws 'Item Not Found' for GS1 variable-weight barcodes. Need hotfix parser support.`,
    status: 'inbox',
    priority: 'high',
    type: 'bug',
    tags: ['gs1-128', 'produce', 'scale-barcode', 'triage'],
    assigneeId: 'member-marcus',
    componentId: 'comp-stock-ledger',
    checklist: [],
    attachments: [],
    createdAt: '2026-09-04T01:10:00.000Z',
    updatedAt: '2026-09-04T01:10:00.000Z',
  },
  {
    id: 'demo-item-12',
    projectId: 'proj-loyalty-crm',
    title: 'Support compound tiered promotion: "Buy 2 Apparel, Get Footwear 40% Off" with MAP exclusions',
    content: `## Promotional Rules Engine Enhancement
Merchandising team requested cross-category bundle discounts for Fall Fashion Week.

The promotion engine must correctly identify qualifying items across different merchandise hierarchies while strictly respecting Minimum Advertised Price (MAP) manufacturer restrictions.`,
    status: 'inbox',
    priority: 'medium',
    type: 'idea',
    tags: ['promotions', 'discounts', 'rules-engine', 'pricing'],
    assigneeId: 'member-sophia',
    componentId: 'comp-rules-engine',
    checklist: [],
    attachments: [],
    createdAt: '2026-09-03T17:25:00.000Z',
    updatedAt: '2026-09-03T17:25:00.000Z',
  },
  {
    id: 'demo-item-13',
    projectId: 'proj-analytics-eod',
    title: 'Hourly store foot-traffic to basket conversion rate metric telemetry ingestion pipeline',
    content: `## In-Store Foot Traffic Sensor Integration
Integrate ceiling-mounted stereoscopic optical traffic counters (RetailNext / Irisys) with POS register checkout throughput to calculate real-time shopper conversion percentages per retail square foot.`,
    status: 'inbox',
    priority: 'low',
    type: 'research',
    tags: ['telemetry', 'conversion-rate', 'analytics', 'sensors'],
    assigneeId: 'member-devonte',
    componentId: 'comp-reporting',
    checklist: [],
    attachments: [],
    createdAt: '2026-09-03T18:50:00.000Z',
    updatedAt: '2026-09-03T18:50:00.000Z',
  },

  // ── DONE ITEMS ────────────────────────────────────────────────────────────
  {
    id: 'demo-item-14',
    projectId: 'proj-pos-terminal',
    title: 'Fix Chromium detached DOM memory leak in customer-facing display during continuous 14h shifts',
    content: `## Customer Dual-Display Memory Leak Fix
On busy 14-hour Friday shifts, customer-facing pole displays accumulated over 1.8GB of RAM due to un-garbage-collected promotional video canvas elements.

### Resolution
Refactored customer display pipeline to reuse a single HTML5 Canvas context and unbind RAF event handlers when promotional loop cycles. Verified stable 140MB memory footprint across 48h stress test.`,
    status: 'done',
    priority: 'critical',
    type: 'bug',
    tags: ['memory-leak', 'electron', 'dual-display', 'stability'],
    assigneeId: 'member-elena',
    componentId: 'comp-hardware',
    checklist: [
      { id: 'c14-1', itemId: 'demo-item-14', title: 'Capture Chrome DevTools heap snapshots during 8-hour continuous run', isCompleted: true, position: 0 },
      { id: 'c14-2', itemId: 'demo-item-14', title: 'Migrate media promotional carousel to shared canvas texture buffer', isCompleted: true, position: 1 },
      { id: 'c14-3', itemId: 'demo-item-14', title: 'Deploy patch to pilot store registers in Seattle & Chicago', isCompleted: true, position: 2 },
    ],
    attachments: [],
    githubIssueNumber: 164,
    githubIssueUrl: 'https://github.com/ventrix-rms/pos-terminal/issues/164',
    githubIssueState: 'closed',
    createdAt: '2026-08-22T10:00:00.000Z',
    updatedAt: '2026-08-28T16:30:00.000Z',
  },
  {
    id: 'demo-item-15',
    projectId: 'proj-loyalty-crm',
    title: 'Stripe Financial Connections webhook handler for omnichannel stored-value gift card reloads',
    content: `## Real-Time Gift Card Reloads
Implemented idempotent webhook processor for instant digital and physical gift card top-ups via Stripe ACH and credit cards.

Ensured replay protection using Redis idempotency keys and ledger balance verification before activating balance increments.`,
    status: 'done',
    priority: 'high',
    type: 'task',
    tags: ['stripe', 'gift-cards', 'webhooks', 'payments'],
    assigneeId: 'member-sophia',
    componentId: 'comp-gift-cards',
    checklist: [
      { id: 'c15-1', itemId: 'demo-item-15', title: 'Configure Stripe signature verification middleware', isCompleted: true, position: 0 },
      { id: 'c15-2', itemId: 'demo-item-15', title: 'Handle customer bank account micro-deposit verification', isCompleted: true, position: 1 },
      { id: 'c15-3', itemId: 'demo-item-15', title: 'Implement transactional rollback for failed ledger commits', isCompleted: true, position: 2 },
      { id: 'c15-4', itemId: 'demo-item-15', title: 'End-to-end sandbox gift card balance reload test suite', isCompleted: true, position: 3 },
    ],
    attachments: [],
    githubIssueNumber: 132,
    githubIssueUrl: 'https://github.com/ventrix-rms/loyalty-crm/issues/132',
    githubIssueState: 'closed',
    createdAt: '2026-08-18T11:20:00.000Z',
    updatedAt: '2026-08-25T14:40:00.000Z',
  },
  {
    id: 'demo-item-16',
    projectId: 'proj-analytics-eod',
    title: 'Real-time WebSocket streaming dashboard for regional manager gross margin and average basket size',
    content: `## Live Regional Operations Telemetry
Stream store sales metrics, units-per-transaction (UPT), average order value (AOV), and gross margins to regional VP dashboards with sub-second update latency.

Replaced polling intervals with an efficient Redis Pub/Sub WebSocket broadcast channel.`,
    status: 'done',
    priority: 'high',
    type: 'improvement',
    tags: ['websockets', 'dashboard', 'gross-margin', 'real-time'],
    assigneeId: 'member-devonte',
    componentId: 'comp-reporting',
    checklist: [
      { id: 'c16-1', itemId: 'demo-item-16', title: 'Build fast aggregation worker using TimescaleDB hypertable', isCompleted: true, position: 0 },
      { id: 'c16-2', itemId: 'demo-item-16', title: 'Establish WebSocket channel with reconnect exponential backoff', isCompleted: true, position: 1 },
      { id: 'c16-3', itemId: 'demo-item-16', title: 'Benchmark WebSocket memory utilization with 250 connected managers', isCompleted: true, position: 2 },
    ],
    attachments: [],
    githubIssueNumber: 108,
    githubIssueUrl: 'https://github.com/ventrix-rms/store-analytics/issues/108',
    githubIssueState: 'closed',
    createdAt: '2026-08-15T09:00:00.000Z',
    updatedAt: '2026-08-24T18:00:00.000Z',
  },
];
