param(
  [string]$BaseUrl = "http://localhost:8080",
  [string]$WsUrl = "",
  [string]$Username = "testuser_smoke",
  [string]$Email = "testuser_smoke@example.com",
  [string]$Password = "password",
  [bool]$UseUniqueUser = $true,
  [int]$TimeoutSec = 30,
  [bool]$CheckDocs = $true,
  [bool]$CheckWs = $true,
  [int]$ThrottleMs = 150,
  [int]$MaxRetries = 2,
  [int]$RetryDelayMs = 700
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

  for ($attempt = 0; $attempt -le $MaxRetries; $attempt++) {
    try {
      if ($Body -ne $null) {
        $json = $Body | ConvertTo-Json -Depth 10
        $resp = Invoke-RestMethod -Method $Method -Uri $uri -WebSession $session -Headers $headers -ContentType "application/json" -Body $json -TimeoutSec $TimeoutSec
      } else {
        $resp = Invoke-RestMethod -Method $Method -Uri $uri -WebSession $session -Headers $headers -TimeoutSec $TimeoutSec
      }
      $result.Data = $resp
      if ($resp -and ($resp.PSObject.Properties.Name -contains "success") -and ($resp.success -eq $false)) {
        $result.Ok = $false
        $result.Status = 200
        if ($resp.error) {
          $result.Error = $resp.error
        } else {
          $result.Error = "api returned success=false"
        }
      }
      break
    } catch {
      $result.Ok = $false
      $result.Status = Get-StatusCode $_
      $result.Error = Read-ErrorBody $_
      if (-not $result.Error) {
        $result.Error = $_.Exception.Message
      }

      if ($result.Status -eq 429 -and $attempt -lt $MaxRetries) {
        Start-Sleep -Milliseconds $RetryDelayMs
        continue
      }
      break
    }
  }

  if ($ThrottleMs -gt 0) {
    Start-Sleep -Milliseconds $ThrottleMs
  }

  $results.Add($result) | Out-Null
  return $result
}

function Get-AuthTokenFromResponse {
  param(
    [object]$Resp
  )

  if (-not $Resp) { return $null }
  $data = $Resp.data
  if ($data -and $data.authToken) { return $data.authToken }
  if ($data -and $data.access_token) { return $data.access_token }
  if ($data -and $data.accessToken) { return $data.accessToken }
  return $null
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

function Add-Result {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Path,
    [bool]$Ok,
    [int]$Status,
    [string]$Error,
    [object]$Data = $null
  )

  $result = [pscustomobject]@{
    Name = $Name
    Method = $Method
    Path = $Path
    Ok = $Ok
    Status = $Status
    Error = $Error
    Data = $Data
  }

  $results.Add($result) | Out-Null
  return $result
}

function Get-WsUrl {
  param(
    [string]$HttpBaseUrl,
    [string]$ExplicitWsUrl
  )

  if ($ExplicitWsUrl) { return $ExplicitWsUrl }
  $wsBase = $HttpBaseUrl
  if ($wsBase -match "^https") {
    $wsBase = $wsBase -replace "^https", "wss"
  } elseif ($wsBase -match "^http") {
    $wsBase = $wsBase -replace "^http", "ws"
  }
  return $wsBase.TrimEnd("/") + "/ws"
}

function Receive-WebSocketText {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Socket,
    [int]$TimeoutSec
  )

  $buffer = New-Object byte[] 4096
  $segment = [System.ArraySegment[byte]]::new($buffer)
  $cts = New-Object System.Threading.CancellationTokenSource ([TimeSpan]::FromSeconds($TimeoutSec))
  $stream = New-Object System.IO.MemoryStream

  try {
    do {
      $result = $Socket.ReceiveAsync($segment, $cts.Token).GetAwaiter().GetResult()
      if ($result.Count -gt 0) {
        $stream.Write($buffer, 0, $result.Count)
      }
    } while (-not $result.EndOfMessage)
  } catch {
    return $null
  }

  $bytes = $stream.ToArray()
  if ($bytes.Length -eq 0) { return $null }
  return [System.Text.Encoding]::UTF8.GetString($bytes)
}

