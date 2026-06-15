fn main() {
    if let Ok(endpoint) = std::env::var("STREAMSALVAGE_LICENSE_API_URL") {
        println!("cargo:rustc-env=STREAMSALVAGE_LICENSE_API_URL={}", endpoint);
    }
    tauri_build::build()
}
