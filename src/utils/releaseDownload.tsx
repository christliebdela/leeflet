import { useState, useEffect } from 'react';

export type UserOS = 'windows' | 'mac' | 'linux';

export const GITHUB_REPO = 'https://github.com/christliebdela/leeflet';
export const GITHUB_RELEASES = `${GITHUB_REPO}/releases`;
export const GITHUB_API_LATEST = 'https://api.github.com/repos/christliebdela/leeflet/releases/latest';

export function detectUserOS(): UserOS {
  if (typeof window === 'undefined' || !window.navigator) return 'windows';
  
  const userAgent = (navigator.userAgent || '').toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();

  if (platform.includes('mac') || userAgent.includes('macintosh') || userAgent.includes('mac os')) {
    return 'mac';
  }
  if (platform.includes('linux') || userAgent.includes('linux') || userAgent.includes('x11')) {
    return 'linux';
  }
  return 'windows';
}

export function getOSLabel(os: UserOS): string {
  switch (os) {
    case 'mac':
      return 'macOS';
    case 'linux':
      return 'Linux';
    case 'windows':
    default:
      return 'Windows';
  }
}

export function getOSExtension(os: UserOS): string {
  switch (os) {
    case 'mac':
      return '.dmg';
    case 'linux':
      return '.AppImage';
    case 'windows':
    default:
      return '.exe';
  }
}

export interface ReleaseAssetUrls {
  windows: string;
  mac: string;
  linux: string;
}

export interface UseReleaseDownloadResult {
  os: UserOS;
  osName: string;
  osExtension: string;
  downloadUrl: string;
  allDownloads: ReleaseAssetUrls;
  version: string;
  releaseUrl: string;
  isLoading: boolean;
}

const FALLBACK_VERSION = 'v0.1.0';

const DEFAULT_DOWNLOADS: ReleaseAssetUrls = {
  windows: `${GITHUB_RELEASES}/download/${FALLBACK_VERSION}/leeflet_0.1.0_x64-setup.exe`,
  mac: `${GITHUB_RELEASES}/download/${FALLBACK_VERSION}/leeflet_0.1.0_aarch64.dmg`,
  linux: `${GITHUB_RELEASES}/download/${FALLBACK_VERSION}/leeflet_0.1.0_amd64.AppImage`,
};

export function useReleaseDownload(): UseReleaseDownloadResult {
  const [os, setOS] = useState<UserOS>('windows');
  const [version, setVersion] = useState<string>('v0.1.0');
  const [downloads, setDownloads] = useState<ReleaseAssetUrls>(DEFAULT_DOWNLOADS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const detected = detectUserOS();
    setOS(detected);

    const isArmMac = typeof window !== 'undefined' && 
      (navigator.userAgent.includes('Macintosh') || navigator.platform.includes('Mac')) &&
      (navigator.userAgent.includes('ARM') || (navigator as any).userAgentData?.architecture === 'arm');

    // Try to fetch latest release assets from GitHub API or session cache (with 5-minute TTL)
    const cacheKey = 'leeflet_latest_release_assets_v2';
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const age = Date.now() - (parsed.timestamp || 0);
        // If cache is less than 5 minutes old and contains actual asset URLs
        if (age < 5 * 60 * 1000 && parsed.downloads && (parsed.downloads.windows !== `${GITHUB_RELEASES}/latest` || parsed.downloads.mac !== `${GITHUB_RELEASES}/latest`)) {
          setVersion(parsed.version || 'v0.1.0');
          setDownloads(parsed.downloads);
          setIsLoading(false);
          return;
        }
      } catch {
        // invalid cache, continue fetch
      }
    }

    fetch(GITHUB_API_LATEST)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const tagName = data.tag_name || 'v0.1.0';
        setVersion(tagName);

        const assets: Array<{ name: string; browser_download_url: string }> = data.assets || [];

        // 1. Windows: Prefer setup .exe or .msi
        const winAsset = assets.find(
          (a) => a.name.endsWith('.exe') || a.name.endsWith('.msi')
        );

        // 2. macOS: Match architecture (aarch64 for Apple Silicon, x64 for Intel) or any .dmg
        let macAsset = isArmMac
          ? assets.find((a) => a.name.includes('aarch64') && a.name.endsWith('.dmg'))
          : assets.find((a) => a.name.includes('x64') && a.name.endsWith('.dmg'));
        
        if (!macAsset) {
          macAsset = assets.find(
            (a) => a.name.endsWith('.dmg') || a.name.endsWith('.app.tar.gz')
          );
        }

        // 3. Linux: Prefer AppImage or deb
        const linuxAsset = assets.find(
          (a) => a.name.endsWith('.AppImage') || a.name.endsWith('.deb') || a.name.endsWith('.rpm')
        );

        const resolvedDownloads: ReleaseAssetUrls = {
          windows: winAsset ? winAsset.browser_download_url : `${GITHUB_RELEASES}/latest`,
          mac: macAsset ? macAsset.browser_download_url : `${GITHUB_RELEASES}/latest`,
          linux: linuxAsset ? linuxAsset.browser_download_url : `${GITHUB_RELEASES}/latest`,
        };

        setDownloads(resolvedDownloads);

        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            version: tagName,
            downloads: resolvedDownloads,
            timestamp: Date.now(),
          })
        );
      })
      .catch(() => {
        // Fallback gracefully
        setDownloads(DEFAULT_DOWNLOADS);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return {
    os,
    osName: getOSLabel(os),
    osExtension: getOSExtension(os),
    downloadUrl: downloads[os] || `${GITHUB_RELEASES}/latest`,
    allDownloads: downloads,
    version,
    releaseUrl: `${GITHUB_RELEASES}/latest`,
    isLoading,
  };
}

export function WindowsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.951" />
    </svg>
  );
}

export function AppleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-2.02.6-2.66 1.35-.56.65-1.06 1.71-.93 2.74 1.01.08 2.06-.52 2.67-1.22z" />
    </svg>
  );
}

export function LinuxIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.003 2.003c-2.43 0-4.394 2.122-4.394 4.743 0 .445.064.87.18 1.272-1.714.654-2.91 2.302-2.91 4.237 0 1.258.508 2.404 1.34 3.257-.156.63-.238 1.29-.238 1.968 0 .546.216 1.07.601 1.455.385.385.909.601 1.455.601h7.932c.546 0 1.07-.216 1.455-.601.385-.385.601-.909.601-1.455 0-.678-.082-1.338-.238-1.968.832-.853 1.34-1.999 1.34-3.257 0-1.935-1.196-3.583-2.91-4.237.116-.402.18-.827.18-1.272 0-2.621-1.964-4.743-4.394-4.743zm-1.802 4.417a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zm3.604 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zm-1.802 1.875c.994 0 1.8.403 1.8.9s-.806.9-1.8.9-1.8-.403-1.8-.9.806-.9 1.8-.9z" />
    </svg>
  );
}

export function OSIcon({ os, className = 'w-4 h-4' }: { os: UserOS; className?: string }) {
  switch (os) {
    case 'mac':
      return <AppleIcon className={className} />;
    case 'linux':
      return <LinuxIcon className={className} />;
    case 'windows':
    default:
      return <WindowsIcon className={className} />;
  }
}
