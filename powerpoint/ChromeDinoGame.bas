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

' Coordenadas do campo em polegadas.
Private Const GROUND As Single = 5.45
Private Const PLAYER_X As Single = 1.45
Private Const FIELD_RIGHT As Single = 12#

Private running As Boolean
Private y As Single
Private vy As Single
Private gameSpeed As Single
Private points As Long

Private player As Shape
Private cactus As Shape
Private scoreBox As Shape
Private groundLine As Shape
Private basePath As String

' Converte polegadas em pontos do PowerPoint (72 pontos = 1 polegada).
Private Function ToPoints(ByVal inches As Single) As Single
    ToPoints = inches * 72!
End Function

Public Sub StartChromeDino()
    Dim s As Slide
    Dim sh As Shape
    Dim spritePath As String

    If ActivePresentation.Path = "" Then
        MsgBox "Salve primeiro a apresentação na pasta do pacote extraído.", vbExclamation, "Chrome Dino"
        Exit Sub
    End If

    basePath = ActivePresentation.Path & "\assets\"
    spritePath = basePath & "dino-run-1.png"

    If Dir$(spritePath) = "" Then
        MsgBox "Não encontrei o arquivo:" & vbCrLf & spritePath & vbCrLf & _
               "Extraia a pasta assets do pacote e mantenha-a ao lado da apresentação.", _
               vbExclamation, "Chrome Dino"
        Exit Sub
    End If

    If ActivePresentation.Slides.Count = 0 Then
        MsgBox "A apresentação não possui slides.", vbExclamation, "Chrome Dino"
        Exit Sub
    End If

    Set s = ActivePresentation.Slides(1)

    ' Remove somente os objetos criados por este jogo.
    On Error Resume Next
    For Each sh In s.Shapes
        If Left$(sh.Name, 6) = "DINO__" Then sh.Delete
    Next sh
    On Error GoTo 0

    Set groundLine = s.Shapes.AddShape(msoShapeRectangle, ToPoints(0.55), _
        ToPoints(GROUND + 0.43), ToPoints(12.2), ToPoints(0.025))
    groundLine.Name = "DINO__Ground"
    groundLine.Fill.ForeColor.RGB = RGB(83, 83, 83)
    groundLine.Line.Visible = msoFalse

    Set player = s.Shapes.AddPicture(spritePath, msoFalse, msoTrue, _
        ToPoints(PLAYER_X), ToPoints(GROUND - 0.4), ToPoints(0.37), ToPoints(0.4))
    player.Name = "DINO__Player"

    Set cactus = s.Shapes.AddShape(msoShapeRectangle, ToPoints(FIELD_RIGHT), _
        ToPoints(GROUND - 0.42), ToPoints(0.18), ToPoints(0.42))
    cactus.Name = "DINO__Obstacle"
    cactus.Fill.ForeColor.RGB = RGB(83, 83, 83)
    cactus.Line.Visible = msoFalse

    Set scoreBox = s.Shapes.AddTextbox(msoTextOrientationHorizontal, _
        ToPoints(10.6), ToPoints(0.35), ToPoints(1.7), ToPoints(0.35))
    scoreBox.Name = "DINO__Score"
    scoreBox.TextFrame.TextRange.Font.Name = "Arial"
    scoreBox.TextFrame.TextRange.Font.Size = 18
    scoreBox.TextFrame.TextRange.Font.Color.RGB = RGB(83, 83, 83)
    scoreBox.Line.Visible = msoFalse
    scoreBox.Fill.Visible = msoFalse

    Randomize
    ResetRound
    running = True

    Do While running
        DoEvents
        TickGame
    Loop
End Sub

Private Sub TickGame()
    Dim frameStart As Single
    frameStart = Timer

    If KeyPressed(VK_R) Then ResetRound

    If (KeyPressed(VK_SPACE) Or KeyPressed(VK_UP)) And y >= GROUND - 0.41 Then
        vy = -0.19
    End If

    If KeyPressed(VK_DOWN) And y >= GROUND - 0.41 Then
        player.Height = ToPoints(0.22)
        player.Top = ToPoints(GROUND - 0.22)
    ElseIf y >= GROUND - 0.41 Then
        player.Height = ToPoints(0.4)
        player.Top = ToPoints(y)
    End If

    If vy <> 0 Or y < GROUND - 0.41 Then
        vy = vy + 0.009
        y = y + vy

        If y > GROUND - 0.41 Then
            y = GROUND - 0.41
            vy = 0
        End If

        player.Top = ToPoints(y)
    End If

    cactus.Left = cactus.Left - ToPoints(gameSpeed)

    If cactus.Left < ToPoints(0.25) Then
        cactus.Left = ToPoints(FIELD_RIGHT + 0.5 + Rnd() * 2.1)
        points = points + 10
        gameSpeed = gameSpeed + 0.006
    End If

    scoreBox.TextFrame.TextRange.Text = Format$(points, "00000")

    If cactus.Left < player.Left + player.Width - ToPoints(0.05) _
       And cactus.Left + cactus.Width > player.Left + ToPoints(0.05) _
       And player.Top + player.Height > cactus.Top + ToPoints(0.05) Then

        running = False
        MsgBox "GAME OVER!" & vbCrLf & "Pontuação: " & points & _
               vbCrLf & "Pressione R para jogar novamente.", _
               vbInformation, "Chrome Dino"

        WaitForR
        ResetRound
        running = True
    End If

    ' Limita aproximadamente a atualização a 60 quadros por segundo.
    Do While Timer - frameStart < 0.016
        DoEvents
        If Timer < frameStart Then Exit Do
    Loop
End Sub

Private Function KeyPressed(ByVal keyCode As Long) As Boolean
    KeyPressed = (GetAsyncKeyState(keyCode) < 0)
End Function

Private Sub WaitForR()
    Do While Not KeyPressed(VK_R)
        DoEvents
    Loop
End Sub

Private Sub ResetRound()
    y = GROUND - 0.41
    vy = 0
    gameSpeed = 0.075
    points = 0

    If Not player Is Nothing Then
        player.Top = ToPoints(y)
        player.Height = ToPoints(0.4)
    End If

    If Not cactus Is Nothing Then
        cactus.Left = ToPoints(FIELD_RIGHT)
        cactus.Top = ToPoints(GROUND - 0.42)
    End If
End Sub

Public Sub StopChromeDino()
    running = False
End Sub
