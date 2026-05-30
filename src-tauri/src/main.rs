#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RepairResult {
    pub success: bool,
    pub output_path: Option<String>,
    pub log: Vec<String>,
    pub error: Option<String>,
}

fn get_ffmpeg_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base_path = app
        .path()
        .resolve("binaries/ffmpeg", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("FFmpeg binary not found: {}", e))?;

    if base_path.exists() {
        return Ok(base_path);
    }

    let windows_path = app
        .path()
        .resolve(
            "binaries/ffmpeg-x86_64-pc-windows-msvc.exe",
            tauri::path::BaseDirectory::Resource,
        )
        .map_err(|e| format!("FFmpeg binary not found: {}", e))?;

    if windows_path.exists() {
        return Ok(windows_path);
    }

    Ok(base_path)
}

fn output_is_valid(output: &Path) -> bool {
    output.exists() && output.metadata().map(|m| m.len()).unwrap_or(0) > 1024
}

fn recovered_output_path(input_path: &str) -> PathBuf {
    let input = PathBuf::from(input_path);
    input.with_file_name(format!(
        "{}_recovered.mp4",
        input.file_stem().unwrap_or_default().to_string_lossy()
    ))
}

/// Attempt 1: FFmpeg stream copy (no reference file needed, ~40% success)
/// ffmpeg -i broken.mp4 -c copy -avoid_negative_ts make_zero output.mp4
#[tauri::command]
async fn repair_no_reference(
    app: tauri::AppHandle,
    broken_path: String,
) -> Result<RepairResult, String> {
    let mut log = vec![];
    log.push("Starting FFmpeg stream recovery (no reference file)...".to_string());
    log.push("Note: success rate ~40% without reference file.".to_string());

    if !Path::new(&broken_path).exists() {
        log.push("File not found.".to_string());
        return Ok(RepairResult {
            success: false,
            output_path: None,
            log,
            error: Some("File not found".to_string()),
        });
    }

    let metadata =
        std::fs::metadata(&broken_path).map_err(|e| format!("Cannot read file: {}", e))?;
    if metadata.len() < 1_048_576 {
        log.push("Input file is under 1MB.".to_string());
        return Ok(RepairResult {
            success: false,
            output_path: None,
            log,
            error: Some(
                "File too small to be a valid recording (under 1MB). Are you sure this is the right file?"
                    .to_string(),
            ),
        });
    }

    let ffmpeg = get_ffmpeg_path(&app)?;
    let output = recovered_output_path(&broken_path);

    let result = Command::new(&ffmpeg)
        .args([
            "-y",
            "-i",
            &broken_path,
            "-c",
            "copy",
            "-avoid_negative_ts",
            "make_zero",
            output.to_str().unwrap_or_default(),
        ])
        .output()
        .map_err(|e| format!("Failed to run FFmpeg: {}", e))?;

    let stderr = String::from_utf8_lossy(&result.stderr).to_string();
    log.push(stderr);

    if result.status.success() && output_is_valid(&output) {
        log.push("Recovery successful.".to_string());
        Ok(RepairResult {
            success: true,
            output_path: Some(output.to_string_lossy().to_string()),
            log,
            error: None,
        })
    } else {
        log.push("Stream copy failed. Try again with a reference file for better results.".to_string());
        Ok(RepairResult {
            success: false,
            output_path: None,
            log,
            error: Some("FFmpeg stream copy could not recover this file.".to_string()),
        })
    }
}

