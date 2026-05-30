fn main() {
    if let Ok(key) = std::env::var("LEMON_SQUEEZY_API_KEY") {
        println!("cargo:rustc-env=LEMON_SQUEEZY_API_KEY={}", key);
    }
    tauri_build::build()
}
