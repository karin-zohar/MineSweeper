'use strict'

const EMPTY = '?'
const MINE = '💣'
const MARKED = '🚩'
const LIFE = '💖'
const SMILEY = {
    normal: '😊',
    lose: '👻',
    win: '😎'
}
var gBoard
var gDisplayBoard
var gGame
var gResults = []
var gLeaderBoardLength = 5

//default level: beginner
var gLevel = {
    size: 4,
    mines: 2
}


function onInit() {
    resetGame()
    gBoard = buildBoard()
    gDisplayBoard = buildDisplayBoard()
    renderBoard(gDisplayBoard, '.board-container')
    updateLives(0)
    handleSmiley()
    handleElements()
}



function resetGame() {
    gGame = {
        isOn: false,
        isStarted: false,
        showCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: 3,
        isVictory: false,
        isHintMode: false,
        safeClicksLeft: 3,
        isManualMode: false,
        isNightMode: false,
        isMegaHintMode: false,
        megaHintAreaLimits: [],
        history: []
    }
}


function buildBoard() {
    const size = gLevel.size
    const board = []


    for (var i = 0; i < size; i++) {
        board.push([])
        for (var j = 0; j < size; j++) {
            const cell = createCellData(i, j)
            board[i][j] = cell
        }
    }
    return board
}

function buildDisplayBoard() {
    var displayBoard = []
    for (var i = 0; i < gLevel.size; i++) {
        displayBoard[i] = []
        for (var j = 0; j < gLevel.size; j++) {
            var cellData = gBoard[i][j]
            
            if (cellData.isShown) {
                displayBoard[i][j] = (cellData.isMine) ? MINE : cellData.minesAroundCount
            } else if (cellData.isMarked) {
                displayBoard[i][j] = MARKED
            } else {
                displayBoard[i][j] = EMPTY
            }
        }
    }
    return displayBoard
}

function updateBoard() {
    gDisplayBoard = buildDisplayBoard()
    renderBoard(gDisplayBoard, '.board-container')
}

function createCellData(i, j) {
    var cellData = {
        location: {
            i: i,
            j: j
        },

        isShown: false,
        isMine: false,
        isMarked: false,
    }
    return cellData
}

function startTimer() {
    var startTime = Date.now()
    const elTimer = document.querySelector('.timer')
    var timerInterval = setInterval(() => {
        const diff = Date.now() - startTime
        var currTime = (diff / 1000).toFixed(2)
        elTimer.innerText = currTime
        if (!gGame.isOn) {
            clearInterval(timerInterval)
        }
        gGame.secsPassed = currTime
    }, 100)
}

function onLevelBtn(levelBtn) {
    var size
    var mines
    const level = levelBtn.dataset.level
    const elBoardContainer = document.querySelector('.board-container')

    switch (level) {
        case 'beginner':
            elBoardContainer.classList.add('beginner')
            size = 4
            mines = 2
            break;
        case 'medium':
            elBoardContainer.classList.add('medium')
            size = 8
            mines = 14
            break;
        case 'expert':
            elBoardContainer.classList.add('expert')
            size = 12
            mines = 32
            break;
    }

    gLevel = {
        size: size,
        mines: mines
    }
    onInit()
}

function onCellClicked(elCell) {
    if (gGame.isMegaHintMode) return
    var cellLocation = { i: +elCell.dataset.i, j: +elCell.dataset.j }
    var cellData = gBoard[cellLocation.i][cellLocation.j]
    if (cellData.isMarked || cellData.isShown) {
        return
    }

    if (gGame.isManualMode) {
        ManuallyAddMine(elCell, cellData)
        return
    }
    if (!gGame.isOn || gDisplayBoard[0][0] === undefined) startGame(cellLocation)

    gGame.showCount++

    if (cellData.isMine && !gGame.isHintMode) {
        if (cellData.isShown) return
        updateLives(1)
    }

    cellData.isShown = true
    if (gGame.isHintMode) {
        cellData.isShown = true
        updateBoard()
        setTimeout(() => {
            cellData.isShown = false
            gGame.showCount--
            gDisplayBoard = buildDisplayBoard()
            renderBoard(gDisplayBoard, '.board-container')
        }, 5000);
    }

    if (cellData.minesAroundCount === 0 && !cellData.isMine) {
        cellData.isShown = true
        const cellNegs = getNeighbors(cellLocation.i, cellLocation.j, gBoard) //returns array of neighbors
        expandShown(cellNegs)
    }

    updateBoard()
    checkGameOver(false)
}



