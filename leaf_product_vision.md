# leaf — Product Vision & MVP Specification

> **Working product name:** leaf
>
> **Brand style:** `leaf` — lowercase, simple, quiet, approachable.
>
> **Positioning:** A local-first workspace for capturing, organizing, prioritizing, and acting on everything you discover while working.

---

## 1. Product Vision

### 1.1 The problem

When building software—or doing almost any project-based work—ideas, bugs, discoveries, questions, improvements, research notes, reminders, and small tasks appear constantly.

Traditional sticky notes are excellent for instant capture, but quickly become difficult to manage when working across multiple projects. Generic note-taking applications often go too far in the other direction: they become knowledge bases, document editors, or complex productivity systems rather than a fast place to capture and act on work.

leaf exists to bridge that gap.

### 1.2 The vision

**leaf is the user's personal work surface.**

It should feel as immediate as a sticky note, but provide enough structure to turn scattered thoughts into organized work.

A user should be able to:

- capture something in seconds;
- assign it to a project;
- classify it as a bug, idea, task, research item, improvement, question, or note;
- set its priority;
- attach files and links;
- find it later;
- work through it;
- mark it complete;
- keep everything locally and privately;
- take the entire workspace to another computer when needed.

### 1.3 Positioning

**Built for builders. Useful for everyone.**

Developers are an important target audience because their workflow naturally produces bugs, ideas, technical discoveries, research, implementation tasks, and project-specific notes. However, leaf should never feel like a developer-only product.

A student, designer, researcher, freelancer, founder, or business owner should be able to use the same concepts without learning developer terminology.

---

## 2. Product Principles

### Local-first

The local copy is the primary source of truth. The application must remain useful without an internet connection.

### Private by default

No account should be required to use leaf. No mandatory cloud service should exist.

### Fast capture

Creating an item should be significantly faster than opening a traditional notes application and deciding where to put something.

### Structured without being rigid

leaf should provide useful metadata without forcing users into complicated project-management workflows.

### Portable

A user's workspace should belong to the user, not to leaf's servers.

### Calm interface

The interface should be clean, modern, restrained, and highly readable. Avoid excessive color, decoration, gradients, shadows, or oversized rounded UI. Themes can be introduced later.

### Progressive complexity

The basic workflow should be understandable immediately. Advanced functionality should appear only when useful.

---

## 3. Core Mental Model

leaf should use a simple hierarchy:

```text
Workspace
  └── Projects
       └── Items
            ├── metadata
            ├── description/content
            ├── checklist
            ├── attachments
            └── links
```

### Workspace

The user's overall leaf environment. A workspace contains projects, items, settings, attachments, and local application data.

### Project

A collection of related work. A project could represent a software product, client, school subject, personal goal, business, or any other area of work.

### Item

The fundamental unit of leaf. An item represents anything the user wants to capture and possibly act on.

---

## 4. Item Types

Keep the initial type system intentionally small.

- **Idea** — something the user may want to explore or build.
- **Bug** — something broken or behaving incorrectly.
- **Task** — something that needs to be done.
- **Improvement** — an existing feature or process that could be better.
- **Research** — something that needs investigation or learning.
- **Question** — something unresolved.
- **Note** — information worth keeping that does not fit another type.

Types should be extensible later, but the MVP should not encourage users to create dozens of categories.

---

## 5. Priority

Initial priority levels:

- None
- Low
- Medium
- High
- Critical

Priority should be visually obvious but should not make the interface overly colorful.

---

## 6. Status

Initial statuses:

- **Inbox** — captured but not organized or planned.
- **Planned** — acknowledged and intended for later.
- **In Progress** — currently being worked on.
- **Done** — completed.
- **Archived** — intentionally removed from active views without deleting it.

The status system should remain intentionally lightweight. leaf is not intended to become a full project-management or issue-tracking system in the MVP.

---

## 7. Item Data Model

Each item should support, at minimum:

```text
id
project_id
title
description/content
type
priority
status
tags
created_at
updated_at
due_at (optional)
completed_at (optional)
```

Future metadata may include:

```text
source/repository
external_url
pinned
favorite
recurrence
relationships
```

---

## 8. Attachments

Attachments are a **first-class feature**, not an afterthought.

Users should be able to attach files directly to items, including things such as:

- screenshots;
- images;
- PDFs;
- documents;
- design exports;
- log files;
- text files;
- code snippets/files;
- other useful project artifacts.

### Storage principle

Attachments should live in the user's local workspace rather than being uploaded to a leaf-owned cloud service.

A conceptual workspace structure could be:

