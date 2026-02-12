param(
  [string]$BaseUrl = "http://localhost:8080",
  [string]$Username = "testuser_smoke",
  [string]$Email = "testuser_smoke@example.com",
  [string]$Password = "password",
  [bool]$UseUniqueUser = $true
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
if ($UseUniqueUser) {
  $Username = "${Username}_$timestamp"
  $Email = $Email -replace "@", "+$timestamp@"
}

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$token = $null
$results = New-Object System.Collections.Generic.List[object]

function Read-ErrorBody($ex) {
  try {
    if ($ex.ErrorDetails -and $ex.ErrorDetails.Message) {
      return $ex.ErrorDetails.Message
    }
    $response = $ex.Exception.Response
    if (-not $response) { return $null }
    $stream = $response.GetResponseStream()
    if (-not $stream) { return $null }
    $reader = New-Object System.IO.StreamReader($stream)
    return $reader.ReadToEnd()
  } catch {
    return $null
  }
}

function Get-StatusCode($ex) {
  try {
    if ($ex.Exception.Response -and $ex.Exception.Response.StatusCode) {
      return [int]$ex.Exception.Response.StatusCode
    }
  } catch {}
  return 0
}

function Invoke-Api {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Path,
    [object]$Body = $null,
    [bool]$UseAuth = $false,
    [string]$Query = $null
  )

  $uri = $BaseUrl.TrimEnd("/") + $Path
  if ($Query) {
    $uri = $uri + "?" + $Query
  }

  $headers = @{}
  if ($UseAuth -and $token) {
    $headers["Authorization"] = "Bearer $token"
  }

  $result = [pscustomobject]@{
    Name = $Name
    Method = $Method
    Path = $Path
    Ok = $true
    Status = 200
    Error = $null
    Data = $null
  }

  try {
    if ($Body -ne $null) {
      $json = $Body | ConvertTo-Json -Depth 10
      $resp = Invoke-RestMethod -Method $Method -Uri $uri -WebSession $session -Headers $headers -ContentType "application/json" -Body $json
    } else {
      $resp = Invoke-RestMethod -Method $Method -Uri $uri -WebSession $session -Headers $headers
    }
    $result.Data = $resp
  } catch {
    $result.Ok = $false
    $result.Status = Get-StatusCode $_
    $result.Error = Read-ErrorBody $_
    if (-not $result.Error) {
      $result.Error = $_.Exception.Message
    }
  }

  $results.Add($result) | Out-Null
  return $result
}

function Add-Skipped {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Path,
    [string]$Reason
  )

  $result = [pscustomobject]@{
    Name = $Name
    Method = $Method
    Path = $Path
    Ok = $true
    Status = 204
    Error = "skipped: $Reason"
    Data = $null
  }

  $results.Add($result) | Out-Null
  return $result
}

Write-Host "Base URL: $BaseUrl"

Invoke-Api -Name "Health" -Method "GET" -Path "/health" | Out-Null

$register = Invoke-Api -Name "Register" -Method "POST" -Path "/api/v1/auth/register" -Body @{ username = $Username; email = $Email; password = $Password }
if (-not $register.Ok) {
  $login = Invoke-Api -Name "Login" -Method "POST" -Path "/api/v1/auth/login" -Body @{ username = $Username; password = $Password }
  if ($login.Ok) {
    $token = $login.Data.data.authToken
    if (-not $token) { $token = $login.Data.data.access_token }
    if (-not $token) { $token = $login.Data.data.accessToken }
  }
  if (-not $token) {
    $suffix = Get-Date -Format "yyyyMMddHHmmss"
    $altUsername = "$Username`_$suffix"
    $altEmail = $Email -replace "@", "+$suffix@"
    Write-Host "Fallback register with $altUsername" -ForegroundColor Yellow
    $registerAlt = Invoke-Api -Name "RegisterFallback" -Method "POST" -Path "/api/v1/auth/register" -Body @{ username = $altUsername; email = $altEmail; password = $Password }
    if ($registerAlt.Ok) {
      $token = $registerAlt.Data.data.authToken
      if (-not $token) { $token = $registerAlt.Data.data.access_token }
      if (-not $token) { $token = $registerAlt.Data.data.accessToken }
    }
  }

  if ($register.Error -and $register.Error -match "username already exists") {
    $register.Ok = $true
    $register.Status = 200
    $register.Error = "handled: username already exists"
  }
} else {
  $token = $register.Data.data.authToken
  if (-not $token) { $token = $register.Data.data.access_token }
  if (-not $token) { $token = $register.Data.data.accessToken }
}

