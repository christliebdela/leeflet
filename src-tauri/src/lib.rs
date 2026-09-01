use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

#[tauri::command]
fn get_default_workspace_path() -> Result<String, String> {
    if let Some(user_dirs) = dirs::document_dir().or_else(dirs::home_dir) {
        let leaf_dir = user_dirs.join("leeflet");
        Ok(leaf_dir.to_string_lossy().to_string())
    } else {
        Ok("C:\\leeflet".to_string())
    }
}

#[tauri::command]
fn open_in_file_manager(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        if !std::path::Path::new(&path).exists() {
            let _ = std::fs::create_dir_all(&path);
        }
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        opener::open(&path).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn write_file_to_path(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_file_from_path(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[derive(serde::Deserialize)]
pub struct SmtpConfig {
    pub host: String,
    pub port: u16,
    pub encryption: String, // "tls", "ssl", or "none"
    pub username: String,
    pub password: String,
    pub from_email: String,
    pub from_name: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct EmailPayload {
    pub to_email: String,
    pub to_name: Option<String>,
    pub subject: String,
    pub html_body: String,
}

#[tauri::command]
fn send_smtp_email(config: SmtpConfig, payload: EmailPayload) -> Result<(), String> {
    use lettre::message::{header::ContentType, Message, SinglePart};
    use lettre::transport::smtp::authentication::Credentials;
    use lettre::{SmtpTransport, Transport};

    let from_formatted = match &config.from_name {
        Some(name) if !name.trim().is_empty() => format!("{} <{}>", name.trim(), config.from_email.trim()),
        _ => config.from_email.trim().to_string(),
    };

    let to_formatted = match &payload.to_name {
        Some(name) if !name.trim().is_empty() => format!("{} <{}>", name.trim(), payload.to_email.trim()),
        _ => payload.to_email.trim().to_string(),
    };

    let email = Message::builder()
        .from(from_formatted.parse().map_err(|e| format!("Invalid 'from' address ({}): {}", from_formatted, e))?)
        .to(to_formatted.parse().map_err(|e| format!("Invalid 'to' address ({}): {}", to_formatted, e))?)
        .subject(payload.subject)
        .singlepart(
            SinglePart::builder()
                .header(ContentType::TEXT_HTML)
                .body(payload.html_body),
        )
        .map_err(|e| format!("Failed to create email message: {}", e))?;

    let creds = Credentials::new(config.username.trim().to_string(), config.password.trim().to_string());
    let host = config.host.trim();

    let mailer = if config.port == 465 || config.encryption == "ssl" {
        SmtpTransport::relay(host)
            .map_err(|e| format!("Could not connect to SMTP host {}: {}", host, e))?
            .port(config.port)
            .credentials(creds)
            .build()
    } else if config.encryption == "none" {
        SmtpTransport::builder_dangerous(host)
            .port(config.port)
            .credentials(creds)
            .build()
    } else {
        // Standard TLS / STARTTLS (587, 2525)
        SmtpTransport::starttls_relay(host)
            .map_err(|e| format!("Could not connect via STARTTLS to {}: {}", host, e))?
            .port(config.port)
            .credentials(creds)
            .build()
    };

    mailer.send(&email).map_err(|e| format!("SMTP delivery failed: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("quick_capture") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            if let Ok(shortcut) = "Alt+L".parse::<Shortcut>() {
                let _ = app.global_shortcut().register(shortcut);
            }

            let open_item = MenuItem::with_id(app, "open", "Open leeflet", true, None::<String>)?;
            let capture_item = MenuItem::with_id(app, "capture", "Quick Capture (Alt+L)", true, None::<String>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit leeflet", true, None::<String>)?;
            let menu = Menu::with_items(app, &[&open_item, &capture_item, &quit_item])?;

            if let Some(icon) = app.default_window_icon() {
                let _tray = TrayIconBuilder::new()
                    .icon(icon.clone())
                    .tooltip("leeflet")
                    .menu(&menu)
                    .show_menu_on_left_click(false)
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "open" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                        "capture" => {
                            if let Some(window) = app.get_webview_window("quick_capture") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.unminimize();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                    })
                    .build(app)?;
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_default_workspace_path,
            open_in_file_manager,
            write_file_to_path,
            read_file_from_path,
            send_smtp_email
        ])
        .run(tauri::generate_context!())
        .expect("error while running leeflet application");
}