```text
leaf-workspace/
├── leaf.db
├── attachments/
│   ├── ...
├── exports/
├── backups/
└── workspace.json
```

The exact implementation may change, but portability must remain a design requirement.

### Attachment behavior

The MVP should support:

- drag and drop;
- file picker;
- opening an attachment using the operating system's default application;
- removing an attachment;
- viewing attachment metadata;
- preserving attachments when the workspace is backed up or moved.

---

## 9. Quick Capture

Quick Capture is one of the most important parts of leaf.

The user should not have to open the full application just to record a thought.

### Global keyboard shortcut

A configurable global shortcut should open a small capture window from anywhere in the operating system.

Example concept:

```text
┌─────────────────────────────────────────┐
│ What's on your mind?                    │
│                                         │
│ Fix email replies not appearing...      │
│                                         │
│ Project: Qlaima     Type: Bug           │
│ Priority: High     [Add]                │
└─────────────────────────────────────────┘
```

The MVP should make the fastest path possible:

**open → type → save → continue working.**

Optional metadata can be set before saving, but none should be mandatory beyond the item itself.

---

## 10. Floating Notes / Sticky Mode

leaf should preserve the convenience of desktop sticky notes while giving them real structure.

Users should be able to open an item as a small floating window/card.

Example:

```text
┌─────────────────────────┐
│ Qlaima              ••• │
├─────────────────────────┤
│ Email replies aren't    │
│ appearing in inbox.     │
│                         │
│ HIGH · BUG              │
└─────────────────────────┘
```

Floating notes should be useful for active work without becoming a second application.

This capability can evolve after MVP, but the underlying item architecture should support it from the beginning.

---

## 11. Main Application UX

The main application should use a simple desktop workspace layout.

Conceptually:

```text
┌─────────────────────────────────────────────────────────────┐
│ leaf                                 Search       + Capture  │
├──────────────┬──────────────────────────────────────────────┤
│ Inbox     12 │ Qlaima                                       │
│              │                                              │
│ Projects     │ 🔴 Fix inbound email synchronization          │
│ ├ Qlaima 24  │ 🟠 Add SMTP connection tester               │
│ ├ Ventrix 8  │ 🔵 Consider WhatsApp integration             │
│ └ Personal 3 │ 🟡 Research MailParser                      │
│              │                                              │
│ Views        │                                              │
│ All          │                                              │
│ Bugs         │                                              │
│ Ideas        │                                              │
│ Tasks        │                                              │
│ High Priority│                                              │
│ Completed    │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

This is a conceptual layout, not a final visual specification.

### UI direction

- clean;
- modern;
- minimal;
- mostly neutral colors;
- restrained use of accent colors;
- minimal corner radius;
- strong typography and spacing;
- clear hierarchy;
- keyboard-friendly;
- responsive within the desktop window;
- no unnecessary visual noise.

### Themes

The MVP should use a polished default light theme and/or a carefully designed system-aware theme.

A full theme engine should **not** be a launch requirement.

Future themes may include dark mode and additional user-selectable themes without changing the core UI architecture.

---

## 12. Simple Onboarding

The first-run experience should be deliberately short.

No account wall. No lengthy tutorial. No unnecessary permissions.

### Suggested onboarding

**Screen 1 — Welcome**

```text
Welcome to leaf

A simple workspace for everything you're working on.

[Get Started]
```

**Screen 2 — Workspace location**

```text
Where should leaf store your workspace?

● Default location
○ Choose a location

Your workspace can be moved or backed up later.

[Continue]
```

**Screen 3 — Create first project**

```text
What are you working on?

[ Project name                    ]

You can change this later.

[Continue]
```

**Screen 4 — Done**

```text
You're ready.

Capture ideas, bugs, tasks, research,
and everything else as you work.

[Open leaf]
```

This can potentially be reduced to three screens if usability testing shows that one step can be combined.

---

## 13. Projects

Projects are central but should remain lightweight.

A project should have:

- name;
- optional description;
- optional icon/color/accent;
- items;
- optional local folder/repository association.

Projects should be able to represent anything, not just software repositories.

Examples:

```text
Qlaima
Ventrix RMS
Hotel Management System
University
Personal
Client — ABC Company
```

---

## 14. Developer-Oriented Project Integration

Developers should be able to associate a project with a local folder or repository.

Example:

```text
Qlaima
└── Local folder
    C:\Projects\qlaima
```

Future actions may include:

- Open repository;
- Open terminal here;
- Copy project path;
- Open in code editor;
- View Git status;
- Create GitHub issue;
- Link commits or pull requests.

These should not be required for MVP, but the data model should allow a project to have a local path.

---

## 15. My Queue

One of the most valuable global views should be **My Queue**.

It ignores project boundaries and answers:

> What needs my attention right now?

Example:

```text
MY QUEUE

