import { invoke } from '@tauri-apps/api/core';
import { Workspace, RoleId } from '../types';
import { getCloudCredentials } from '../services/cloudSync';

export interface SmtpConfig {
  host: string;
  port: number;
  encryption: 'tls' | 'ssl' | 'none';
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

const SMTP_STORAGE_KEY = 'leeflet_custom_smtp_config';

export const getStoredSmtpConfig = (): SmtpConfig | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SMTP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.host && parsed.port && parsed.fromEmail) {
        return parsed;
      }
    }
  } catch {}
  return null;
};

export const saveStoredSmtpConfig = (config: SmtpConfig) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SMTP_STORAGE_KEY, JSON.stringify(config));
};

export const isSmtpConfigured = (): boolean => {
  const config = getStoredSmtpConfig();
  return Boolean(
    config &&
    config.host?.trim() &&
    config.port &&
    config.username?.trim() &&
    config.password?.trim() &&
    config.fromEmail?.trim()
  );
};

export interface InvitePayload {
  v: number;
  workspaceId: string;
  workspaceName: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  role: RoleId;
  invitedEmail?: string;
  invitedName?: string;
  invitedBy?: string;
  createdAt: number;
  token: string;
}

export const generateInvitePayload = (
  workspace: Workspace,
  role: RoleId,
  invitedEmail?: string,
  invitedName?: string
): InvitePayload => {
  const creds = getCloudCredentials(workspace.id);
  const supabaseUrl = creds?.url;
  const supabaseAnonKey = creds?.anonKey;

  let profileName = 'Workspace Admin';
  try {
    const pRaw = localStorage.getItem('leeflet_user_profile_data') || localStorage.getItem('leaf_user_profile_data');
    if (pRaw) {
      const p = JSON.parse(pRaw);
      if (p.fullName) profileName = p.fullName;
    }
  } catch {}

  return {
    v: 1,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    supabaseUrl,
    supabaseAnonKey,
    role,
    invitedEmail,
    invitedName,
    invitedBy: profileName,
    createdAt: Date.now(),
    token: Math.random().toString(36).substring(2, 10).toUpperCase(),
  };
};

export const getWebOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    if (!origin.includes('tauri://') && !origin.includes('localhost:1420')) {
      return origin;
    }
  }
  return 'https://leeflet-cd.vercel.app';
};

export const generateInviteDeepLink = (
  workspace: Workspace,
  role: RoleId,
  invitedEmail?: string,
  invitedName?: string
): string => {
  const payload = generateInvitePayload(workspace, role, invitedEmail, invitedName);
  const jsonStr = JSON.stringify(payload);
  const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
  return `leeflet://join#data=${base64Data}`;
};

export const generateInviteWebLink = (
  workspace: Workspace,
  role: RoleId,
  invitedEmail?: string,
  invitedName?: string
): string => {
  const payload = generateInvitePayload(workspace, role, invitedEmail, invitedName);
  const jsonStr = JSON.stringify(payload);
  const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
  const origin = getWebOrigin();
  return `${origin}/#join=${base64Data}`;
};

export const generateInviteCode = (
  workspace: Workspace,
  role: RoleId,
  invitedEmail?: string,
  invitedName?: string
): string => {
  const payload = generateInvitePayload(workspace, role, invitedEmail, invitedName);
  const jsonStr = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(jsonStr)));
};

