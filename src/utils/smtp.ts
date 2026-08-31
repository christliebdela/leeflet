import { invoke } from '@tauri-apps/api/core';
import { Workspace, RoleId } from '../types';

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
  invitedBy?: string;
  createdAt: number;
  token: string;
}

export const generateInvitePayload = (
  workspace: Workspace,
  role: RoleId,
  invitedEmail?: string
): InvitePayload => {
  const supabaseUrl = localStorage.getItem(`leeflet_supabase_url_${workspace.id}`) || undefined;
  const supabaseAnonKey = localStorage.getItem(`leeflet_supabase_anon_key_${workspace.id}`) || undefined;

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
    invitedBy: profileName,
    createdAt: Date.now(),
    token: Math.random().toString(36).substring(2, 10).toUpperCase(),
  };
};

export const generateInviteDeepLink = (
  workspace: Workspace,
  role: RoleId,
  invitedEmail?: string
): string => {
  const payload = generateInvitePayload(workspace, role, invitedEmail);
  const jsonStr = JSON.stringify(payload);
  const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
  return `leeflet://join#data=${base64Data}`;
};

export const generateInviteCode = (
  workspace: Workspace,
  role: RoleId,
  invitedEmail?: string
): string => {
  const payload = generateInvitePayload(workspace, role, invitedEmail);
  const jsonStr = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(jsonStr)));
};

export const generateInviteHtmlTemplate = (params: {
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  role: RoleId;
  roleDescription: string;
  inviteLink: string;
  inviteCode: string;
}): string => {
  const { workspaceName, inviterName, inviterEmail, role, roleDescription, inviteLink, inviteCode } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to collaborate on ${workspaceName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0c0e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #141417; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #222226; background: linear-gradient(180deg, #18181c 0%, #141417 100%);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; padding: 6px 10px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: 6px; color: #10b981; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
                      WORKSPACE INVITATION
                    </div>
                    <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                      Join ${workspaceName} on Leeflet
                    </h1>
                    <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
                      <strong>${inviterName}</strong> (${inviterEmail}) has invited you to join their local-first workspace.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Role Details Card -->
          <tr>
            <td style="padding: 24px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a1e; border: 1px solid #2a2a30; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                      ASSIGNED ROLE
                    </div>
                    <div style="font-size: 15px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">
                      ${role}
                    </div>
                    <div style="font-size: 12px; color: #a1a1aa; line-height: 1.4;">
                      ${roleDescription}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Main Call to Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" style="display: block; width: 100%; box-sizing: border-box; background-color: #ffffff; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 700; padding: 13px 24px; border-radius: 7px; text-align: center; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);">
                      Accept Invite & Open in Leeflet &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Manual Join Code -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #222226; padding-top: 20px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
                      MANUAL JOIN INSTRUCTIONS
                    </div>
                    <div style="font-size: 12px; color: #9ca3af; line-height: 1.5; margin-bottom: 10px;">
                      If the button above does not open Leeflet automatically:
                      <ol style="margin: 6px 0 10px 0; padding-left: 20px;">
                        <li>Open the <strong>Leeflet</strong> desktop application.</li>
                        <li>Click the workspace switcher in the top left &rarr; <strong>Join Shared Workspace...</strong></li>
                        <li>Paste the Invite Code below:</li>
                      </ol>
                    </div>
                    <div style="background-color: #0c0d0f; border: 1px solid #27272a; border-radius: 6px; padding: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #34d399; word-break: break-all; user-select: all;">
                      ${inviteCode}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background-color: #0e0e11; border-top: 1px solid #222226; font-size: 11px; color: #52525b; text-align: center;">
              Leeflet &bull; Local-First Workspace for Engineering Teams
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

  const inviteLink = generateInviteDeepLink(workspace, role, recipientEmail);
  const inviteCode = generateInviteCode(workspace, role, recipientEmail);

  const htmlBody = generateInviteHtmlTemplate({
    workspaceName: workspace.name,
    inviterName,
    inviterEmail,
    role,
    roleDescription,
    inviteLink,
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
      subject: `Invitation: Join ${workspace.name} on Leeflet as ${role}`,
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
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0c0e; color: #ffffff; padding: 30px;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 24px;">
    <div style="color: #10b981; font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">
      ✓ CONNECTION VERIFIED
    </div>
    <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #ffffff;">SMTP Connection Successful!</h2>
    <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
      Your custom SMTP mail server (<strong>${config.host}:${config.port}</strong>) is correctly configured and ready to deliver Leeflet team invitations.
    </p>
    <div style="font-size: 11px; color: #71717a; margin-top: 20px; border-top: 1px solid #27272a; padding-top: 12px;">
      Dispatched via Leeflet Desktop Client
    </div>
  </div>
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
