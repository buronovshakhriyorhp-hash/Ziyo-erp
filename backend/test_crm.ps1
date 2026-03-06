# PowerShell CRM Module API Test Zanjiri
# Ishga tushirish: cd backend && .\test_crm.ps1

$BaseUrl = "http://localhost:3000/api"
$ErrorActionPreference = "SilentlyContinue"

function Test-Api {
    param($Name, $Method, $Url, $Body, $Headers)
    try {
        $params = @{ Uri = $Url; Method = $Method; ContentType = "application/json"; ErrorAction = "Stop" }
        if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 5) }
        if ($Headers) { $params.Headers = $Headers }
        $resp = Invoke-RestMethod @params
        Write-Host "  [OK] $Name" -ForegroundColor Green
        if ($resp.message) { Write-Host "       $($resp.message)" -ForegroundColor DarkGray }
        return $resp
    }
    catch {
        try { $errMsg = ($_.ErrorDetails.Message | ConvertFrom-Json).message }
        catch { $errMsg = $_.ErrorDetails.Message }
        Write-Host "  [FAIL] $Name -- $errMsg" -ForegroundColor Red
        return $null
    }
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  ZIYO CHASHMASI ERP --- CRM MODULE API TESTS"          -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────────────────────
# STEP 1: Admin Login
# ─────────────────────────────────────────────────────────────
Write-Host "[STEP 1] Admin Login" -ForegroundColor Yellow
$loginResp = Test-Api -Name "POST /auth/login" -Method POST -Url "$BaseUrl/auth/login" `
    -Body @{ phone = "+998901234567"; password = "Admin@12345" }
if (!$loginResp) { Write-Host "LOGIN FAILED — exiting" -ForegroundColor Red; exit 1 }
$token = $loginResp.data.accessToken
$auth = @{ Authorization = "Bearer $token" }
Write-Host "  Token: $($token.Substring(0,40))..." -ForegroundColor DarkGray

# ─────────────────────────────────────────────────────────────
# STEP 2: Lid statuslari va manbalarini tekshirish
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 2] CRM Lookup endpointlari" -ForegroundColor Yellow
$statusResp = Test-Api -Name "GET /crm/statuses" -Method GET -Url "$BaseUrl/crm/statuses" -Headers $auth
$sourceResp = Test-Api -Name "GET /crm/sources"  -Method GET -Url "$BaseUrl/crm/sources"  -Headers $auth

# Birinchi statusning ID sini olish (yangi lid uchun)
$defaultStatusId = if ($statusResp) { $statusResp.data[0].id }  else { 1 }
# "Yozildi" statusini topish (konversiya uchun)
$yozildiStatusId = if ($statusResp) {
    $s = $statusResp.data | Where-Object { $_.name -eq 'Yozildi' }
    if ($s) { $s.id } else { 4 }
}
else { 4 }
Write-Host "  Default Status ID: $defaultStatusId  |  Yozildi ID: $yozildiStatusId" -ForegroundColor DarkGray

# ─────────────────────────────────────────────────────────────
# STEP 3: Yangi Lid yaratish
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 3] Yangi Lid yaratish" -ForegroundColor Yellow
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$leadResp = Test-Api -Name "POST /crm/leads" -Method POST -Url "$BaseUrl/crm/leads" `
    -Headers $auth `
    -Body @{
    fullName       = "Testov Lidjon $timestamp"
    phone          = "+9989000$timestamp".Substring(0, 13)
    email          = "testlid$timestamp@example.com"
    sourceId       = 1
    statusId       = $defaultStatusId
    courseInterest = "Ingliz tili"
    notes          = "Test lid - avtomatik yaratildi"
}
$leadId = if ($leadResp) { $leadResp.data.id } else { $null }
Write-Host "  Lead ID: $leadId" -ForegroundColor DarkGray

# ─────────────────────────────────────────────────────────────
# STEP 4: Lid ma'lumotlarini ko'rish
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 4] Lid ma'lumotlarini ko'rish" -ForegroundColor Yellow
if ($leadId) {
    Test-Api -Name "GET /crm/leads/$leadId" -Method GET -Url "$BaseUrl/crm/leads/$leadId" -Headers $auth | Out-Null
}

# ─────────────────────────────────────────────────────────────
# STEP 5: Qo'ng'iroq logi qo'shish (next_call_at bilan)
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 5] Qo'ng'iroq logi qo'shish" -ForegroundColor Yellow
$nextCallDate = (Get-Date).AddDays(2).ToString("yyyy-MM-ddTHH:mm:ssZ")
$callResp = $null
if ($leadId) {
    $callResp = Test-Api -Name "POST /crm/leads/$leadId/calls" -Method POST `
        -Url "$BaseUrl/crm/leads/$leadId/calls" -Headers $auth `
        -Body @{
        durationSec = 120
        callType    = "outbound"
        result      = "scheduled_callback"
        nextCallAt  = $nextCallDate
        notes       = "Kurs haqida qiziqdi, 2 kundan keyin qayta qo'ng'iroq"
    }
}
$callLogId = if ($callResp) { $callResp.data.id } else { $null }
Write-Host "  Call Log ID: $callLogId | Next Call: $nextCallDate" -ForegroundColor DarkGray

# ─────────────────────────────────────────────────────────────
# STEP 6: Call logs ko'rish (bitta lid uchun)
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 6] Bitta lid qo'ng'iroqlari tarixi" -ForegroundColor Yellow
if ($leadId) {
    $histResp = Test-Api -Name "GET /crm/leads/$leadId/calls" -Method GET `
        -Url "$BaseUrl/crm/leads/$leadId/calls" -Headers $auth
    if ($histResp) {
        Write-Host "  Jami qo'ng'iroqlar: $($histResp.data.Count)" -ForegroundColor DarkGray
    }
}