export const generateInviteHtmlTemplate = (params: {
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  role: RoleId;
  roleDescription?: string;
  inviteLink: string;
  desktopInviteLink?: string;
  inviteCode?: string;
}): string => {
  const { workspaceName, inviterName, role, desktopInviteLink, inviteCode, inviteLink } = params;
  const directJoinPayload = inviteCode || (desktopInviteLink ? desktopInviteLink.replace('leeflet://join#data=', '') : inviteLink);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to join ${workspaceName} on Leeflet</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 24px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 8px;">
                          <img src="https://leeflet-cd.vercel.app/leaf_logo.png" width="20" height="20" alt="leeflet logo" style="display: block; width: 20px; height: 20px; object-fit: contain;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-family: Georgia, serif; font-style: italic; font-size: 19px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">
                            leeflet
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 3px 8px; background-color: #f1f5f9; border-radius: 4px; font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;">
                      ${role}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <h1 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.4; letter-spacing: -0.01em;">
                ${inviterName} invited you to join <strong>${workspaceName}</strong>
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 13.5px; color: #475569; line-height: 1.6;">
                You've been invited to collaborate with <strong>${role}</strong> permissions. Copy the invite code below and paste it into the Leeflet desktop application to connect.
              </p>

              <!-- Team Invite Code Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 14px 16px; background-color: #0f172a; border-radius: 8px;">
                    <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 6px;">
                      Team Invite Code
                    </div>
                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11.5px; color: #f8fafc; word-break: break-all; line-height: 1.5; user-select: all; -webkit-user-select: all;">
                      ${directJoinPayload}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; font-size: 12.5px; color: #64748b; line-height: 1.55;">
                In the Leeflet sidebar, click the workspace dropdown at the top, select <strong>Join Team Workspace</strong>, and paste your code.
              </p>

              <!-- App Download Link -->
              <div style="border-top: 1px solid #f1f5f9; padding-top: 16px;">
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                  Don't have the desktop client? <a href="https://leeflet-cd.vercel.app" style="color: #0f172a; font-weight: 600; text-decoration: underline;">Download Leeflet for Windows, macOS, or Linux &rarr;</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px; background-color: #fafbfc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 3px 0; font-size: 11.5px; color: #94a3b8;">
                Leeflet &bull; The open-source workspace for developers and teams
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export const sendInviteEmail = async (
  recipientEmail: string,
  recipientName: string,
  workspace: Workspace,
  role: RoleId,
  roleDescription: string
): Promise<void> => {
  const config = getStoredSmtpConfig();
  if (!config) {
    throw new Error('SMTP is not configured. Please configure your custom SMTP credentials in Settings.');
  }

  let inviterName = 'Workspace Admin';
  let inviterEmail = config.fromEmail;
  try {
    const pRaw = localStorage.getItem('leeflet_user_profile_data') || localStorage.getItem('leaf_user_profile_data');
    if (pRaw) {
      const p = JSON.parse(pRaw);
      if (p.fullName) inviterName = p.fullName;
      if (p.email) inviterEmail = p.email;
    }
  } catch {}

  const webInviteLink = generateInviteWebLink(workspace, role, recipientEmail);
  const desktopInviteLink = generateInviteDeepLink(workspace, role, recipientEmail);
  const inviteCode = generateInviteCode(workspace, role, recipientEmail);

  const htmlBody = generateInviteHtmlTemplate({
    workspaceName: workspace.name,
    inviterName,
    inviterEmail,
    role,
    roleDescription,
    inviteLink: webInviteLink,
    desktopInviteLink,
    inviteCode,
  });

  await invoke('send_smtp_email', {
    config: {
      host: config.host,
      port: Number(config.port),
      encryption: config.encryption || 'tls',
      username: config.username,
      password: config.password,
      from_email: config.fromEmail,
      from_name: config.fromName || inviterName,
    },
    payload: {
      to_email: recipientEmail.trim(),
      to_name: recipientName.trim() || undefined,
      subject: `${inviterName} invited you to join ${workspace.name} on Leeflet`,
      html_body: htmlBody,
    },
  });
};

export const sendTestEmail = async (
  targetEmail: string,
  config: SmtpConfig
): Promise<void> => {
  const testHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SMTP Connection Verified</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 460px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          <tr>
            <td style="padding: 32px;">
              <div style="font-family: Georgia, serif; font-style: italic; font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 20px;">
                leeflet
              </div>
              <div style="display: inline-block; padding: 4px 9px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px;">
                ✓ SMTP Verified
              </div>
              <h1 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #0f172a;">
                Connection successful
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
                Your custom SMTP mail server (<strong>${config.host}:${config.port}</strong>) is verified and ready to deliver Leeflet team invitations.
              </p>
              <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #94a3b8;">
                Dispatched from Leeflet Desktop Client
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await invoke('send_smtp_email', {
    config: {
      host: config.host,
      port: Number(config.port),
      encryption: config.encryption || 'tls',
      username: config.username,
      password: config.password,
      from_email: config.fromEmail,
      from_name: config.fromName || 'Leeflet System',
    },
    payload: {
      to_email: targetEmail.trim(),
      to_name: undefined,
      subject: 'Leeflet: SMTP Configuration Test Successful',
      html_body: testHtml,
    },
  });
};
