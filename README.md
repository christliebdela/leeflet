# leeflet

> A high-velocity, local-first personal workspace crafted for capturing thoughts, organizing backlogs, prioritizing sprints, and staying in flow.

**leeflet** is an in-house personal productivity companion built with a strict monochrome design language, keyboard-driven navigation, and zero cloud lock-in. Everything lives directly on your local machine with complete privacy and instant response times.

---

## ✨ Philosophy & Highlights

- **100% Local-First & Private**: No mandatory user accounts, telemetry, or remote dependencies. Your data remains in your local directory (`C:\leeflet`).
- **Global Quick Capture (`Alt + L` / `Alt + N`)**: Summon a desktop floating capture bar from any active window or game to capture thoughts, bugs, or ideas in milliseconds.
- **Dedicated Desktop Architecture**:
  - **Full-Page Settings**: Comprehensive preference panel with custom project, priority, and type pickers, backup exports, and interactive hotkey cheat sheets.
  - **Profile Hub**: Identity management, active device stats, session security, and workflow status pills.
  - **Floating Mini Mode (`M`) & Sticky Notes**: Pin high-priority task queues as a minimal floating widget on top of your development workspace.
  - **Harmonic Audio Chimes**: Built-in dual-tone Web Audio synthesizer for pleasant acoustic feedback when completing tasks and checklist milestones.
- **Structured Workflows**:
  - **Classification**: *Task, Bug, Idea, Improvement, Research, Question, Note*
  - **Priorities**: *None, Low, Medium, High, Critical*
  - **Statuses**: *Inbox, Planned, In Progress, Done, Archived*
  - **Rich Detail Pane**: Inline checklists, markdown notes, auto-linking, and file attachments.

---

## ⌨️ Essential Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Alt + L` / `Alt + N` | Summon Floating Quick Capture | Global (Background) |
| `N` / `Ctrl + N` | New Task / Thought | In-App |
| `Ctrl + K` or `/` | Focus Workspace Search | In-App |
| `M` | Toggle Floating Mini Queue Mode | In-App |
| `Z` | Coffee Break / Standby Mode | In-App |
| `S` or `Ctrl + ,` | Open Settings & Preferences | In-App |
| `Ctrl + I` | Navigate to Backlog Inbox | In-App |
| `Ctrl + Q` | Navigate to My Queue | In-App |
| `1` – `9` | Instant Project Switcher | In-App |
| `Esc` | Dismiss Modal / Close Detail Pane | In-App |

---

## 🛠️ Tech Stack

- **Application Core**: [Tauri v2](https://v2.tauri.app/) (Rust backend)
- **Frontend Architecture**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (calm monochrome palette, dark/light adaptive tokens)
- **State & Data Layer**: Zustand + Local-first file storage & sync
- **Audio Synthesis**: Web Audio API (cross-platform offline harmonic synthesizer)
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://rustup.rs/) (latest stable)
- Visual Studio C++ Build Tools (for Windows native builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/christliebdela/leeflet.git
cd leeflet

# Install frontend dependencies
npm install
```

### Running Locally

```bash
# Run in development mode with Tauri native window and hot reloading
npm run tauri dev

# Alternatively, run Vite frontend in browser
npm run dev
```

### Production Build

```bash
# Compile and build the native standalone installer / binary (.exe)
npm run tauri build
```

The compiled installer and standalone executable will be generated under `src-tauri/target/release/bundle/`.

---

## 📄 License & Status

**Status**: Personal / In-House Project.  
All rights reserved. May be made available under an open-source license in the future.