# ─────────────────────────────────────────────────────────────
# STEP 7: Global call-logs ro'yxati
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 7] Global call-logs ro'yxati" -ForegroundColor Yellow
$allCallsResp = Test-Api -Name "GET /crm/call-logs" -Method GET `
    -Url "$BaseUrl/crm/call-logs?limit=10" -Headers $auth
if ($allCallsResp) {
    Write-Host "  Jami: $($allCallsResp.data.pagination.total) ta qo'ng'iroq" -ForegroundColor DarkGray
}

# ─────────────────────────────────────────────────────────────
# STEP 8: Upcoming reminders
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 8] Upcoming qo'ng'iroqlar (eslatmalar)" -ForegroundColor Yellow
$upcomingResp = Test-Api -Name "GET /crm/call-logs/upcoming" -Method GET `
    -Url "$BaseUrl/crm/call-logs/upcoming" -Headers $auth
if ($upcomingResp) {
    Write-Host "  Rejalashtirilgan: $($upcomingResp.data.Count) ta qo'ng'iroq" -ForegroundColor DarkGray
}

# ─────────────────────────────────────────────────────────────
# STEP 9: Lead → Student konversiya (qo'lda)
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 9] Lead → Student konversiya (POST /convert)" -ForegroundColor Yellow
$convertResp = $null
if ($leadId) {
    $convertResp = Test-Api -Name "POST /crm/leads/$leadId/convert" -Method POST `
        -Url "$BaseUrl/crm/leads/$leadId/convert" -Headers $auth `
        -Body @{
        birthDate  = "2005-06-15"
        address    = "Toshkent, Yunusobod tumani"
        schoolName = "1-son maktab"
        grade      = 11
    }
}
if ($convertResp) {
    Write-Host "  User ID: $($convertResp.data.userId)" -ForegroundColor DarkGray
    Write-Host "  Student ID: $($convertResp.data.studentId)" -ForegroundColor DarkGray
    Write-Host "  Temp Password: $($convertResp.data.tempPassword)" -ForegroundColor DarkYellow
}