function Invoke-WebSocketTests {
  param(
    [string]$WsUrl,
    [string[]]$FallbackWsUrls = @()
  )

  $cts = New-Object System.Threading.CancellationTokenSource ([TimeSpan]::FromSeconds($TimeoutSec))
  $targets = @($WsUrl)
  foreach ($fallbackUrl in $FallbackWsUrls) {
    if ($fallbackUrl -and $fallbackUrl -ne $WsUrl) {
      $targets += $fallbackUrl
    }
  }

  $socket = $null
  $activeWsUrl = $null
  foreach ($target in $targets) {
    if ($socket) { $socket.Dispose() }
    $socket = [System.Net.WebSockets.ClientWebSocket]::new()
    $socket.Options.Proxy = $null
    try {
      [void]$socket.ConnectAsync([Uri]$target, $cts.Token).GetAwaiter().GetResult()
      Add-Result -Name "WebSocketConnect" -Method "WS" -Path $target -Ok $true -Status 101 -Error $null | Out-Null
      $activeWsUrl = $target
      break
    } catch {
      $err = $_.Exception
      $errMsg = $err.Message
      if ($err.InnerException) { $errMsg = $err.InnerException.Message }
      Add-Result -Name "WebSocketConnect" -Method "WS" -Path $target -Ok $false -Status 0 -Error $errMsg | Out-Null
    }
  }

  if (-not $activeWsUrl) {
    return
  }

  try {
    $pingPayload = @{ type = "ping" } | ConvertTo-Json -Compress
    $pingBytes = [System.Text.Encoding]::UTF8.GetBytes($pingPayload)
    $pingSegment = [System.ArraySegment[byte]]::new($pingBytes)
    [void]$socket.SendAsync($pingSegment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).GetAwaiter().GetResult()

    $pongText = Receive-WebSocketText -Socket $socket -TimeoutSec $TimeoutSec
    if ($pongText -and $pongText -match '"type"\s*:\s*"pong"') {
      Add-Result -Name "WebSocketPing" -Method "WS" -Path $activeWsUrl -Ok $true -Status 200 -Error $null | Out-Null
    } else {
      Add-Result -Name "WebSocketPing" -Method "WS" -Path $activeWsUrl -Ok $false -Status 0 -Error "pong not received" | Out-Null
    }
  } catch {
    Add-Result -Name "WebSocketPing" -Method "WS" -Path $activeWsUrl -Ok $false -Status 0 -Error $_.Exception.Message | Out-Null
  }

  try {
    $chatMessage = "smoke-chat-" + (Get-Date -Format "yyyyMMddHHmmss")
    $chatPayload = @{ type = "chat"; data = @{ message = $chatMessage } } | ConvertTo-Json -Compress
    $chatBytes = [System.Text.Encoding]::UTF8.GetBytes($chatPayload)
    $chatSegment = [System.ArraySegment[byte]]::new($chatBytes)
    [void]$socket.SendAsync($chatSegment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).GetAwaiter().GetResult()

    $chatOk = $false
    for ($i = 0; $i -lt 3; $i++) {
      $chatText = Receive-WebSocketText -Socket $socket -TimeoutSec $TimeoutSec
      if ($chatText -and $chatText -match [regex]::Escape($chatMessage)) {
        $chatOk = $true
        break
      }
    }

    if ($chatOk) {
      Add-Result -Name "WebSocketChat" -Method "WS" -Path $activeWsUrl -Ok $true -Status 200 -Error $null | Out-Null
    } else {
      Add-Result -Name "WebSocketChat" -Method "WS" -Path $activeWsUrl -Ok $false -Status 0 -Error "chat echo not received" | Out-Null
    }
  } catch {
    Add-Result -Name "WebSocketChat" -Method "WS" -Path $activeWsUrl -Ok $false -Status 0 -Error $_.Exception.Message | Out-Null
  }

  try {
    [void]$socket.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "smoke test", $cts.Token).GetAwaiter().GetResult()
  } catch {}
  $socket.Dispose()
}

Write-Host "Base URL: $BaseUrl"
Write-Host "Timeout: $TimeoutSec sec"

$health = Invoke-Api -Name "Health" -Method "GET" -Path "/health"
$skipRemaining = $false
if (-not $health.Ok -and $health.Status -eq 0) {
  Write-Host "API is not reachable. Check that the backend is running and BaseUrl is correct." -ForegroundColor Yellow
  $skipRemaining = $true
}

