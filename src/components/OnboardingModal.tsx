import React, { useState, useEffect } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { Folder, X, ArrowRight, Check, Zap, HardDrive } from 'lucide-react';

const SUGGESTED_PROJECTS = [
  'Personal',
  'Side Projects',
  'Work',
  'Research',
  'Learning',
];

export const OnboardingModal: React.FC = () => {
  const { workspace, isOnboardingOpen, setOnboardingOpen, createWorkspace, createProject } = useLeafStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [workspaceName, setWorkspaceName] = useState('My Workspace');
  const [workspaceLocation, setWorkspaceLocation] = useState('C:\\leaf');
  const [projectName, setProjectName] = useState('My Project');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name || 'My Workspace');
      setWorkspaceLocation(workspace.path || 'C:\\leaf');
    }
  }, [workspace, isOnboardingOpen]);

  // Global escape key to exit onboarding tour if workspace exists
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOnboardingOpen && workspace) {
        setOnboardingOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOnboardingOpen, setOnboardingOpen, workspace]);

  if (!isOnboardingOpen) return null;

  const handleBrowseFolder = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Workspace Location',
        defaultPath: workspaceLocation,
      });
      if (selected && typeof selected === 'string') {
        setWorkspaceLocation(selected);
      }
    } catch {
      // Ignore in browser mock
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      if (!workspace) {
        await createWorkspace(workspaceName.trim() || 'My Workspace', workspaceLocation);
        if (projectName.trim()) {
          await createProject({
            name: projectName.trim(),
            description: 'Initial project created during setup',
          });
        }
      } else {
        if (projectName.trim() && projectName !== 'My Project' && projectName !== 'Initial Project') {
          await createProject({
            name: projectName.trim(),
            description: 'Project created during setup tour',
          });
        }
        setOnboardingOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-[390px] bg-white dark:bg-[#141416] rounded-[14px] border border-[#e5e7eb] dark:border-[#27272a] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Minimal Progress Bar & Dismiss */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-1">
            <div
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                step >= 1 ? 'bg-[#111827] dark:bg-white' : 'bg-[#e5e7eb] dark:bg-[#27272a]'
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                step >= 2 ? 'bg-[#111827] dark:bg-white' : 'bg-[#e5e7eb] dark:bg-[#27272a]'
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                step >= 3 ? 'bg-[#111827] dark:bg-white' : 'bg-[#e5e7eb] dark:bg-[#27272a]'
              }`}
            />
          </div>

          {workspace && (
            <button
              onClick={() => setOnboardingOpen(false)}
              title="Exit Tour (Esc)"
              className="p-1 rounded-[4px] text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] hover:text-[#111827] dark:hover:text-white transition-colors -mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Step 1: Minimal Welcome */}
        {step === 1 && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#f4f5f6] dark:bg-[#1f1f23] border border-[#e5e7eb] dark:border-[#27272a] flex items-center justify-center shrink-0">
                <img
                  src="/leaf_logo.png"
                  alt="leaf"
                  className="w-5 h-5 object-contain brightness-0 dark:brightness-0 dark:invert"
                />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
                  Welcome to Leaf
                </h1>
                <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa]">
                  Local-first desktop workspace
                </p>
              </div>
            </div>

            <p className="text-xs text-[#4b5563] dark:text-[#a1a1aa] leading-relaxed">
              Capture tasks, ideas, and thoughts instantly with zero friction and total privacy on your disk.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2.5 p-2 rounded-[8px] bg-[#f9fafb] dark:bg-[#1a1a1d] border border-[#f3f4f6] dark:border-[#27272a]">
                <Zap className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                <div className="text-[11.5px] text-[#374151] dark:text-[#d4d4d8] flex items-center justify-between w-full">
                  <span>Quick Capture anywhere</span>
                  <kbd className="px-1 py-0.5 rounded bg-white dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[9px] font-semibold text-[#6b7280] dark:text-[#a1a1aa]">
                    Ctrl+Shift+N
                  </kbd>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-[8px] bg-[#f9fafb] dark:bg-[#1a1a1d] border border-[#f3f4f6] dark:border-[#27272a]">
                <HardDrive className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                <div className="text-[11.5px] text-[#374151] dark:text-[#d4d4d8]">
                  100% offline & local file storage
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStep(2)}
                className="w-full py-2 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[8px] text-xs font-semibold shadow-subtle transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Storage Setup */}
        {step === 2 && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-150">
            <div>
              <h2 className="text-sm font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
                Workspace Storage
              </h2>
              <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                Choose a local folder to store your notes and items.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] block mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1a1a1d] border border-[#e5e7eb] dark:border-[#27272a] focus:border-[#9ca3af] dark:focus:border-[#52525b] rounded-[8px] text-xs text-[#111827] dark:text-[#f4f4f5] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] block mb-1">
                  Folder Location
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 flex items-center gap-2 px-2.5 py-1.5 bg-[#f9fafb] dark:bg-[#1a1a1d] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] text-xs">
                    <Folder className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                    <input
                      type="text"
                      value={workspaceLocation}
                      onChange={(e) => setWorkspaceLocation(e.target.value)}
                      className="bg-transparent w-full focus:outline-none text-xs text-[#111827] dark:text-[#f4f4f5] truncate"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleBrowseFolder}
                    className="px-2.5 py-1.5 bg-[#f3f4f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[8px] border border-[#e5e7eb] dark:border-[#3f3f46] text-xs font-medium transition-colors shrink-0"
                  >
                    Browse
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setStep(1)}
                className="py-1.5 px-3 border border-[#e5e7eb] dark:border-[#27272a] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[8px] text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[8px] text-xs font-semibold shadow-subtle transition-all flex items-center justify-center gap-1"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: First Project Setup */}
        {step === 3 && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-150">
            <div>
              <h2 className="text-sm font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
                Create First Project
              </h2>
              <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                Group tasks and ideas by context or initiative.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] block mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Work, Side Project, Personal..."
                  className="w-full px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1a1a1d] border border-[#e5e7eb] dark:border-[#27272a] focus:border-[#9ca3af] dark:focus:border-[#52525b] rounded-[8px] text-xs text-[#111827] dark:text-[#f4f4f5] outline-none"
                />
              </div>

              {/* Quick Preset Pills */}
              <div>
                <div className="text-[10px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] mb-1.5 uppercase tracking-wider">
                  Suggestions
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PROJECTS.map((p) => {
                    const isSelected = projectName === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProjectName(p)}
                        className={`px-2 py-1 rounded-[6px] text-[11px] font-medium border transition-colors ${
                          isSelected
                            ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] border-transparent'
                            : 'bg-[#f9fafb] dark:bg-[#1a1a1d] text-[#4b5563] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a] hover:border-[#9ca3af] dark:hover:border-[#52525b]'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setStep(2)}
                className="py-1.5 px-3 border border-[#e5e7eb] dark:border-[#27272a] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[8px] text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex-1 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] disabled:opacity-50 text-white dark:text-[#111827] rounded-[8px] text-xs font-semibold shadow-subtle transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving...' : workspace ? 'Finish Tour' : 'Open Leaf'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