function expandShown(cellNegs) {
    if (gGame.isHintMode) { return }
    for (var i = 0; i < cellNegs.length; i++) {
        const cell = cellNegs[i]
        if (cell.minesAroundCount === 0 && !cell.isMine) {
            if (!cell.isMine && !cell.isMarked && !cell.isShown) {
                cell.isShown = true
                gGame.showCount++
                var nextCellNegs = getNeighbors(cell.location.i, cell.location.j, gBoard)
                expandShown(nextCellNegs)
            }
        }
    }
}

function addMines(firstCellLocation) {
    if (gGame.isManualMode) {
        return
    }
    gGame.mineLocations = []
    for (var i = 0; i < gLevel.mines; i++) {
        var minePosition = (getRandomPos(gBoard))
        //preventing the first clicked cell from containing a mine
        while (minePosition.i === firstCellLocation.i &&
            minePosition.j === firstCellLocation.j) {
            minePosition = (getRandomPos(gBoard))
        }
        const cellData = gBoard[minePosition.i][minePosition.j]
        cellData.isMine = true
        gGame.mineLocations.push(cellData.location)
    }
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            const cellData = board[i][j]
            cellData.minesAroundCount = countNeighbors(i, j, board, 'isMine', true)
        }
    }

}

function onMarkCell(cell) {
    var cellLocation = { i: cell.dataset.i, j: cell.dataset.j }
    var cellData = gBoard[cellLocation.i][cellLocation.j]
    if (!gGame.isOn && !cellData.isMarked) startGame(cellLocation)
    if (cellData.isShown) {
        return
    }
    if (cellData.isMarked) {
        cellData.isMarked = false
        gGame.markedCount--
    } else {
        cellData.isMarked = true
        gGame.markedCount++
    }
    gDisplayBoard = buildDisplayBoard()
    renderCell(cellLocation, gDisplayBoard[cellLocation.i][cellLocation.j])
    checkGameOver(true)
}

function startGame(cellLocation) {
    resetGame()
    gGame.isOn = true
    gGame.isStarted = true
    handleElements()
    if (gGame.secsPassed === 0) startTimer()
    storeGameHistory({ target: null })
    addMines(cellLocation)
    setMinesNegsCount(gBoard)
    resetSafeClickBtn()
}

function checkGameOver(isMarked) {
    if (isMarked) {
        for (var i = 0; i < gGame.mineLocations.length; i++) {
            const mineLocation = gGame.mineLocations[i]
            const mineCell = gBoard[mineLocation.i][mineLocation.j]
            if (mineCell.isShown) {
                continue
            } else if (!mineCell.isMarked) {
                return
            }
        }
        // user marked all the mines - win
        gameOver(true)
    } else {
        //user ran out of lives - lose
        if (gGame.lives === 0) {
            gameOver(false)
            return
        }
        // user revealed the entire board, lives > 0  - win
        if (gGame.showCount + gGame.markedCount === gLevel.size ** 2) {
            gameOver(true)

        }
    }

}

function gameOver(isVictory) {
    gGame.isOn = false
    gGame.isVictory = isVictory
    showAllCells()
    handleModal()
    handleSmiley()
    handleElements()
    deactivateCells()
    if (isVictory) {
        storeLastScore()
        createLeaderBoard()
    }
    if (gResults.length >= gLeaderBoardLength) {
        const elLeaderboardContainer = document.querySelector('.leaderboard-container')
        elLeaderboardContainer.classList.remove('hide')
        displayLeaderBoard()
    }
}

function updateLives(diff) {
    gGame.lives -= diff
    const elLives = document.querySelector('.lives')
    var lives = LIFE.repeat(gGame.lives)
    var strHTML = `LIVES: ${lives}`
    elLives.innerHTML = strHTML
}

function handleSmiley() {
    var elSmiley = document.querySelector('.smiley')
    if (gGame.isOn || !gGame.isStarted) {
        elSmiley.innerHTML = SMILEY.normal
    } else if (gGame.isVictory) {
        elSmiley.innerHTML = SMILEY.win
    } else {
        elSmiley.innerHTML = SMILEY.lose
    }
}

function handleModal() {
    const elModal = document.querySelector('.modal')
    var msg = (gGame.isVictory) ? 'You Win! 🏆' : 'Sorry, you blew up 💀'
    elModal.innerHTML = msg

}