Critical
  Fix Paystack calculation
  Qlaima email sync

High
  Improve onboarding
  Add SMTP validation
  Fix mobile navigation

Medium
  Research WhatsApp API
  Improve invoice PDF

Ideas
  AI project estimator
  Automated client follow-ups
```

This view should work across every project.

---

## 16. Search and Filtering

The MVP must have fast global search.

Users should be able to search across:

- item titles;
- item descriptions;
- projects;
- tags;
- attachment names.

Filtering should support at least:

- project;
- type;
- status;
- priority;
- tag;
- completion state.

Keyboard-driven search should be strongly considered.

---

## 17. Tags

Tags provide flexible organization without forcing users into complicated folders.

Example:

```text
#email
#payments
#frontend
#research
#urgent
#customer-feedback
```

Tags should be global but easy to filter by.

The MVP should avoid building a separate taxonomy-management system.

---

## 18. Checklists

Items should optionally contain checklists.

Example:

```text
Improve onboarding

- [ ] Review current flow
- [ ] Remove unnecessary screen
- [ ] Add skip option
- [ ] Test first-run experience
```

A checklist can exist inside an item without turning every item into a project-management ticket.

---

## 19. Portability

Portability should be a defining product capability.

A user's leaf workspace should be transferable between compatible installations without requiring a server-side account.

### Desired experience

Example future flow:

```text
leaf
  → Settings
  → Portable Workspace
  → Copy Workspace
  → Select external drive
  → Copy
  → safely eject drive
```

On another computer:

```text
Insert drive
  → Open/install leaf
  → Open Existing Workspace
  → Select workspace on drive
  → leaf opens everything
```

### Requirements

The architecture should make it possible to move:

- database;
- attachments;
- workspace configuration;
- local metadata;
- user-created exports;
- backups.

### Important architectural constraint

The workspace must avoid hidden dependencies on machine-specific locations wherever possible.

Paths, attachment references, and configuration should use portable references or be remappable when a workspace is moved.

### MVP priority

True one-click external-drive portability can be treated as **post-MVP**, but the storage architecture must be designed to support it from the beginning.

---

## 20. Backup and Cloud Storage

leaf should not operate a proprietary cloud database simply to provide backup.

The user's data should remain theirs.

### Local backup

The MVP should provide a clear backup/export mechanism that lets the user create a complete copy of their workspace.

Possible formats:

```text
leaf-backup/
├── leaf.db
├── attachments/
├── workspace.json
└── manifest.json
```

### Google Drive integration

A future feature may allow users to connect their own Google account and use their own Google Drive for backup and potentially synchronization.

The principle is:

**User-owned cloud storage, not leaf-owned infrastructure.**

This avoids the need for leaf to maintain a cloud database or pay ongoing storage costs for every user.

### Backup vs sync

These should be treated as separate features.

**Backup:**

The application periodically or manually uploads a copy of the local workspace to the user's Google Drive.

**Sync:**

Multiple devices coordinate changes to the same workspace.

True synchronization is substantially more complex because of:

- conflicting edits;
- offline changes;
- attachment synchronization;
- deleted items;
- concurrent devices;
- versioning;
- authentication;
- corruption recovery.

Therefore:

- Google Drive backup can be an early post-MVP feature.
- True multi-device synchronization should be considered a later major feature.

### Privacy

Cloud integrations should be opt-in.

The application must clearly communicate what data is uploaded and where it is stored.

---

## 21. Technology Direction

### Desktop framework

**Tauri**

Reasons:

- native desktop application model;
- significantly lighter footprint than traditional Electron applications;
- access to operating-system capabilities;
- suitable for global shortcuts, filesystem operations, external applications, window management, and portable workspaces;
- strong fit for a local-first desktop product.

### Frontend

Recommended:

- React
- TypeScript
- modern component architecture
- Tailwind CSS and/or a lightweight component system if useful

The exact UI library should not dictate the design. leaf should maintain its own visual language.

### Database

**SQLite**

SQLite should be the local source of truth for structured application data.

Benefits:

- local;
- mature;
- portable;
- fast;
- no database server required;
- easy backup;
- well suited to desktop applications.

### File storage

Files should live in the workspace filesystem, with SQLite storing metadata and references.

Avoid putting large binary files directly into SQLite unless a specific use case later justifies it.

### Architecture principle

```text
┌───────────────────────────────┐
│            leaf UI            │
│       React + TypeScript      │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│             Tauri             │
│ filesystem / OS / windows /   │
│ shortcuts / native functions  │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
   SQLite database    Workspace files
                         │
                    attachments/