if (-not $skipRemaining -and $CheckDocs) {
  Invoke-Api -Name "DocsHtml" -Method "GET" -Path "/docs" | Out-Null
  Invoke-Api -Name "OpenApiJson" -Method "GET" -Path "/openapi.json" | Out-Null
  Invoke-Api -Name "AsyncApiYaml" -Method "GET" -Path "/asyncapi.yaml" | Out-Null
  Invoke-Api -Name "SwaggerUi" -Method "GET" -Path "/swagger/index.html" | Out-Null
}

if (-not $skipRemaining) {
  $register = Invoke-Api -Name "Register" -Method "POST" -Path "/api/v1/auth/register" -Body @{ username = $Username; email = $Email; password = $Password }
  if (-not $register.Ok) {
    $login = Invoke-Api -Name "Login" -Method "POST" -Path "/api/v1/auth/login" -Body @{ username = $Username; password = $Password }
    if ($login.Ok) {
      $token = Get-AuthTokenFromResponse -Resp $login.Data
    }
    if (-not $token) {
      $suffix = Get-Date -Format "yyyyMMddHHmmss"
      $altUsername = "$Username`_$suffix"
      $altEmail = $Email -replace "@", "+$suffix@"
      Write-Host "Fallback register with $altUsername" -ForegroundColor Yellow
      $registerAlt = Invoke-Api -Name "RegisterFallback" -Method "POST" -Path "/api/v1/auth/register" -Body @{ username = $altUsername; email = $altEmail; password = $Password }
      if ($registerAlt.Ok) {
        $token = Get-AuthTokenFromResponse -Resp $registerAlt.Data
      }
    }

    if ($register.Error -and $register.Error -match "username already exists") {
      $register.Ok = $true
      $register.Status = 200
      $register.Error = "handled: username already exists"
    }
  } else {
    $token = Get-AuthTokenFromResponse -Resp $register.Data
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
    Invoke-Api -Name "DungeonsByChapter" -Method "GET" -Path "/api/v1/dungeons" -UseAuth:$true -Query "chapter=1" | Out-Null
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
      $dungeonEnter = Invoke-Api -Name "DungeonEnter" -Method "POST" -Path "/api/v1/dungeons/$firstDungeonId/enter" -UseAuth:$true
      Invoke-Api -Name "DungeonComplete" -Method "POST" -Path "/api/v1/dungeons/$firstDungeonId/complete" -UseAuth:$true -Body @{ stars = 3; time_taken = 60 } | Out-Null

      $battleId = $null
      if ($dungeonEnter.Ok -and $dungeonEnter.Data.data -and $dungeonEnter.Data.data.battle_id) {
        $battleId = [int64]$dungeonEnter.Data.data.battle_id
      }

      if ($battleId) {
        $battleState = Invoke-Api -Name "BattleState" -Method "GET" -Path "/api/v1/battle/$battleId/state" -UseAuth:$true
        Invoke-Api -Name "BattleAuto" -Method "POST" -Path "/api/v1/battle/$battleId/auto" -UseAuth:$true -Body @{ auto = $true } | Out-Null
        Invoke-Api -Name "BattleSpeed" -Method "POST" -Path "/api/v1/battle/$battleId/speed" -UseAuth:$true -Body @{ speed = 2.0 } | Out-Null

        $actionUnitId = $null
        $targetId = $null
        if ($battleState.Ok -and $battleState.Data.data) {
          $actionUnitId = $battleState.Data.data.active_unit_id
          $enemies = $battleState.Data.data.enemies
          if ($enemies -and $enemies.Count -gt 0) {
            $targetId = $enemies[0].unit_id
          }
        }

        if ($actionUnitId -and $targetId) {
          Invoke-Api -Name "BattleAction" -Method "POST" -Path "/api/v1/battle/$battleId/action" -UseAuth:$true -Body @{ unit_id = $actionUnitId; skill_index = 0; target_ids = @($targetId) } | Out-Null
        } else {
          Add-Skipped -Name "BattleAction" -Method "POST" -Path "/api/v1/battle/$battleId/action" -Reason "battle action prerequisites missing" | Out-Null
        }

        $battleSurrender = Invoke-Api -Name "BattleSurrender" -Method "POST" -Path "/api/v1/battle/$battleId/surrender" -UseAuth:$true
        if (-not $battleSurrender.Ok -and $battleSurrender.Error -match "battle already ended") {
          $battleSurrender.Ok = $true
          $battleSurrender.Status = 200
          $battleSurrender.Error = "handled: battle already ended"
        }

        Invoke-Api -Name "BattleResult" -Method "GET" -Path "/api/v1/battle/$battleId/result" -UseAuth:$true | Out-Null
      } else {
        Add-Skipped -Name "BattleState" -Method "GET" -Path "/api/v1/battle/:id/state" -Reason "battle id unavailable" | Out-Null
        Add-Skipped -Name "BattleAuto" -Method "POST" -Path "/api/v1/battle/:id/auto" -Reason "battle id unavailable" | Out-Null
        Add-Skipped -Name "BattleSpeed" -Method "POST" -Path "/api/v1/battle/:id/speed" -Reason "battle id unavailable" | Out-Null
        Add-Skipped -Name "BattleAction" -Method "POST" -Path "/api/v1/battle/:id/action" -Reason "battle id unavailable" | Out-Null
        Add-Skipped -Name "BattleSurrender" -Method "POST" -Path "/api/v1/battle/:id/surrender" -Reason "battle id unavailable" | Out-Null
        Add-Skipped -Name "BattleResult" -Method "GET" -Path "/api/v1/battle/:id/result" -Reason "battle id unavailable" | Out-Null
      }
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
    Invoke-Api -Name "ArenaHistory" -Method "GET" -Path "/api/v1/arena/history" -UseAuth:$true -Query "limit=10" | Out-Null

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

    $guilds = Invoke-Api -Name "Guilds" -Method "GET" -Path "/api/v1/guilds" -UseAuth:$true -Query "page=1&limit=5"
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
      $guildUpdate = Invoke-Api -Name "GuildUpdate" -Method "PUT" -Path "/api/v1/guilds/$guildId" -UseAuth:$true -Body @{ description = "Smoke test update" }
      if (-not $guildUpdate.Ok -and $guildUpdate.Error -match "only guild leader can update guild") {
        $guildUpdate.Ok = $true
        $guildUpdate.Status = 200
        $guildUpdate.Error = "handled: only guild leader can update guild"
      }
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
    Invoke-Api -Name "ShopItemsCrystal" -Method "GET" -Path "/api/v1/shop/items" -UseAuth:$true -Query "currency=crystal" | Out-Null
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

  if ($CheckWs) {
    $wsTargetUrl = Get-WsUrl -HttpBaseUrl $BaseUrl -ExplicitWsUrl $WsUrl
    $fallbackWsUrls = @()
    if (-not $WsUrl) {
      try {
        $baseUri = [Uri]$BaseUrl
        if ($baseUri.Host -eq "localhost") {
          $ipv4Base = "{0}://127.0.0.1" -f $baseUri.Scheme
          if (-not $baseUri.IsDefaultPort) {
            $ipv4Base = "{0}://127.0.0.1:{1}" -f $baseUri.Scheme, $baseUri.Port
          }
          $fallbackWsUrls += Get-WsUrl -HttpBaseUrl $ipv4Base -ExplicitWsUrl ""
        }
        if ($baseUri.IsDefaultPort -or $baseUri.Port -eq 80) {
          $fallbackBase = "{0}://{1}:8080" -f $baseUri.Scheme, $baseUri.Host
          $fallbackWsUrls += Get-WsUrl -HttpBaseUrl $fallbackBase -ExplicitWsUrl ""
        } elseif ($baseUri.Port -eq 8080) {
          $fallbackBase = "{0}://{1}" -f $baseUri.Scheme, $baseUri.Host
          $fallbackWsUrls += Get-WsUrl -HttpBaseUrl $fallbackBase -ExplicitWsUrl ""
        }
      } catch {}
    }
    Invoke-WebSocketTests -WsUrl $wsTargetUrl -FallbackWsUrls $fallbackWsUrls
  }
}

$failed = $results | Where-Object { -not $_.Ok }
Write-Host "";
Write-Host "Smoke test completed. Total: $($results.Count), Failed: $($failed.Count)"
if ($failed.Count -gt 0) {
  $failed | Select-Object Name, Method, Path, Status, Error | Format-Table -AutoSize -Wrap
}