function handleElements() {
    const elTopInfoContainer = document.querySelector('.top-info-container')
    const elTopInfoContainerTwo = document.querySelector('.top-info-container-two')
    const elLevelBtnsContainer = document.querySelector('.level-btns-container')
    const elModalContainer = document.querySelector('.modal-container')
    const elTimerContainer = document.querySelector('.timer-container')
    const elManualModeBtn = document.querySelector('.manual-mode-btn')
    const elExterminatorBtn = document.querySelector('.exterminator-btn')
    const elMegaHintContainer = document.querySelector('.mega-hint-container')

    handleSmiley()

    if (gGame.isOn) {
        elLevelBtnsContainer.classList.add('hide')
        elTopInfoContainer.classList.remove('hide')
        elTimerContainer.classList.remove('hide')
        elTopInfoContainerTwo.classList.remove('hide')
        elManualModeBtn.classList.add('hide')
        elExterminatorBtn.classList.remove('hide')
        elMegaHintContainer.classList.remove('hide')
    } else if (gGame.showCount === 0 && gGame.markedCount === 0) {
        elLevelBtnsContainer.classList.remove('hide')
        elModalContainer.classList.add('hide')
    }
    if (!gGame.isOn && gGame.showCount > 0) {
        elModalContainer.classList.remove('hide')
        elTimerContainer.classList.add('hide')
    }

}

function onHint(elHint) {
    gGame.isHintMode = true
    elHint.classList.add('hint-clicked')
    const elCells = document.querySelectorAll('.cell')
    for (var i = 0; i < elCells.length; i++) {
        const elCell = elCells[i]
        elCell.classList.add('hint-mode-cell')
    }
    setTimeout(() => {
        gGame.isHintMode = false
        elHint.classList.add('slow-hide')
        for (var i = 0; i < elCells.length; i++) {
            const elCell = elCells[i]
            elCell.classList.remove('hint-mode-cell')
        }
    }, 5000);
    setTimeout(() => {
        elHint.classList.add('hide')
    }, 6000);

}

function storeLastScore() {
    var nickname = prompt('Enter Nickname:')
    if (!nickname) nickname = 'anonymous'
    if (typeof (Storage) !== "undefined") {
        localStorage.setItem("nickname", nickname);
        localStorage.setItem("score", gGame.secsPassed);

    }
}

function createLeaderBoard() {
    var lastResult = { nickname: localStorage.getItem("nickname"), score: localStorage.getItem("score") }
    gResults.push(lastResult)
    gResults.sort((a, b) => a.score - b.score)
}

function displayLeaderBoard() {
    const leaderBoard = []
    var leaders = gResults.slice(0, gLeaderBoardLength)
    for (var i = 0; i < gLeaderBoardLength; i++) {
        leaderBoard.push([])
        leaderBoard[i][0] = i + 1
        leaderBoard[i][1] = leaders[i].nickname
        leaderBoard[i][2] = leaders[i].score
    }
    renderLeaderBoard(leaderBoard, '.leaderboard-container')
}