```

---

## 22. Data Ownership

leaf should follow a strong ownership principle:

> **The user owns the workspace and can access it without leaf's servers.**

The application should never make the user feel locked in.

Users should be able to:

- back up their data;
- move their workspace;
- export their information;
- keep using it offline;
- remove the application without losing their workspace.

---

## 23. Open Source Philosophy

leaf should be free and open source.

The repository should contain the complete application source code and development documentation.

The project should favor:

- transparent storage;
- no mandatory account;
- no mandatory subscriptions;
- no proprietary backend requirement;
- community contributions;
- clear documentation;
- reproducible builds where practical.

A permissive open-source license should be selected before the first public release.

---

## 24. MVP Scope

The MVP exists to validate one question:

> **Is leaf genuinely better than Sticky Notes + random files/notes for managing the things users discover while working?**

### MVP must include

- Windows desktop application;
- Tauri shell;
- React + TypeScript UI;
- SQLite local database;
- workspace creation;
- workspace location selection;
- projects;
- item creation/editing/deletion;
- item types;
- priorities;
- statuses;
- tags;
- checklists;
- attachments;
- drag-and-drop attachments;
- local attachment storage;
- project filtering;
- type filtering;
- priority filtering;
- status filtering;
- global search;
- Inbox;
- My Queue;
- project views;
- global quick capture;
- configurable global keyboard shortcut;
- simple onboarding;
- clean default theme;
- local backup/export;
- import/open existing workspace;
- basic workspace portability;
- no account requirement;
- no cloud dependency.

### MVP should NOT require

- user accounts;
- proprietary cloud infrastructure;
- mandatory sync;
- team collaboration;
- real-time collaboration;
- complex permissions;
- calendars;
- time tracking;
- invoicing;
- full Kanban project management;
- advanced AI features;
- GitHub integration;
- multi-device conflict resolution;
- mobile applications.

---

## 25. Post-MVP Priorities

### High priority

- true portable workspace workflow;
- one-click workspace backup;
- Google Drive backup;
- dark mode;
- more themes;
- richer keyboard navigation;
- better attachment previews;
- item pinning/favorites;
- recent items;
- archive improvements;
- workspace recovery tools.

### Medium priority

- Google Drive synchronization;
- Git repository integration;
- open in VS Code or selected editor;
- terminal actions;
- GitHub issue integration;
- external links/deep links;
- desktop notifications;
- recurring tasks;
- richer markdown editing;
- templates;
- item relationships.

### Later / experimental

- local AI assistance;
- automatic type/project suggestions;
- natural-language capture;
- semantic search;
- AI-generated summaries;
- duplicate detection;
- smart prioritization;
- intelligent project organization;
- optional third-party integrations.

---

## 26. What leaf Should NOT Become

Product discipline is important.

leaf should not become:

### Another Notion

Avoid building a generalized everything-database or document platform.

### Another Jira

Avoid turning simple items into complex issue-management workflows.

### Another Trello

Boards can be added later if clearly useful, but they should not define the core experience.

### Another Obsidian

Markdown and local files may be useful, but leaf should focus primarily on actionable capture and organization rather than becoming a knowledge graph.

### Another cloud productivity SaaS

The product should not require users to trust leaf with their information merely to function.

---

## 27. First-Run User Journey

The ideal experience is:

```text
Install
  ↓
Open leaf
  ↓
Very short onboarding
  ↓
Choose workspace location
  ↓
Create first project
  ↓
See empty workspace
  ↓
Capture first thought
  ↓
