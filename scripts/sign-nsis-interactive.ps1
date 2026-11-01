# Interactive eSigner sign for StreamSalvage NSIS setup
Set-Location C:\CodeSignTool

$u = Read-Host "SSL.com username"
$p = Read-Host "SSL.com password" -AsSecureString
$t = Read-Host "eSigner TOTP secret" -AsSecureString
$out = "C:\my_repo\StreamSalvage\src-tauri\target\release\bundle\nsis\signed"
New-Item -ItemType Directory -Force $out | Out-Null

Write-Host "Signing..." -ForegroundColor Cyan
& .\CodeSignTool.bat sign `
  -username="$u" `
  -password="$([Net.NetworkCredential]::new('', $p).Password)" `
  -totp_secret="$([Net.NetworkCredential]::new('', $t).Password)" `
  -input_file_path="C:\my_repo\StreamSalvage\src-tauri\target\release\bundle\nsis\StreamSalvage_1.0.1_x64-setup.exe" `
  -output_dir_path="$out"

$code = $LASTEXITCODE
Remove-Variable u, p, t -ErrorAction SilentlyContinue

if ($code -eq 0) {
  Write-Host "Done. Signed file in: $out" -ForegroundColor Green
} else {
  Write-Host "CodeSignTool exited with code $code" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press Enter to close..."
Read-Host | Out-Null
exit $code