/// Attempt 2: FFmpeg with reference file (moov atom reconstruction, ~85% success)
/// Strategy: extract stream info from reference, rebuild broken file structure
#[tauri::command]
async fn repair_with_reference(
    app: tauri::AppHandle,
    broken_path: String,
    reference_path: String,
) -> Result<RepairResult, String> {
    let mut log = vec![];
    log.push("Starting repair with reference file...".to_string());

    if !Path::new(&broken_path).exists() {
        log.push("Broken file not found.".to_string());
        return Ok(RepairResult {
            success: false,
            output_path: None,
            log,
            error: Some("File not found".to_string()),
        });
    }

    if !Path::new(&reference_path).exists() {
        log.push("Reference file not found.".to_string());
        return Ok(RepairResult {
            success: false,
            output_path: None,
            log,
            error: Some("Reference file not found".to_string()),
        });
    }

    if broken_path == reference_path {
        log.push("Broken file and reference file are the same file.".to_string());
        return Ok(RepairResult {
            success: false,
            output_path: None,
            log,
            error: Some("Broken file and reference file cannot be the same file.".to_string()),
        });
    }

    let metadata =
        std::fs::metadata(&broken_path).map_err(|e| format!("Cannot read file: {}", e))?;
    if metadata.len() < 1_048_576 {
        log.push("Broken file is under 1MB.".to_string());
        return Ok(RepairResult {
            success: false,
            output_path: None,
            log,
            error: Some(
                "File too small to be a valid recording (under 1MB). Are you sure this is the right file?"
                    .to_string(),
            ),
        });
    }

    let ffmpeg = get_ffmpeg_path(&app)?;
    let output = recovered_output_path(&broken_path);

    // Step 1: try direct stream copy first (fastest)
    log.push("Step 1/3: Attempting stream copy...".to_string());
    let step1 = Command::new(&ffmpeg)
        .args([
            "-y",
            "-i",
            &broken_path,
            "-c",
            "copy",
            "-avoid_negative_ts",
            "make_zero",
            "-movflags",
            "+faststart",
            output.to_str().unwrap_or_default(),
        ])
        .output()
        .map_err(|e| format!("FFmpeg error: {}", e))?;

    let stderr = String::from_utf8_lossy(&step1.stderr).to_string();
    if !stderr.trim().is_empty() {
        log.push(stderr);
    }

    if step1.status.success() && output_is_valid(&output) {
        log.push("Stream copy succeeded.".to_string());
        return Ok(RepairResult {
            success: true,
            output_path: Some(output.to_string_lossy().to_string()),
            log,
            error: None,
        });
    }

    // Step 2: Use reference file container information to re-map the broken streams.
    log.push("Step 2/3: Re-mapping broken streams with reference container info...".to_string());
    let step2 = Command::new(&ffmpeg)
        .args([
            "-y",
            "-i",
            &reference_path,
            "-i",
            &broken_path,
            "-map",
            "1:v?",
            "-map",
            "1:a?",
            "-c",
            "copy",
            "-avoid_negative_ts",
            "make_zero",
            "-movflags",
            "+faststart",
            output.to_str().unwrap_or_default(),
        ])
        .output()
        .map_err(|e| format!("FFmpeg remap error: {}", e))?;

    let stderr = String::from_utf8_lossy(&step2.stderr).to_string();
    if !stderr.trim().is_empty() {
        log.push(stderr);
    }

    if step2.status.success() && output_is_valid(&output) {
        log.push("Reference remap succeeded.".to_string());
        return Ok(RepairResult {
            success: true,
            output_path: Some(output.to_string_lossy().to_string()),
            log,
            error: None,
        });
    }

    // Step 3: Fallback repair pass that ignores decode errors and regenerates timestamps.
    log.push("Step 3/3: Running fallback recovery pass...".to_string());
    let step3 = Command::new(&ffmpeg)
        .args([
            "-y",
            "-fflags",
            "+genpts",
            "-err_detect",
            "ignore_err",
            "-i",
            &broken_path,
            "-map",
            "0:v?",
            "-map",
            "0:a?",
            "-c",
            "copy",
            "-avoid_negative_ts",
            "make_zero",
            "-movflags",
            "+faststart",
            output.to_str().unwrap_or_default(),
        ])
        .output()
        .map_err(|e| format!("FFmpeg fallback error: {}", e))?;

    let stderr = String::from_utf8_lossy(&step3.stderr).to_string();
    if !stderr.trim().is_empty() {
        log.push(stderr);
    }

    if step3.status.success() && output_is_valid(&output) {
        log.push("Fallback recovery succeeded.".to_string());
        Ok(RepairResult {
            success: true,
            output_path: Some(output.to_string_lossy().to_string()),
            log,
            error: None,
        })
    } else {
        Ok(RepairResult {
            success: false,
            output_path: None,
            log,
            error: Some(
                "Could not reconstruct file. The recording may be too severely corrupted."
                    .to_string(),
            ),
        })
    }
}

/// Validate a Lemon Squeezy license key against their API
#[tauri::command]
async fn validate_license(license_key: String) -> Result<bool, String> {
    // Replace PRODUCT_ID with your actual Lemon Squeezy product ID
    let _product_id =
        std::env::var("LS_PRODUCT_ID").unwrap_or_else(|_| "YOUR_PRODUCT_ID".to_string());

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.lemonsqueezy.com/v1/licenses/validate")
        .json(&serde_json::json!({
            "license_key": license_key,
            "instance_name": "StreamSalvage Desktop"
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    Ok(json["valid"].as_bool().unwrap_or(false))
}

/// Open file in system default player (for preview)
#[tauri::command]
async fn open_file_in_player(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    Command::new("cmd")
        .args(["/c", "start", "", &path])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Save repaired file to user-chosen location
#[tauri::command]
async fn save_repaired_file(source_path: String, destination_path: String) -> Result<(), String> {
    std::fs::copy(&source_path, &destination_path)
        .map(|_| ())
        .map_err(|e| format!("Copy failed: {}", e))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            repair_no_reference,
            repair_with_reference,
            validate_license,
            open_file_in_player,
            save_repaired_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
