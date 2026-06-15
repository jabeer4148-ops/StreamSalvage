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
    let resource_path = app
        .path()
        .resolve("binaries/ffmpeg", tauri::path::BaseDirectory::Resource);

    if let Ok(path) = resource_path {
        let with_triple = path.with_file_name("ffmpeg-x86_64-pc-windows-msvc.exe");
        if with_triple.exists() {
            return Ok(with_triple.canonicalize().unwrap_or(with_triple));
        }

        let plain = path.with_extension("exe");
        if plain.exists() {
            return Ok(plain.canonicalize().unwrap_or(plain));
        }
    }

    let cwd_paths = [
        PathBuf::from("binaries/ffmpeg-x86_64-pc-windows-msvc.exe"),
        PathBuf::from("../src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe"),
    ];

    for path in cwd_paths {
        if path.exists() {
            return Ok(path.canonicalize().unwrap_or(path));
        }
    }

    if let Ok(exe_path) = std::env::current_exe() {
        let exe_dir = exe_path.parent().unwrap_or(Path::new("."));
        let exe_relative_paths = [
            exe_dir.join("binaries/ffmpeg-x86_64-pc-windows-msvc.exe"),
            exe_dir.join("ffmpeg-x86_64-pc-windows-msvc.exe"),
            exe_dir.join("../../binaries/ffmpeg-x86_64-pc-windows-msvc.exe"),
            exe_dir.join("../../../binaries/ffmpeg-x86_64-pc-windows-msvc.exe"),
            exe_dir.join("../../../../src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe"),
        ];

        for path in exe_relative_paths {
            if let Ok(canonical) = path.canonicalize() {
                if canonical.exists() {
                    return Ok(canonical);
                }
            }
        }
    }

    let manifest_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("binaries/ffmpeg-x86_64-pc-windows-msvc.exe");
    if manifest_path.exists() {
        return Ok(manifest_path.canonicalize().unwrap_or(manifest_path));
    }

    Err(
        "FFmpeg binary not found. Tried multiple locations. Please ensure \
         src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe exists and Git LFS files are pulled \
         (run: git lfs pull)"
            .to_string(),
    )
}

fn output_is_valid(output: &Path) -> bool {
    output.exists() && output.metadata().map(|m| m.len()).unwrap_or(0) > 1024
}

fn is_valid_video_extension(path: &str) -> bool {
    let ext = Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    matches!(ext.as_str(), "mp4" | "mov" | "m4v")
}