function renderLeaderBoard(mat, selector) {
    var strHTML = `<h3 class="leaderborad-title">leaderboard</h3>
    <table border="0"><tbody>`
    strHTML += `<tr><td class="leaderboard-cell heading">Place</td><td class="leaderboard-cell heading">nickname</td><td class="leaderboard-cell heading">score</td></tr>`
    for (var i = 0; i < mat.length; i++) {
        console.log('entered outer for loop')
        console.log('mat[0]: ', mat[0])

        strHTML += '<tr>'
        for (var j = 0; j < mat[0].length; j++) {
            console.log('entered inner for loop')
            const cell = mat[i][j]
            console.log('cell: ', cell)
            const className = `leaderboard-cell cell-${i}-${j}`

            strHTML += `<td class="${className}" =>${cell}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>'

    const elContainer = document.querySelector(selector)
    elContainer.innerHTML = strHTML
}

function deactivateCells() {
    const elCells = document.querySelectorAll('.cell')
    for (var i = 0; i < elCells.length; i++) {
        const elCell = elCells[i]
        elCell.classList.remove('active')
    }
}

function onSafeClick() {
    if (gGame.safeClicksLeft > 0) {
        gGame.safeClicksLeft--
        var safeCellPos = getEmptyPos()
        while (gBoard[safeCellPos.i][safeCellPos.j].isShown) {
            safeCellPos = getEmptyPos()
        }
        const elSafeCell = document.querySelector(`.cell-${safeCellPos.i}-${safeCellPos.j}`)
        elSafeCell.classList.add('safe-cell')
        setTimeout(() => {
            elSafeCell.classList.remove('safe-cell')
        }, 4000);
    }
    const onSafeClickBtn = document.querySelector('.safe-click-btn')
    onSafeClickBtn.innerHTML = gGame.safeClicksLeft
}

function resetSafeClickBtn() {
    const onSafeClickBtn = document.querySelector('.safe-click-btn')
    onSafeClickBtn.innerHTML = gGame.safeClicksLeft
}


function onManualModeBtn(elManualModeBtn) {
    elManualModeBtn.classList.toggle('manual-mode-on')
    gGame.isManualMode = !gGame.isManualMode
    const elCells = document.querySelectorAll('.cell')
    for (var i = 0; i < elCells.length; i++) {
        const elCell = elCells[i]
        elCell.classList.add('manual-mode')
    }
    if (gGame.isManualMode) {
        const elManualModeDoneBtn = document.querySelector('.manual-mode-done-btn')
        elManualModeDoneBtn.classList.remove('hide')
    }
}

function onManualModeDoneBtn(elManualModeDoneBtn) {
    gGame.isManualMode = !gGame.isManualMode
    //preventing addMines() from adding mines where the user didn't place them
    gLevel.mines = 0

    elManualModeDoneBtn.classList.add('hide')
    const elCells = document.querySelectorAll('.cell')
    for (var i = 0; i < elCells.length; i++) {
        const elCell = elCells[i]
        elCell.classList.remove('manual-mode')
        elCell.classList.remove('manual-mode-cell-clicked')
    }

    const elManualModeBtn = document.querySelector('.manual-mode-btn')
    elManualModeBtn.classList.add('hide')
}

function ManuallyAddMine(elCell, cellData) {
    elCell.classList.add('manual-mode-cell-clicked')
    cellData.isMine = true
}

function onNightMode(elNightModeBtn) {
    gGame.isNightMode = !gGame.isNightMode
    const elBody = document.querySelector('body')
    elBody.classList.toggle('night-mode-theme')
    var nightModeIcon = (gGame.isNightMode) ? '🌞' : '🌜'
    elNightModeBtn.innerHTML = nightModeIcon

}

function showAllCells() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            const cell = gBoard[i][j]
            cell.isShown = true
        }
    }
    updateBoard()
}


function storeGameHistory(ev) {
    if (!gGame.isOn) return
    const elUndoBtn = document.querySelector('.undo-btn')
    if (ev.target === elUndoBtn) return
    var currBoard = JSON.parse(JSON.stringify(gBoard))
    var currLives = gGame.lives
    var currState = { board: currBoard, lives: currLives }
    gGame.history.push(currState)
}

function onUndoBtn() {
    gGame.history.pop()
    const lastState = gGame.history[gGame.history.length - 1]
    gBoard = JSON.parse(JSON.stringify(lastState.board))
    gGame.lives = lastState.lives
    updateLives(0)
    updateBoard()
}


function onMegaHintBtn() {
    gGame.isMegaHintMode = true
}

function getMegaHintArea(elCell) {
    if (!gGame.isMegaHintMode) return
    var cellLocation = { cellI: +elCell.dataset.i, cellJ: +elCell.dataset.j }
    if (!gGame.isOn) startGame(cellLocation)
    const corners = gGame.megaHintAreaLimits
    corners.push(cellLocation)
    if (corners.length === 2) showMegaHintArea(corners)
}


function showMegaHintArea(corners) {
    const cornerA = corners[0]
    const cornerB = corners[1]
    const areaCells = []
    for (var i = cornerA.cellI; i <= cornerB.cellI; i++) {
        for (var j = cornerA.cellJ; j <= cornerB.cellJ; j++) {
            gBoard[i][j].isShown = true
            areaCells.push(gBoard[i][j])
            updateBoard()
        }
        setTimeout(() => {
            for (var i = 0; i < areaCells.length; i++) {
                areaCells[i].isShown = false
            }
            updateBoard()
        }, 2000);
    }
    gGame.isMegaHintMode = false
    const elMegaHintContainer = document.querySelector('.mega-hint-container')
    elMegaHintContainer.classList.add('hide')
}


function onExterminatorBtn() {
    const elExterminatorBtn = document.querySelector('.exterminator-btn')
    elExterminatorBtn.classList.add('hide')

    for (var i = 0; i < 3; i++) {
        if (gGame.mineLocations.length > 0) {
            const currMineLocation = gGame.mineLocations.pop()
            const cellData = gBoard[currMineLocation.i][currMineLocation.j]
            cellData.isMine = false
        } else return
    }
    setMinesNegsCount(gBoard)
    updateBoard()
}