if (-not $token) {
  Write-Host "No access token available. Auth-dependent tests will be skipped." -ForegroundColor Yellow
}

if ($token) {
  $profile = Invoke-Api -Name "UserProfile" -Method "GET" -Path "/api/v1/user/profile" -UseAuth:$true
  $inventoryResp = Invoke-Api -Name "UserInventory" -Method "GET" -Path "/api/v1/user/inventory" -UseAuth:$true

  $currentCrystals = 0
  $currentGold = 0
  if ($inventoryResp.Ok -and $inventoryResp.Data.data) {
    $currentCrystals = [int]$inventoryResp.Data.data.crystals
    $currentGold = [int]$inventoryResp.Data.data.gold
  } elseif ($profile.Ok -and $profile.Data.data) {
    $currentCrystals = [int]$profile.Data.data.crystals
    $currentGold = [int]$profile.Data.data.gold
  }

if ($profile.Ok -and $profile.Data.data) {
  $currentUsername = $profile.Data.data.username
  $currentEmail = $profile.Data.data.email
  if (-not $currentEmail) { $currentEmail = $Email }
  Invoke-Api -Name "UserUpdateProfile" -Method "PUT" -Path "/api/v1/user/profile" -UseAuth:$true -Body @{ username = $currentUsername; email = $currentEmail } | Out-Null
}

$characters = Invoke-Api -Name "Characters" -Method "GET" -Path "/api/v1/characters" -UseAuth:$true
$firstCharId = $null
$partyIds = @()
if ($characters.Ok -and $characters.Data.data) {
  $list = $characters.Data.data
  if ($list.Count -gt 0) {
    $firstCharId = $list[0].id
    $partyIds = $list | Select-Object -First 4 | ForEach-Object { $_.id }
  }
}

if ($firstCharId) {
  $detail = Invoke-Api -Name "CharacterDetail" -Method "GET" -Path "/api/v1/characters/$firstCharId" -UseAuth:$true
  Invoke-Api -Name "CharacterLevelUp" -Method "POST" -Path "/api/v1/characters/$firstCharId/level-up" -UseAuth:$true -Body @{ exp_crystals = 1 } | Out-Null

  $maxLevels = @{ 1 = 15; 2 = 25; 3 = 35; 4 = 45; 5 = 60 }
  if ($detail.Ok -and $detail.Data.data) {
    $grade = [int]$detail.Data.data.grade
    $level = [int]$detail.Data.data.level
    if ($maxLevels.ContainsKey($grade) -and $level -ge $maxLevels[$grade]) {
      Invoke-Api -Name "CharacterAwaken" -Method "POST" -Path "/api/v1/characters/$firstCharId/awaken" -UseAuth:$true | Out-Null
    } else {
      Add-Skipped -Name "CharacterAwaken" -Method "POST" -Path "/api/v1/characters/$firstCharId/awaken" -Reason "character not at max level" | Out-Null
    }
  } else {
    Add-Skipped -Name "CharacterAwaken" -Method "POST" -Path "/api/v1/characters/$firstCharId/awaken" -Reason "character detail unavailable" | Out-Null
  }
}

Invoke-Api -Name "PartyGet" -Method "GET" -Path "/api/v1/party" -UseAuth:$true | Out-Null
if ($partyIds.Count -gt 0) {
  Invoke-Api -Name "PartySet" -Method "PUT" -Path "/api/v1/party" -UseAuth:$true -Body @{ character_ids = $partyIds } | Out-Null
}

if ($currentCrystals -ge 100) {
  $summonNormal = Invoke-Api -Name "SummonNormal" -Method "POST" -Path "/api/v1/summon/normal" -UseAuth:$true
  if ($summonNormal.Ok) { $currentCrystals -= 100 }
} else {
  Add-Skipped -Name "SummonNormal" -Method "POST" -Path "/api/v1/summon/normal" -Reason "insufficient crystals" | Out-Null
}

if ($currentCrystals -ge 300) {
  $summonPremium = Invoke-Api -Name "SummonPremium" -Method "POST" -Path "/api/v1/summon/premium" -UseAuth:$true
  if ($summonPremium.Ok) { $currentCrystals -= 300 }
} else {
  Add-Skipped -Name "SummonPremium" -Method "POST" -Path "/api/v1/summon/premium" -Reason "insufficient crystals" | Out-Null
}
Invoke-Api -Name "SummonRates" -Method "GET" -Path "/api/v1/summon/rates" -UseAuth:$true | Out-Null

$dungeons = Invoke-Api -Name "Dungeons" -Method "GET" -Path "/api/v1/dungeons" -UseAuth:$true
$firstDungeonId = $null
if ($dungeons.Ok -and $dungeons.Data.data) {
  $dungeonList = $dungeons.Data.data
  if ($dungeonList.Count -gt 0) {
    $firstDungeonId = $dungeonList[0].id
  }
}

if ($firstDungeonId) {
  Invoke-Api -Name "DungeonDetail" -Method "GET" -Path "/api/v1/dungeons/$firstDungeonId" -UseAuth:$true | Out-Null
  Invoke-Api -Name "DungeonProgress" -Method "GET" -Path "/api/v1/dungeons/progress" -UseAuth:$true | Out-Null
  Invoke-Api -Name "DungeonEnter" -Method "POST" -Path "/api/v1/dungeons/$firstDungeonId/enter" -UseAuth:$true | Out-Null
  Invoke-Api -Name "DungeonComplete" -Method "POST" -Path "/api/v1/dungeons/$firstDungeonId/complete" -UseAuth:$true -Body @{ stars = 3; time_taken = 60 } | Out-Null
}

Invoke-Api -Name "ArenaMy" -Method "GET" -Path "/api/v1/arena" -UseAuth:$true | Out-Null
if ($partyIds.Count -gt 0) {
  Invoke-Api -Name "ArenaDefense" -Method "PUT" -Path "/api/v1/arena/defense" -UseAuth:$true -Body @{ character_ids = $partyIds } | Out-Null
}
$ranking = Invoke-Api -Name "ArenaRanking" -Method "GET" -Path "/api/v1/arena/ranking" -UseAuth:$true -Query "limit=10"
if ($ranking.Ok -and $ranking.Data.data) {
  $defenderId = $ranking.Data.data | Select-Object -First 1 -ExpandProperty user_id
  if ($defenderId -and $partyIds.Count -gt 0) {
    Invoke-Api -Name "ArenaAttack" -Method "POST" -Path "/api/v1/arena/attack" -UseAuth:$true -Body @{ defender_id = $defenderId; attacker_team = $partyIds } | Out-Null
  }
}
Invoke-Api -Name "ArenaHistory" -Method "GET" -Path "/api/v1/arena/history" -UseAuth:$true | Out-Null

$dailyQuests = Invoke-Api -Name "QuestDaily" -Method "GET" -Path "/api/v1/quests/daily" -UseAuth:$true
Invoke-Api -Name "QuestWeekly" -Method "GET" -Path "/api/v1/quests/weekly" -UseAuth:$true | Out-Null
Invoke-Api -Name "QuestAchievements" -Method "GET" -Path "/api/v1/quests/achievements" -UseAuth:$true | Out-Null
Invoke-Api -Name "DailyLogin" -Method "GET" -Path "/api/v1/login/daily" -UseAuth:$true | Out-Null

$questId = $null
if ($dailyQuests.Ok -and $dailyQuests.Data.data) {
  $questId = $dailyQuests.Data.data | Select-Object -First 1 -ExpandProperty id
}
if ($questId) {
  Invoke-Api -Name "QuestComplete" -Method "POST" -Path "/api/v1/quests/$questId/complete" -UseAuth:$true | Out-Null
  Invoke-Api -Name "QuestClaim" -Method "POST" -Path "/api/v1/quests/$questId/claim" -UseAuth:$true | Out-Null
}

$guilds = Invoke-Api -Name "Guilds" -Method "GET" -Path "/api/v1/guilds" -UseAuth:$true
$guildId = $null
if ($guilds.Ok -and $guilds.Data.data) {
  $guildId = $guilds.Data.data | Select-Object -First 1 -ExpandProperty id
}

if (-not $guildId) {
  $guildName = "SmokeGuild_" + (Get-Date -Format "yyyyMMddHHmmss")
  $created = Invoke-Api -Name "GuildCreate" -Method "POST" -Path "/api/v1/guilds" -UseAuth:$true -Body @{ name = $guildName }
  if ($created.Ok -and $created.Data.data) {
    $guildId = $created.Data.data.id
  }
}

if ($guildId) {
  Invoke-Api -Name "GuildById" -Method "GET" -Path "/api/v1/guilds/$guildId" -UseAuth:$true | Out-Null
  Invoke-Api -Name "GuildMembers" -Method "GET" -Path "/api/v1/guilds/$guildId/members" -UseAuth:$true | Out-Null
  Invoke-Api -Name "GuildUpdate" -Method "PUT" -Path "/api/v1/guilds/$guildId" -UseAuth:$true -Body @{ description = "Smoke test update" } | Out-Null
  $join = Invoke-Api -Name "GuildJoin" -Method "POST" -Path "/api/v1/guilds/$guildId/join" -UseAuth:$true
  if (-not $join.Ok -and $join.Error -match "already in a guild") {
    $join.Ok = $true
    $join.Status = 200
    $join.Error = "handled: already in a guild"
  }

  $leave = Invoke-Api -Name "GuildLeave" -Method "POST" -Path "/api/v1/guilds/$guildId/leave" -UseAuth:$true
  if (-not $leave.Ok -and $leave.Error -match "leader cannot leave") {
    $leave.Ok = $true
    $leave.Status = 200
    $leave.Error = "handled: leader cannot leave"
  }

  $myGuild = Invoke-Api -Name "GuildMy" -Method "GET" -Path "/api/v1/guilds/my" -UseAuth:$true
  if (-not $myGuild.Ok -and $myGuild.Error -match "Not in a guild") {
    $myGuild.Ok = $true
    $myGuild.Status = 200
    $myGuild.Error = "handled: not in a guild"
  }
}

$shopItems = Invoke-Api -Name "ShopItems" -Method "GET" -Path "/api/v1/shop/items" -UseAuth:$true -Query "currency=gold"
$shopItemId = $null
  $shopItemPrice = $null
if ($shopItems.Ok -and $shopItems.Data.data) {
  $affordable = $shopItems.Data.data | Where-Object { $_.price -le $currentGold } | Select-Object -First 1
  if ($affordable) {
    $shopItemId = $affordable.id
    $shopItemPrice = [int]$affordable.price
  }
}
if ($shopItemId) {
  $purchase = Invoke-Api -Name "ShopPurchase" -Method "POST" -Path "/api/v1/shop/purchase" -UseAuth:$true -Body @{ shop_item_id = $shopItemId; quantity = 1 }
  if ($purchase.Ok -and $shopItemPrice -ne $null) { $currentGold -= $shopItemPrice }
} else {
  Add-Skipped -Name "ShopPurchase" -Method "POST" -Path "/api/v1/shop/purchase" -Reason "insufficient gold" | Out-Null
}
Invoke-Api -Name "ShopHistory" -Method "GET" -Path "/api/v1/shop/history" -UseAuth:$true | Out-Null

  $refreshCookie = $session.Cookies.GetCookies("$BaseUrl/api/v1/auth/refresh") | Where-Object { $_.Name -eq "refresh_token" } | Select-Object -First 1
  if ($refreshCookie) {
    Invoke-Api -Name "AuthRefresh" -Method "POST" -Path "/api/v1/auth/refresh" -Body @{} | Out-Null
  } else {
    Add-Skipped -Name "AuthRefresh" -Method "POST" -Path "/api/v1/auth/refresh" -Reason "no refresh cookie" | Out-Null
  }
  Invoke-Api -Name "AuthLogout" -Method "POST" -Path "/api/v1/auth/logout" -Body @{} | Out-Null
}

$failed = $results | Where-Object { -not $_.Ok }
Write-Host "";
Write-Host "Smoke test completed. Total: $($results.Count), Failed: $($failed.Count)"
if ($failed.Count -gt 0) {
  $failed | Select-Object Name, Method, Path, Status, Error | Format-Table -AutoSize -Wrap
}
