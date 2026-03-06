# PowerShell API Test Zanjiri (PS 5.x compatible)
$BaseUrl = "http://localhost:3000/api"
$ErrorActionPreference = "SilentlyContinue"

function Test-Api {
    param($Name, $Method, $Url, $Body, $Headers)
    try {
        $params = @{ Uri=$Url; Method=$Method; ContentType="application/json"; ErrorAction="Stop" }
        if ($Body)    { $params.Body    = ($Body | ConvertTo-Json -Depth 5) }
        if ($Headers) { $params.Headers = $Headers }
        $resp = Invoke-RestMethod @params
        Write-Host "  [OK] $Name — $($resp.message)" -ForegroundColor Green
        return $resp
    } catch {
        try {
            $errMsg = ($_.ErrorDetails.Message | ConvertFrom-Json).message
        } catch { $errMsg = $_.ErrorDetails.Message }
        Write-Host "  [FAIL] $Name — $errMsg" -ForegroundColor Red
        return $null
    }
}

Write-Host ""
Write-Host "======================================================="
Write-Host "  ZIYO CHASHMASI ERP --- API TEST ZANJIRI"
Write-Host "======================================================="
Write-Host ""

# STEP 1: LOGIN
Write-Host "[STEP 1] Admin Login" -ForegroundColor Cyan
$loginResp = Test-Api -Name "POST /auth/login" -Method POST -Url "$BaseUrl/auth/login" `
    -Body @{ phone="+998901234567"; password="Admin@12345" }
if (!$loginResp) { Write-Host "LOGIN FAILED — exiting"; exit 1 }
$token = $loginResp.data.accessToken
$auth  = @{ Authorization = "Bearer $token" }
Write-Host "  Token: $($token.Substring(0,40))..."

# STEP 2: KURS YARATISH
Write-Host ""
Write-Host "[STEP 2] Kurs yaratish" -ForegroundColor Cyan
$courseResp = Test-Api -Name "POST /academic/courses" -Method POST -Url "$BaseUrl/academic/courses" `
    -Headers $auth `
    -Body @{
        subjectId      = 1
        name           = "Ingliz tili Beginner"
        description    = "A1 darajasi — boshlangich ingliz tili"
        pricePerMonth  = 350000
        durationMonths = 4
        lessonsPerWeek = 3
        level          = "Beginner"
        maxStudents    = 15
    }
$courseId = if ($courseResp) { $courseResp.data.id } else { $null }
Write-Host "  Course ID: $courseId"

# STEP 3: GURUH YARATISH
Write-Host ""
Write-Host "[STEP 3] Guruh yaratish" -ForegroundColor Cyan
if ($courseId) {
    $groupResp = Test-Api -Name "POST /academic/groups" -Method POST -Url "$BaseUrl/academic/groups" `
        -Headers $auth `
        -Body @{
            courseId         = $courseId
            teacherId        = 1
            roomId           = 1
            dayCombinationId = 1
            startTime        = "09:00"
            endTime          = "11:00"
            startDate        = "2026-04-01"
            endDate          = "2026-07-31"
            name             = "Ingliz-Beginner-A"
            maxStudents      = 15
        }
    $groupId = if ($groupResp) { $groupResp.data.id } else { $null }
    Write-Host "  Group ID: $groupId"
} else {
    Write-Host "  [SKIP] CourseId yo'q" -ForegroundColor Yellow
    $groupId = $null
}

# STEP 4: TALABANI BIRIKTIRISH
Write-Host ""
Write-Host "[STEP 4] Talabani guruhga biriktirish" -ForegroundColor Cyan
if ($groupId) {
    $enrollResp = Test-Api -Name "POST /academic/enrollments" -Method POST -Url "$BaseUrl/academic/enrollments" `
        -Headers $auth `
        -Body @{
            groupId   = $groupId
            studentId = 1
        }
} else {
    Write-Host "  [SKIP] GroupId yo'q" -ForegroundColor Yellow
    $enrollResp = $null
}

# NATIJA
Write-Host ""
Write-Host "======================================================="
Write-Host "  NATIJA:"
Write-Host "======================================================="
$r1 = if ($loginResp)  { "OK - JWT token olindi"        } else { "FAIL" }
$r2 = if ($courseId)   { "OK - Course ID: $courseId"    } else { "FAIL" }
$r3 = if ($groupId)    { "OK - Group  ID: $groupId"     } else { "FAIL" }
$r4 = if ($enrollResp) { "OK - 201 Created"             } else { "FAIL" }
Write-Host "  1. Login:    $r1"
Write-Host "  2. Course:   $r2"
Write-Host "  3. Group:    $r3"
Write-Host "  4. Enroll:   $r4"
Write-Host "======================================================="
Write-Host ""