# ─────────────────────────────────────────────────────────────
# STEP 10: Konversiyadan keyin lid statusini tekshirish
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 10] Konversiyadan keyin lid holati" -ForegroundColor Yellow
if ($leadId) {
    $updatedLead = Test-Api -Name "GET /crm/leads/$leadId" -Method GET `
        -Url "$BaseUrl/crm/leads/$leadId" -Headers $auth
    if ($updatedLead) {
        Write-Host "  Status: $($updatedLead.data.statusName)" -ForegroundColor DarkGray
        Write-Host "  Student ID: $($updatedLead.data.studentId)" -ForegroundColor DarkGray
        Write-Host "  Converted At: $($updatedLead.data.convertedAt)" -ForegroundColor DarkGray
    }
}

# ─────────────────────────────────────────────────────────────
# STEP 11: Auto-konversiya testi — yangi lid + status "Yozildi"
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 11] Auto-konversiya (PATCH status='Yozildi')" -ForegroundColor Yellow
$ts2 = [int][double]::Parse((Get-Date -UFormat %s)) + 1
$autoLeadResp = Test-Api -Name "POST /crm/leads (auto test)" -Method POST -Url "$BaseUrl/crm/leads" `
    -Headers $auth `
    -Body @{
    fullName = "Auto Testova $ts2"
    phone    = "+998901${ts2}".Substring(0, 13)
    statusId = $defaultStatusId
}
$autoLeadId = if ($autoLeadResp) { $autoLeadResp.data.id } else { $null }

if ($autoLeadId) {
    $autoConvert = Test-Api -Name "PATCH /crm/leads/$autoLeadId (status=Yozildi → avto-konversiya)" `
        -Method PATCH -Url "$BaseUrl/crm/leads/$autoLeadId" -Headers $auth `
        -Body @{ statusId = $yozildiStatusId }
    if ($autoConvert -and $autoConvert.data.tempPassword) {
        Write-Host "  ✅ Avto-konversiya ishladi! Temp: $($autoConvert.data.tempPassword)" -ForegroundColor Green
    }
    elseif ($autoConvert) {
        Write-Host "  Javob: $($autoConvert.message)" -ForegroundColor DarkGray
    }
}

# ─────────────────────────────────────────────────────────────
# STEP 12: Vazifa (Task) yaratish
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 12] Vazifa yaratish" -ForegroundColor Yellow
$due = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
$taskResp = $null
if ($leadId) {
    $taskResp = Test-Api -Name "POST /crm/tasks" -Method POST -Url "$BaseUrl/crm/tasks" `
        -Headers $auth `
        -Body @{
        leadId      = $leadId
        title       = "Lidga qayta qo'ng'iroq qilish"
        description = "3 kundan keyin kurs narxi haqida gaplashish"
        dueDate     = $due
    }
}
$taskId = if ($taskResp) { $taskResp.data.id } else { $null }
Write-Host "  Task ID: $taskId | Due: $due" -ForegroundColor DarkGray

# ─────────────────────────────────────────────────────────────
# STEP 13: Vazifani bajarish
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 13] Vazifani bajarildi deb belgilash" -ForegroundColor Yellow
if ($taskId) {
    $completeResp = Test-Api -Name "PATCH /crm/tasks/$taskId/complete" -Method PATCH `
        -Url "$BaseUrl/crm/tasks/$taskId/complete" -Headers $auth
    if ($completeResp) {
        Write-Host "  isCompleted: $($completeResp.data.isCompleted)" -ForegroundColor DarkGray
    }
}

# ─────────────────────────────────────────────────────────────
# STEP 14: Overdue summary
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 14] Overdue vazifalar xulosasi" -ForegroundColor Yellow
Test-Api -Name "GET /crm/tasks/overdue-summary" -Method GET `
    -Url "$BaseUrl/crm/tasks/overdue-summary" -Headers $auth | Out-Null

# ─────────────────────────────────────────────────────────────
# STEP 15: Call log soft delete
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[STEP 15] Call log soft delete" -ForegroundColor Yellow
if ($callLogId) {
    Test-Api -Name "DELETE /crm/call-logs/$callLogId" -Method DELETE `
        -Url "$BaseUrl/crm/call-logs/$callLogId" -Headers $auth | Out-Null
}

# ─────────────────────────────────────────────────────────────
# NATIJA
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  NATIJA:"                                               -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  1.  Login:           $(if ($loginResp)     { 'OK' } else { 'FAIL' })"
Write-Host "  2.  Lookups:         $(if ($statusResp)    { 'OK' } else { 'FAIL' })"
Write-Host "  3.  Lead yaratish:   $(if ($leadId)        { "OK (ID: $leadId)" } else { 'FAIL' })"
Write-Host "  5.  Call log qo'sh:  $(if ($callLogId)     { "OK (ID: $callLogId)" } else { 'FAIL' })"
Write-Host "  7.  Global calls:    $(if ($allCallsResp)  { 'OK' } else { 'FAIL' })"
Write-Host "  8.  Upcoming:        $(if ($upcomingResp)  { 'OK' } else { 'FAIL' })"
Write-Host "  9.  Konversiya:      $(if ($convertResp)   { 'OK' } else { 'FAIL' })"
Write-Host "  11. Auto-konversiya: $(if ($autoConvert)   { 'OK' } else { 'FAIL' })"
Write-Host "  12. Task yaratish:   $(if ($taskId)        { "OK (ID: $taskId)" } else { 'FAIL' })"
Write-Host "  13. Task complete:   $(if ($taskId)        { 'OK' } else { 'FAIL' })"
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