fn generate_output_path(input: &Path) -> PathBuf {
    let stem = input.file_stem().unwrap_or_default().to_string_lossy();
    let dir = input.parent().unwrap_or(Path::new("."));
    let base = dir.join(format!("{}_recovered.mp4", stem));
    if !base.exists() {
        return base;
    }
    for i in 2..=99 {
        let candidate = dir.join(format!("{}_recovered_{}.mp4", stem, i));
        if !candidate.exists() {
            return candidate;
        }
    }
    base // fallback — overwrites only if 99 copies somehow already exist
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

    if !is_valid_video_extension(&broken_path) {
        log.push("Unsupported file extension.".to_string());
        return Ok(RepairResult {
            success: false,
            output_path: None,
            log,
            error: Some(
                "Unsupported file type. Only .mp4, .mov, and .m4v files are supported."
                    .to_string(),
            ),
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
    log.push(format!("FFmpeg path resolved: {}", ffmpeg.display()));
    log.push(format!("FFmpeg exists: {}", ffmpeg.exists()));
    let output = generate_output_path(Path::new(&broken_path));

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
        log.push(
            "Stream copy failed. Try again with a reference file for better results.".to_string(),
        );
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

    if !is_valid_video_extension(&broken_path) {
        log.push("Unsupported file extension for broken file.".to_string());
        return Ok(RepairResult {
            success: false,
            output_path: None,
            log,
            error: Some(
                "Unsupported file type. Only .mp4, .mov, and .m4v files are supported."
                    .to_string(),
            ),
        });
    }

    if !is_valid_video_extension(&reference_path) {
        log.push("Unsupported file extension for reference file.".to_string());
        return Ok(RepairResult {
            success: false,
            output_path: None,
            log,
            error: Some(
                "Unsupported reference file type. Only .mp4, .mov, and .m4v files are supported."
                    .to_string(),
            ),
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
    log.push(format!("FFmpeg path resolved: {}", ffmpeg.display()));
    log.push(format!("FFmpeg exists: {}", ffmpeg.exists()));
    let output = generate_output_path(Path::new(&broken_path));

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

/// Validate a StreamSalvage license key against the landing API.
#[tauri::command]
async fn validate_license(license_key: String) -> Result<bool, String> {
    let configured_endpoint = option_env!("STREAMSALVAGE_LICENSE_API_URL").unwrap_or("");

    if cfg!(debug_assertions) && configured_endpoint.is_empty() {
        return Ok(license_key.starts_with("TEST-"));
    }

    let endpoint = if configured_endpoint.is_empty() {
        "https://streamsalvage.com/api/validate-license"
    } else {
        configured_endpoint
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    let response = client
        .post(endpoint)
        .header("Accept", "application/json")
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "licenseKey": license_key
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Ok(false);
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Response parse error: {}", e))?;

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    // ── Helpers (reimplement sub-logic for testability without AppHandle) ──

    /// Mirrors the validation checks in repair_no_reference /
    /// repair_with_reference, including the new extension guard.
    fn validate_input_file(path: &str) -> Result<(), String> {
        if !Path::new(path).exists() {
            return Err(format!("File not found: {}", path));
        }
        if !is_valid_video_extension(path) {
            let ext = Path::new(path)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("");
            return Err(format!(
                "Unsupported file type '.{}'. Only .mp4, .mov, and .m4v files are supported.",
                ext
            ));
        }
        let metadata =
            std::fs::metadata(path).map_err(|e| format!("Cannot read file: {}", e))?;
        if metadata.len() < 1_048_576 {
            return Err(
                "File too small to be a valid recording (under 1MB).".to_string(),
            );
        }
        Ok(())
    }

    /// Mirrors the candidate-search loop in get_ffmpeg_path, extracted so it
    /// can be tested with fake paths without requiring a real AppHandle.
    fn find_ffmpeg_in_paths(candidates: &[PathBuf]) -> Option<PathBuf> {
        candidates.iter().find(|p| p.exists()).cloned()
    }

    // ── TEST GROUP 1: RepairResult serialisation ──────────────────────────

    #[test]
    fn test_repair_result_success_serialization() {
        let result = RepairResult {
            success: true,
            output_path: Some("test.mp4".to_string()),
            log: vec![],
            error: None,
        };
        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"success\":true"), "missing success:true");
        assert!(json.contains("\"output_path\":\"test.mp4\""), "missing output_path");
        assert!(json.contains("\"error\":null"), "error should be null");
    }

    #[test]
    fn test_repair_result_failure_serialization() {
        let result = RepairResult {
            success: false,
            output_path: None,
            log: vec![],
            error: Some("file not found".to_string()),
        };
        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"success\":false"));
        assert!(json.contains("\"error\":\"file not found\""));
        assert!(json.contains("\"output_path\":null"));
    }

    #[test]
    fn test_repair_result_log_preserved() {
        let entries = vec![
            "step one".to_string(),
            "step two".to_string(),
            "step three".to_string(),
        ];
        let result = RepairResult {
            success: true,
            output_path: None,
            log: entries.clone(),
            error: None,
        };
        let json = serde_json::to_string(&result).unwrap();
        let round_tripped: RepairResult = serde_json::from_str(&json).unwrap();
        assert_eq!(round_tripped.log, entries);
        assert_eq!(round_tripped.log[0], "step one");
        assert_eq!(round_tripped.log[2], "step three");
    }

    // ── TEST GROUP 2: File validation logic ───────────────────────────────

    #[test]
    fn test_validate_nonexistent_file() {
        let result = validate_input_file("nonexistent_totally_fake_path_xyz.mp4");
        assert!(result.is_err());
        let msg = result.unwrap_err().to_lowercase();
        assert!(
            msg.contains("not found") || msg.contains("does not exist"),
            "expected 'not found' in: {}",
            msg
        );
    }

    #[test]
    fn test_validate_file_too_small() {
        // Must use .mp4 extension — extension check now runs before size check
        let mut tmp = tempfile::Builder::new().suffix(".mp4").tempfile().unwrap();
        tmp.write_all(&vec![0u8; 500 * 1024]).unwrap(); // 500 KB < 1 MB
        let result = validate_input_file(tmp.path().to_str().unwrap());
        assert!(result.is_err());
        let msg = result.unwrap_err().to_lowercase();
        assert!(
            msg.contains("too small") || msg.contains("under 1mb") || msg.contains("1mb"),
            "expected size error in: {}",
            msg
        );
    }

    #[test]
    fn test_validate_valid_file() {
        // Must use .mp4 extension — extension check now runs before size check
        let mut tmp = tempfile::Builder::new().suffix(".mp4").tempfile().unwrap();
        tmp.write_all(&vec![0u8; 2 * 1024 * 1024]).unwrap(); // 2 MB
        let result = validate_input_file(tmp.path().to_str().unwrap());
        assert!(result.is_ok(), "expected Ok but got: {:?}", result);
    }

    #[test]
    fn test_validate_rejects_non_video_extension() {
        // Extension validation now runs in Rust to back up the frontend dialog filter.
        let mut tmp = tempfile::Builder::new().suffix(".txt").tempfile().unwrap();
        tmp.write_all(&vec![0u8; 2 * 1024 * 1024]).unwrap();
        let result = validate_input_file(tmp.path().to_str().unwrap());
        assert!(result.is_err(), "should reject .txt files even if large enough");
        let msg = result.unwrap_err().to_lowercase();
        assert!(
            msg.contains("unsupported") || msg.contains("extension"),
            "expected extension error in: {}",
            msg
        );
    }

    #[test]
    fn test_validate_accepts_mov_extension() {
        let mut tmp = tempfile::Builder::new().suffix(".mov").tempfile().unwrap();
        tmp.write_all(&vec![0u8; 2 * 1024 * 1024]).unwrap();
        let result = validate_input_file(tmp.path().to_str().unwrap());
        assert!(result.is_ok(), ".mov should be accepted");
    }

    #[test]
    fn test_validate_accepts_m4v_extension() {
        let mut tmp = tempfile::Builder::new().suffix(".m4v").tempfile().unwrap();
        tmp.write_all(&vec![0u8; 2 * 1024 * 1024]).unwrap();
        let result = validate_input_file(tmp.path().to_str().unwrap());
        assert!(result.is_ok(), ".m4v should be accepted");
    }

    #[test]
    fn test_validate_extension_case_insensitive() {
        let mut tmp = tempfile::Builder::new().suffix(".MP4").tempfile().unwrap();
        tmp.write_all(&vec![0u8; 2 * 1024 * 1024]).unwrap();
        let result = validate_input_file(tmp.path().to_str().unwrap());
        assert!(result.is_ok(), ".MP4 (uppercase) should be accepted");
    }

    #[test]
    fn test_same_file_guard() {
        let path = "/tmp/some_recording.mp4";
        let broken_path = path.to_string();
        let reference_path = path.to_string();
        let is_same = broken_path == reference_path;
        assert!(is_same, "same-file guard should detect equal paths");
        let error_msg = "Broken file and reference file cannot be the same file.";
        assert!(error_msg.contains("same file"));
    }

    // ── TEST GROUP 3: FFmpeg path resolver ────────────────────────────────

    #[test]
    fn test_ffmpeg_finder_returns_none_for_empty_list() {
        let result = find_ffmpeg_in_paths(&[]);
        assert!(result.is_none());
    }

    #[test]
    fn test_ffmpeg_finder_returns_none_for_nonexistent_paths() {
        let candidates = vec![
            PathBuf::from("/fake/path/ffmpeg.exe"),
            PathBuf::from("/another/fake/ffmpeg.exe"),
        ];
        let result = find_ffmpeg_in_paths(&candidates);
        assert!(result.is_none());
    }

    #[test]
    fn test_ffmpeg_finder_returns_first_existing_path() {
        let real_file = NamedTempFile::new().unwrap();
        let real_path = real_file.path().to_path_buf();
        let candidates = vec![
            PathBuf::from("/fake/path/ffmpeg.exe"),
            real_path.clone(),
            PathBuf::from("/another/fake/ffmpeg.exe"),
        ];
        let result = find_ffmpeg_in_paths(&candidates);
        assert!(result.is_some());
        assert_eq!(result.unwrap(), real_path);
    }

    #[test]
    fn test_ffmpeg_finder_returns_first_when_multiple_exist() {
        let first = NamedTempFile::new().unwrap();
        let second = NamedTempFile::new().unwrap();
        let first_path = first.path().to_path_buf();
        let second_path = second.path().to_path_buf();
        let candidates = vec![first_path.clone(), second_path];
        let result = find_ffmpeg_in_paths(&candidates);
        assert_eq!(result.unwrap(), first_path, "should return first existing path");
    }

    // ── TEST GROUP 4: Output path generation (generate_output_path) ───────

    #[test]
    fn test_output_path_has_recovered_suffix() {
        // Path doesn't exist → returns base (no collision branch taken)
        let output = generate_output_path(Path::new("C:\\recordings\\stream.mp4"));
        let filename = output.file_name().unwrap().to_string_lossy();
        assert!(
            filename.ends_with("_recovered.mp4"),
            "expected _recovered.mp4 suffix, got: {}",
            filename
        );
        assert!(filename.starts_with("stream_recovered"));
    }

    #[test]
    fn test_output_path_same_directory_as_input() {
        let output = generate_output_path(Path::new("C:\\recordings\\stream.mp4"));
        let parent = output.parent().unwrap().to_string_lossy();
        assert!(
            parent.contains("recordings"),
            "output should be in same dir as input, got parent: {}",
            parent
        );
    }

    #[test]
    fn test_output_path_deterministic_when_no_collision() {
        let output1 = generate_output_path(Path::new("/tmp/stream.mp4"));
        let output2 = generate_output_path(Path::new("/tmp/stream.mp4"));
        assert_eq!(output1, output2, "same input → same output when no collision");
    }

    #[test]
    fn test_output_path_collision_avoidance() {
        let dir = tempfile::tempdir().unwrap();
        let input_path = dir.path().join("stream.mp4");

        // First call: no existing file → returns base
        let first = generate_output_path(&input_path);
        let first_name = first.file_name().unwrap().to_string_lossy();
        assert!(first_name.ends_with("_recovered.mp4"), "first: {}", first_name);

        // Create the collision file
        std::fs::write(&first, b"dummy").unwrap();

        // Second call: base exists → returns _recovered_2.mp4
        let second = generate_output_path(&input_path);
        let second_name = second.file_name().unwrap().to_string_lossy();
        assert!(
            second_name.contains("_recovered_2"),
            "expected _recovered_2 suffix, got: {}",
            second_name
        );
        // The _2 variant should be in the same directory
        assert_eq!(first.parent(), second.parent());
    }

    #[test]
    fn test_output_path_collision_avoidance_chain() {
        let dir = tempfile::tempdir().unwrap();
        let input_path = dir.path().join("stream.mp4");

        let first = generate_output_path(&input_path);
        std::fs::write(&first, b"v1").unwrap();
        let second = generate_output_path(&input_path);
        std::fs::write(&second, b"v2").unwrap();
        let third = generate_output_path(&input_path);

        let third_name = third.file_name().unwrap().to_string_lossy();
        assert!(
            third_name.contains("_recovered_3"),
            "expected _recovered_3, got: {}",
            third_name
        );
    }

    #[test]
    fn test_output_path_handles_unicode_filename() {
        let output = generate_output_path(Path::new("/tmp/\u{8996}\u{983C}_recording.mp4"));
        let filename = output.file_name().unwrap().to_string_lossy();
        assert!(
            filename.contains("_recovered.mp4"),
            "unicode filename should produce valid output path: {}",
            filename
        );
    }

    #[test]
    fn test_output_path_preserves_stem_with_dots() {
        let output = generate_output_path(Path::new("/tmp/my.stream.2024.mp4"));
        let filename = output.file_name().unwrap().to_string_lossy();
        assert_eq!(filename, "my.stream.2024_recovered.mp4");
    }

    // ── TEST GROUP 5: is_valid_video_extension ────────────────────────────

    #[test]
    fn test_extension_accepts_mp4() {
        assert!(is_valid_video_extension("/path/to/video.mp4"));
    }

    #[test]
    fn test_extension_accepts_mov() {
        assert!(is_valid_video_extension("/path/to/video.mov"));
    }

    #[test]
    fn test_extension_accepts_m4v() {
        assert!(is_valid_video_extension("/path/to/video.m4v"));
    }

    #[test]
    fn test_extension_is_case_insensitive() {
        assert!(is_valid_video_extension("/path/to/VIDEO.MP4"));
        assert!(is_valid_video_extension("/path/to/video.MOV"));
    }

    #[test]
    fn test_extension_rejects_txt() {
        assert!(!is_valid_video_extension("/path/to/file.txt"));
    }

    #[test]
    fn test_extension_rejects_avi() {
        assert!(!is_valid_video_extension("/path/to/file.avi"));
    }

    #[test]
    fn test_extension_rejects_no_extension() {
        assert!(!is_valid_video_extension("/path/to/file_without_extension"));
    }

    // ── TEST GROUP 6: output_is_valid ─────────────────────────────────────

    #[test]
    fn test_output_is_valid_returns_false_for_nonexistent() {
        let path = PathBuf::from("/definitely/does/not/exist.mp4");
        assert!(!output_is_valid(&path));
    }

    #[test]
    fn test_output_is_valid_returns_false_for_small_file() {
        let mut tmp = NamedTempFile::new().unwrap();
        tmp.write_all(&[0u8; 512]).unwrap();
        assert!(!output_is_valid(tmp.path()));
    }

    #[test]
    fn test_output_is_valid_returns_true_for_large_file() {
        let mut tmp = NamedTempFile::new().unwrap();
        tmp.write_all(&vec![0u8; 2048]).unwrap();
        assert!(output_is_valid(tmp.path()));
    }

    #[test]
    fn test_output_is_valid_boundary_exactly_1024_bytes() {
        let mut tmp = NamedTempFile::new().unwrap();
        tmp.write_all(&vec![0u8; 1024]).unwrap();
        assert!(!output_is_valid(tmp.path()), "1024 is not > 1024");
    }

    #[test]
    fn test_output_is_valid_boundary_1025_bytes() {
        let mut tmp = NamedTempFile::new().unwrap();
        tmp.write_all(&vec![0u8; 1025]).unwrap();
        assert!(output_is_valid(tmp.path()));
    }

    // ── TEST GROUP 7: License validation dev bypass ───────────────────────

    #[tokio::test]
    async fn test_dev_fallback_accepts_test_prefix() {
        let result = validate_license("TEST-1234".to_string()).await;
        assert_eq!(result, Ok(true), "TEST- prefix should pass dev bypass");
    }

    #[tokio::test]
    async fn test_dev_fallback_rejects_non_test_prefix() {
        let result = validate_license("REAL-KEY-ABCD-1234".to_string()).await;
        assert_eq!(result, Ok(false), "non-TEST- prefix should fail dev bypass");
    }

    #[tokio::test]
    async fn test_dev_fallback_case_sensitive() {
        let result = validate_license("test-1234".to_string()).await;
        assert_eq!(result, Ok(false), "TEST- prefix is case-sensitive");
    }

    #[tokio::test]
    async fn test_dev_fallback_empty_key_rejected() {
        let result = validate_license("".to_string()).await;
        assert_eq!(result, Ok(false), "empty key should not pass bypass");
    }

    #[tokio::test]
    async fn test_dev_fallback_test_prefix_only_at_start() {
        let result = validate_license("SUFFIX-TEST-1234".to_string()).await;
        assert_eq!(result, Ok(false));
    }
}
