Attribute VB_Name = "ChromeDinoGame"
Option Explicit

#If VBA7 Then
Private Declare PtrSafe Function GetAsyncKeyState Lib "user32" (ByVal vKey As Long) As Integer
#Else
Private Declare Function GetAsyncKeyState Lib "user32" (ByVal vKey As Long) As Integer
#End If

Private Const VK_SPACE As Long = 32
Private Const VK_UP As Long = 38
Private Const VK_DOWN As Long = 40
Private Const VK_R As Long = 82
Private Const GROUND As Single = 5.45
Private Const PLAYER_X As Single = 1.45
Private Const FIELD_RIGHT As Single = 12.0

Private running As Boolean
Private y As Single, vy As Single, speed As Single, points As Long
Private player As Shape, cactus As Shape, scoreBox As Shape, groundLine As Shape
Private slideRef As Slide
Private basePath As String

Public Sub StartChromeDino()
    Dim sh As Shape, s As Slide
    If ActivePresentation.Path = "" Then
        MsgBox "Salve primeiro a apresentação dentro da pasta do pacote.", vbExclamation
        Exit Sub
    End If
    basePath = ActivePresentation.Path & Application.PathSeparator & "assets" & Application.PathSeparator
    Set s = ActivePresentation.Slides(1)
    Set slideRef = s

    On Error Resume Next
    For Each sh In s.Shapes
        If Left$(sh.Name, 6) = "DINO__" Then sh.Delete
    Next sh
    On Error GoTo 0

    Set groundLine = s.Shapes.AddShape(msoShapeRectangle, Inches(0.55), Inches(GROUND + 0.43), Inches(12.2), Inches(0.025))
    groundLine.Name = "DINO__Ground"
    groundLine.Fill.ForeColor.RGB = RGB(83, 83, 83)
    groundLine.Line.Visible = msoFalse

    Set player = s.Shapes.AddPicture(basePath & "dino-run-1.png", msoFalse, msoTrue, Inches(PLAYER_X), Inches(GROUND - 0.40), Inches(0.37), Inches(0.40))
    player.Name = "DINO__Player"

    Set cactus = s.Shapes.AddShape(msoShapeRectangle, Inches(FIELD_RIGHT), Inches(GROUND - 0.42), Inches(0.18), Inches(0.42))
    cactus.Name = "DINO__Obstacle"
    cactus.Fill.ForeColor.RGB = RGB(83, 83, 83)
    cactus.Line.Visible = msoFalse

    Set scoreBox = s.Shapes.AddTextbox(msoTextOrientationHorizontal, Inches(10.6), Inches(0.35), Inches(1.7), Inches(0.35))
    scoreBox.Name = "DINO__Score"
    scoreBox.TextFrame.TextRange.Font.Name = "Arial"
    scoreBox.TextFrame.TextRange.Font.Size = 18
    scoreBox.TextFrame.TextRange.Font.Color.RGB = RGB(83, 83, 83)
    scoreBox.Line.Visible = msoFalse
    scoreBox.Fill.Visible = msoFalse

    ResetRound
    running = True
    Randomize
    Do While running
        DoEvents
        TickGame
    Loop
End Sub

Private Sub TickGame()
    Dim frameStart As Single
    frameStart = Timer

    If KeyPressed(VK_R) Then
        ResetRound
    End If

    If (KeyPressed(VK_SPACE) Or KeyPressed(VK_UP)) And y >= GROUND - 0.41 Then
        vy = -0.19
    End If

    If KeyPressed(VK_DOWN) And y >= GROUND - 0.41 Then
        player.Height = Inches(0.22)
        player.Top = Inches(GROUND - 0.22)
    ElseIf y >= GROUND - 0.41 Then
        player.Height = Inches(0.40)
        player.Top = Inches(y)
    End If

    If vy <> 0 Or y < GROUND - 0.41 Then
        vy = vy + 0.009
        y = y + vy
        If y > GROUND - 0.41 Then
            y = GROUND - 0.41
            vy = 0
        End If
        player.Top = Inches(y)
    End If

    cactus.Left = cactus.Left - Inches(speed)
    If cactus.Left < Inches(0.25) Then
        cactus.Left = Inches(FIELD_RIGHT + 0.5 + Rnd() * 2.1)
        points = points + 10
        speed = speed + 0.006
    End If

    scoreBox.TextFrame.TextRange.Text = Format$(points, "00000")

    If cactus.Left < player.Left + player.Width - Inches(0.05) _
       And cactus.Left + cactus.Width > player.Left + Inches(0.05) _
       And player.Top + player.Height > cactus.Top + Inches(0.05) Then
        running = False
        MsgBox "GAME OVER!" & vbCrLf & "Pontuação: " & points & vbCrLf & "Pressione R para jogar novamente.", vbInformation, "Chrome Dino"
        WaitForR
        ResetRound
        running = True
    End If

    Do While Timer - frameStart < 0.016
        DoEvents
        If Timer < frameStart Then Exit Do
    Loop
End Sub

Private Function KeyPressed(ByVal keyCode As Long) As Boolean
    KeyPressed = (GetAsyncKeyState(keyCode) And &H8000) <> 0
End Function

Private Sub WaitForR()
    Do While Not KeyPressed(VK_R)
        DoEvents
    Loop
End Sub

Private Sub ResetRound()
    y = GROUND - 0.41
    vy = 0
    speed = 0.075
    points = 0
    If Not player Is Nothing Then
        player.Top = Inches(y)
        player.Height = Inches(0.40)
    End If
    If Not cactus Is Nothing Then
        cactus.Left = Inches(FIELD_RIGHT)
        cactus.Top = Inches(GROUND - 0.42)
    End If
End Sub

Public Sub StopChromeDino()
    running = False
End Sub
