Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

root = fso.GetParentFolderName(WScript.ScriptFullName)
logs = fso.BuildPath(root, "logs")
url = "http://127.0.0.1:8173"

If Not fso.FolderExists(logs) Then
  fso.CreateFolder(logs)
End If

shell.CurrentDirectory = root

If IsReachable(url) Then
  shell.Run url, 1, False
  WScript.Quit
End If

nodePath = ResolveNode(root)
If nodePath = "" Then
  MsgBox "SMART ReplySuite konnte Node.js nicht finden. Bitte nutze ein App-Paket mit mitgelieferter Laufzeit oder installiere Node.js.", 48, "SMART ReplySuite"
  WScript.Quit 1
End If

command = "cmd.exe /c """ & nodePath & """ localProxyServer.js > logs\replysuite-server.log 2>&1"
shell.Run command, 0, False

WScript.Sleep 1500
shell.Run url, 1, False

Function IsReachable(targetUrl)
  On Error Resume Next
  Set http = CreateObject("MSXML2.XMLHTTP")
  http.Open "GET", targetUrl, False
  http.Send
  IsReachable = (Err.Number = 0 And http.Status >= 200 And http.Status < 500)
  Err.Clear
End Function

Function ResolveNode(rootPath)
  candidates = Array( _
    fso.BuildPath(rootPath, "vendor\node\win32-x64\node.exe"), _
    fso.BuildPath(rootPath, "vendor\node\win32-arm64\node.exe"), _
    fso.BuildPath(rootPath, "bin\win32-x64\node.exe"), _
    fso.BuildPath(rootPath, "bin\win32-arm64\node.exe") _
  )

  For Each candidate In candidates
    If fso.FileExists(candidate) Then
      ResolveNode = candidate
      Exit Function
    End If
  Next

  ResolveNode = "node"
End Function
