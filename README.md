# leaf

> A local-first workspace for capturing, organizing, prioritizing, and acting on everything you discover while working.

Built for builders. Useful for everyone.

---

## 🌿 Overview

When building software—or doing almost any project-based work—ideas, bugs, discoveries, questions, improvements, research notes, reminders, and small tasks appear constantly.

`leaf` combines the immediacy of desktop sticky notes with lightweight structure for projects, item types, priorities, statuses, tags, checklists, attachments, and queues—without forcing users into a cloud service or complicated project management system.

## 🚀 Key Features

- **Local-First & Private**: Your workspace belongs to you. No mandatory accounts, no cloud servers required.
- **Fast Capture**: Instant quick capture modal (`Ctrl+Shift+L` / `Cmd+Shift+L` or `+ Capture`) to record thoughts in seconds.
- **Structured Items**:
  - Types: *Idea, Bug, Task, Improvement, Research, Question, Note*
  - Priorities: *None, Low, Medium, High, Critical*
  - Statuses: *Inbox, Planned, In Progress, Done, Archived*
- **My Queue**: Cross-project triage view grouping what deserves your attention right now.
- **Checklists & Attachments**: Attach files directly and maintain inline task checklists.
- **Floating Sticky Notes**: Detach any active focus item into a floating sticky note card.
- **Workspace Portability**: Export and move your entire workspace database and attachments.

## 🛠️ Technology Stack

- **Desktop Framework**: [Tauri v2](https://v2.tauri.app/) (Rust)
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (calm neutral palette, custom leaf tokens)
- **State Management**: Zustand
- **Icons**: Lucide React
- **Database**: SQLite / Local-First Database Layer

## 💻 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://rustup.rs/) (for desktop Tauri builds)

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run web interface dev server
npm run dev

# Run desktop Tauri application
npm run tauri dev
```

### Production Build

```bash
# Build web bundle
npm run build

# Build native desktop installer (.msi / .exe)
npm run tauri build
```

## 📄 License

Open source under the MIT License.