Continue working
```

The user should understand the product within minutes without reading documentation.

---

## 28. Example Real-World Workflow

A developer is working on Qlaima.

They discover a bug:

```text
Fix inbound email synchronization
Type: Bug
Priority: Critical
Project: Qlaima
```

They remember an idea:

```text
Maybe support automatic client follow-ups
Type: Idea
Priority: Medium
Project: Qlaima
```

They find a useful article and save it:

```text
Investigate MailParser
Type: Research
Priority: Low
Project: Qlaima
Attachment: screenshot.png
Link: https://...
```

They create a task:

```text
Improve onboarding
Type: Task
Priority: High
Project: Qlaima
Checklist:
- [ ] Remove unnecessary step
- [ ] Improve copy
- [ ] Test first-run experience
```

At the end of the day, **My Queue** shows what deserves attention tomorrow.

The user never needs to remember where they originally wrote something.

---

## 29. Success Criteria for the MVP

The MVP should be considered successful when a real user can replace their existing collection of sticky notes, temporary text files, random screenshots, and scattered reminders with leaf for day-to-day project work.

Qualitative signals should include:

- users capture ideas without hesitation;
- users can find old information quickly;
- users understand projects and item types immediately;
- users actively use priority and status;
- users attach screenshots/files naturally;
- users return to My Queue;
- users prefer leaf over having many Sticky Notes windows open;
- users trust the local-first model;
- users understand how to back up and move their workspace.

---

## 30. Product Personality

leaf should feel:

- calm;
- lightweight;
- fast;
- reliable;
- private;
- capable;
- approachable;
- quietly powerful.

It should **not** feel:

- enterprise-heavy;
- overly technical;
- childish;
- overly colorful;
- gamified;
- cluttered;
- aggressively AI-driven;
- dependent on the cloud.

---

## 31. Brand Direction

### Name

**leaf**

Always rendered in lowercase in the product UI and brand identity unless a context requires otherwise.

### Why the name works

The name is intentionally not descriptive.

A leaf is small, simple, lightweight, and part of a larger structure. That maps naturally onto the product concept: individual thoughts and work items can be captured independently while still belonging to larger projects and workspaces.

The meaning of the name can grow from the product rather than the name attempting to explain the product.

### Brand direction

Quiet, clean, minimal, contemporary.

The visual identity should avoid obvious productivity clichés such as checkmarks everywhere, bright rainbow colors, cartoon illustrations, or generic task-management imagery.

---

## 32. Long-Term Vision

The long-term vision is not merely a better sticky-note application.

leaf can become a **portable personal work environment** that sits between thinking and execution.

A user's local workspace could eventually contain:

```text
Thoughts
Ideas
Research
Bugs
Tasks
Projects
Files
Links
Repositories
References
History
```

The application can remain local-first while becoming increasingly intelligent and useful.

A future leaf could understand that:

> "This bug belongs to Qlaima, relates to the email integration research note, has a screenshot attached, and is currently the highest-priority unresolved item."

The system could surface that relationship without requiring the user to manually maintain a complicated database.

The key is that intelligence should enhance the user's workspace—not take ownership of it.

---

# 33. Final Product Statement

> **leaf is a free, open-source, local-first workspace for capturing and organizing everything you're working on.**
>
> It combines the immediacy of sticky notes with lightweight structure for projects, tasks, bugs, ideas, research, priorities, checklists, attachments, and queues—without forcing users into a cloud service or complicated productivity system.
>
> Your workspace stays with you. Your files stay with you. Your data stays yours.

---

## 34. Initial Build Order

### Phase 1 — Foundation

- initialize Tauri application;
- establish React/TypeScript UI architecture;
- establish SQLite schema and data access layer;
- implement workspace creation/opening;
- implement workspace filesystem structure;
- implement application settings;
- establish backup-safe data model.

### Phase 2 — Core Items

- projects;
- items;
- types;
- priorities;
- statuses;
- tags;
- checklists;
- editing/deleting;
- timestamps.

### Phase 3 — Attachments

- attachment storage;
- drag and drop;
- file picker;
- attachment metadata;
- open/remove attachment;
- attachment preservation during backup/export.

### Phase 4 — Discovery & Workflow

- Inbox;
- My Queue;
- filters;
- global search;
- project views;
- keyboard navigation;
- sorting.

### Phase 5 — Quick Capture

- global shortcut;
- compact capture window;
- quick project selection;
- quick type/priority assignment.

### Phase 6 — Onboarding & Polish

- first-run onboarding;
- empty states;
- keyboard shortcuts;
- accessibility basics;
- polished default theme;
- error handling;
- recovery flows;
- performance optimization.

### Phase 7 — Backup & Portability

- complete workspace export;
- import/open existing workspace;
- backup validation;
- portable path handling;
- preparation for external-drive workflow.

### Phase 8 — MVP Release

- documentation;
- open-source repository;
- installer/build process;
- versioning/update mechanism;
- crash/error reporting only if explicitly opt-in and privacy-preserving;
- release testing.

---

## 35. MVP Definition of Done

The MVP is ready when a user can install leaf on Windows, complete the short onboarding, create projects, rapidly capture ideas or work items, organize and prioritize them, attach files, search and filter them, manage a personal queue, back up the complete workspace, close the application, reopen it later, and continue entirely offline.

The user should not need a leaf account, a leaf server, or an internet connection for any core workflow.

**The central promise of the MVP:**

> **Capture it. Organize it. Keep it. Act on it.**
