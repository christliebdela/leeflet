import React, { useState, useEffect } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { Folder, X, ArrowRight, Check, Zap, HardDrive, Sparkles, Dices } from 'lucide-react';
import { MASCOT_PRESETS, getDiceBearSvgUrl, resolveAvatarUrl } from '../utils/avatars';
import { getStoredTeamMembers, saveStoredTeamMembers } from '../utils/team';

const SUGGESTED_PROJECTS = [
  'Personal',
  'Side Projects',
  'Work',
  'Research',
  'Learning',
];

export const OnboardingModal: React.FC = () => {
  const { workspace, isOnboardingOpen, setOnboardingOpen, createWorkspace, createProject } = useLeafStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('Workspace Admin');
  const [selectedMascotId, setSelectedMascotId] = useState('bot-spark');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Robots' | 'Clay' | 'Critters' | 'Fun Emoji'>('All');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const [workspaceName, setWorkspaceName] = useState('My Workspace');
  const [workspaceLocation, setWorkspaceLocation] = useState('C:\\leeflet');
  const [projectName, setProjectName] = useState('My Project');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name || 'My Workspace');
      setWorkspaceLocation(workspace.path || 'C:\\leeflet');
    }
  }, [workspace, isOnboardingOpen]);

  // Load existing profile if any
  useEffect(() => {
    try {
      const saved = localStorage.getItem('leeflet_user_profile_data') || localStorage.getItem('leaf_user_profile_data');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.fullName) setFullName(p.fullName);
        if (p.title) setJobTitle(p.title);
        if (p.avatarMascot) setSelectedMascotId(p.avatarMascot);
        if (p.avatarUrl) setCustomAvatarUrl(p.avatarUrl);
      }
    } catch {}
  }, [isOnboardingOpen]);

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

  const handleRandomizeMascot = () => {
    const randomPreset = MASCOT_PRESETS[Math.floor(Math.random() * MASCOT_PRESETS.length)];
    const randomSeed = `${randomPreset.seed}-${Math.floor(Math.random() * 1000)}`;
    const url = getDiceBearSvgUrl(randomPreset.style, randomSeed);
    setSelectedMascotId(randomPreset.id);
    setCustomAvatarUrl(url);
  };

  const handleSaveProfile = () => {
    try {
      const activeUrl = customAvatarUrl || resolveAvatarUrl(selectedMascotId, fullName || 'owner');
      const profileData = {
        fullName: fullName.trim(),
        username: (fullName.trim() || 'user').toLowerCase().replace(/\s+/g, '-'),
        email: '',
        title: jobTitle.trim() || 'Workspace Owner',
        avatarMascot: selectedMascotId,
        avatarUrl: activeUrl,
        statusIcon: 'zap',
        statusText: 'In the zone',
      };
      localStorage.setItem('leeflet_user_profile_data', JSON.stringify(profileData));

      // Sync team members store
      const members = getStoredTeamMembers();
      if (members.length > 0) {
        if (fullName.trim()) members[0].name = fullName.trim();
        members[0].avatarMascot = selectedMascotId;
        members[0].avatarUrl = activeUrl;
        saveStoredTeamMembers(members);
      }

      window.dispatchEvent(new CustomEvent('leeflet-profile-updated', { detail: profileData }));
    } catch {}
  };

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
    handleSaveProfile();
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
      <div className="relative w-full max-w-[420px] bg-white dark:bg-[#141416] rounded-[14px] border border-[#e5e7eb] dark:border-[#27272a] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
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
            <div
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                step >= 4 ? 'bg-[#111827] dark:bg-white' : 'bg-[#e5e7eb] dark:bg-[#27272a]'
              }`}
            />
          </div>

          {workspace && (
            <button
              onClick={() => setOnboardingOpen(false)}
              className="p-1 rounded-[4px] text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] hover:text-[#111827] dark:hover:text-white transition-colors -mr-1 cursor-pointer"
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
                  alt="leeflet"
                  className="w-6 h-6 object-contain invert dark:invert-0"
                />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[#111827] dark:text-[#f4f4f5] tracking-tight flex items-baseline gap-1.5">
                  <span>Welcome to</span>
                  <span className="font-brand text-lg font-normal">leeflet</span>
                </h1>
                <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa]">
                  Local-first desktop workspace
                </p>
              </div>
            </div>

            <p className="text-xs text-[#4b5563] dark:text-[#a1a1aa] leading-relaxed">
              Capture tasks, ideas, and notes instantly with zero friction and total privacy on your computer.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2.5 p-2 rounded-[8px] bg-[#f9fafb] dark:bg-[#1a1a1d] border border-[#f3f4f6] dark:border-[#27272a]">
                <Zap className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                <div className="text-[11.5px] text-[#374151] dark:text-[#d4d4d8] flex items-center justify-between w-full">
                  <span>Quick Capture anywhere</span>
                  <kbd className="px-1 py-0.5 rounded bg-white dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[9px] font-semibold text-[#6b7280] dark:text-[#a1a1aa]">
                    Alt+L
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
                className="w-full py-2 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[8px] text-xs font-semibold shadow-subtle transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Profile & Mascot Setup */}
        {step === 2 && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-150">
            <div>
              <h2 className="text-sm font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
                Profile & Mascot
              </h2>
              <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                Set your display name and choose your workspace mascot avatar.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border border-[#e5e7eb] dark:border-[#323238] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  <img
                    src={customAvatarUrl || resolveAvatarUrl(selectedMascotId, fullName || 'owner')}
                    alt="Mascot Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Name (e.g. Alex Rivera)"
                    className="w-full px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1a1a1d] border border-[#e5e7eb] dark:border-[#27272a] focus:border-[#9ca3af] dark:focus:border-[#52525b] rounded-[6px] text-xs text-[#111827] dark:text-[#f4f4f5] outline-none"
                  />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Role (e.g. Workspace Admin)"
                    className="w-full px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1a1a1d] border border-[#e5e7eb] dark:border-[#27272a] focus:border-[#9ca3af] dark:focus:border-[#52525b] rounded-[6px] text-xs text-[#111827] dark:text-[#f4f4f5] outline-none"
                  />
                </div>
              </div>

              {/* Mascot Selector */}
              <div className="space-y-2 pt-1 border-t border-[#f3f4f6] dark:border-[#27272a]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Choose Mascot</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRandomizeMascot}
                    className="flex items-center gap-1 text-[10.5px] font-medium text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white cursor-pointer"
                  >
                    <Dices className="w-3 h-3" />
                    <span>Roll</span>
                  </button>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
                  {(['All', 'Robots', 'Clay', 'Critters', 'Fun Emoji'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-0.5 rounded-[4px] text-[10.5px] transition-colors shrink-0 cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] font-semibold'
                          : 'text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Mascot Mini Grid */}
                <div className="grid grid-cols-6 gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-0.5">
                  {MASCOT_PRESETS.filter((m) => selectedCategory === 'All' || m.category === selectedCategory).map((m) => {
                    const url = getDiceBearSvgUrl(m.style, m.seed);
                    const isSelected = selectedMascotId === m.id && !customAvatarUrl;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMascotId(m.id);
                          setCustomAvatarUrl('');
                        }}
                        className={`flex flex-col items-center p-1 rounded-[6px] border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#9ca3af] dark:border-[#52525b] bg-[#f4f5f6] dark:bg-[#27272a]'
                            : 'border-[#e5e7eb] dark:border-[#27272a] hover:border-[#d1d5db] dark:hover:border-[#3f3f46] bg-[#f9fafb] dark:bg-[#202024]'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-[4px] overflow-hidden shrink-0">
                          <img src={url} alt={m.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5 truncate max-w-full font-medium">
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setStep(1)}
                className="py-1.5 px-3 border border-[#e5e7eb] dark:border-[#27272a] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[8px] text-xs font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => {
                  handleSaveProfile();
                  setStep(3);
                }}
                className="flex-1 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[8px] text-xs font-semibold shadow-subtle transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Storage Setup */}
        {step === 3 && (
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
                    className="px-2.5 py-1.5 bg-[#f3f4f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[8px] border border-[#e5e7eb] dark:border-[#3f3f46] text-xs font-medium transition-colors shrink-0 cursor-pointer"
                  >
                    Browse
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setStep(2)}
                className="py-1.5 px-3 border border-[#e5e7eb] dark:border-[#27272a] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[8px] text-xs font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[8px] text-xs font-semibold shadow-subtle transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: First Project Setup */}
        {step === 4 && (
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
                        className={`px-2 py-1 rounded-[6px] text-[11px] font-medium border transition-colors cursor-pointer ${
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
                onClick={() => setStep(3)}
                className="py-1.5 px-3 border border-[#e5e7eb] dark:border-[#27272a] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[8px] text-xs font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex-1 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] disabled:opacity-50 text-white dark:text-[#111827] rounded-[8px] text-xs font-semibold shadow-subtle transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer"
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
