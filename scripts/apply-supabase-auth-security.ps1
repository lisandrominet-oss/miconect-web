Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRef = [Environment]::GetEnvironmentVariable("SUPABASE_PROJECT_REF")
$accessToken = [Environment]::GetEnvironmentVariable("SUPABASE_ACCESS_TOKEN")

if ([string]::IsNullOrWhiteSpace($projectRef)) {
  throw "Falta SUPABASE_PROJECT_REF."
}
if ([string]::IsNullOrWhiteSpace($accessToken)) {
  throw "Falta SUPABASE_ACCESS_TOKEN con permiso auth_config_write."
}

$uri = "https://api.supabase.com/v1/projects/$projectRef/config/auth"
$headers = @{
  Authorization = "Bearer $accessToken"
  "Content-Type" = "application/json"
}
$payload = @{
  password_hibp_enabled = $true
  sessions_single_per_user = $true
  security_update_password_require_reauthentication = $true
} | ConvertTo-Json

Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -Body $payload | Out-Null
$current = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers

if ($current.password_hibp_enabled -ne $true) {
  throw "Supabase no confirmó la protección contra contraseñas filtradas."
}
if ($current.sessions_single_per_user -ne $true) {
  throw "Supabase no confirmó la política de una sesión por usuario."
}
if ($current.security_update_password_require_reauthentication -ne $true) {
  throw "Supabase no confirmó la reautenticación para cambiar contraseña."
}

Write-Output "Auth verificado: HIBP activo, una sesión por usuario y cambio de contraseña con reautenticación."
