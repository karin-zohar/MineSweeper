'use strict'
console.log('hello!')

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
var gLeaderBoardLength = 2

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
        isHintMode: false
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
            // console.log(cellData)

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

function createCellData(i, j) {
    var cellData = {
        location: {
            i: i,
            j: j
        },

        isShown: false,
        isMine: false,
        isMarked: false,
        isWall: false
    }
    return cellData
}

function hideStartGameBtn() {
    var elStartGameBtn = document.querySelector('.start-game')
    console.log('elStartGameBtn: ', elStartGameBtn)
    elStartGameBtn.classList.add('hide')
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
    // console.log('level btn clicked')
    const level = levelBtn.dataset.level
    const elBoardContainer = document.querySelector('.board-container')
    console.log('elBoardContainer: ', elBoardContainer)

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
    // console.log('elCell: ', elCell)
    var cellLocation = { i: elCell.dataset.i, j: elCell.dataset.j }
    var cellData = gBoard[cellLocation.i][cellLocation.j]
    if (!gGame.isOn) startGame(cellLocation)
    if (cellData.isMarked || cellData.isShown) {
        return
    }
    gGame.showCount++
    
    if (cellData.isMine) {
        if (cellData.isShown) return
        updateLives(1)
    }

    cellData.isShown = true
    if (gGame.isHintMode) {
        cellData.isShown = true
        console.log('gBoard: ', gBoard[3][0])
        gDisplayBoard = buildDisplayBoard()
        renderBoard(gDisplayBoard, '.board-container')
        setTimeout(() => {
            cellData.isShown = false
            console.log('gBoard: ', gBoard[3][0])
            gGame.showCount--
            gDisplayBoard = buildDisplayBoard()
            renderBoard(gDisplayBoard, '.board-container')
        }, 5000);
    }

    if (cellData.minesAroundCount === 0 && !cellData.isMine) {
        const cellNegs = getNeighbors(cellLocation.i, cellLocation.j, gBoard) //returns array of neighbors
        expandShown(cellNegs)
    }

    gDisplayBoard = buildDisplayBoard()
    // console.log('gBoard - right before render: ', gBoard[3][0])
    renderBoard(gDisplayBoard, '.board-container')
    checkGameOver(false)
    // console.log('gGame: ', gGame)
}



function expandShown(cellNegs) {
    for (var i = 0; i < cellNegs.length; i++) {
        if (!cellNegs[i].isMine && !cellNegs[i].isMarked && !cellNegs[i].isShown) {
            cellNegs[i].isShown = true
            gGame.showCount++
        }
    }
}

function addMines(firstCellLocation) {
    gGame.mineLocations = []
    for (var i = 0; i < gLevel.mines; i++) {
        var minePosition = (getRandomPos(gBoard))
        // console.log('minePosition: ', minePosition)
        //preventing the first clicked cell from containing a mine
        while (minePosition.i === firstCellLocation.i &&
            minePosition.j === firstCellLocation.j) {
            minePosition = (getRandomPos(gBoard))
        }
        const cellData = gBoard[minePosition.i][minePosition.j]
        cellData.isMine = true
        gGame.mineLocations.push(cellData.location)
        // console.log('gGame.mineLocations: ', gGame.mineLocations)
    }
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            const cellData = board[i][j]
            // console.log('cellData before: ', cellData)
            cellData.minesAroundCount = countNeighbors(i, j, board, 'isMine', true)
            // console.log('cellData after: ', cellData)
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
    // cellData.isMarked = (cellData.isMarked) ? false : true
    if (cellData.isMarked) {
        cellData.isMarked = false
        gGame.markedCount--
    } else {
        cellData.isMarked = true
        gGame.markedCount++
    }
    // console.log('cellData: ', cellData)
    gDisplayBoard = buildDisplayBoard()
    renderCell(cellLocation, gDisplayBoard[cellLocation.i][cellLocation.j])
    checkGameOver(true)
}

function startGame(cellLocation) {
    gGame.isOn = true
    gGame.isStarted = true
    handleElements()
    startTimer()
    addMines(cellLocation)
    setMinesNegsCount(gBoard)
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
        console.log('case 2')
        gameOver(true)
    } else {
        //user ran out of lives - lose
        if (gGame.lives === 0) {
            console.log('case 1')
            gameOver(false)
            return
        }
        // user revealed the entire board, lives > 0  - win
        if (gGame.showCount + gGame.markedCount === gLevel.size ** 2) {
            console.log('case 3')
            gameOver(true)

        }
    }

}

function gameOver(isVictory) {
    gGame.isOn = false
    gGame.isVictory = isVictory
    handleModal()
    handleSmiley()
    handleElements()
    if (isVictory) {
        console.log('You won!')
        storeLastScore()
        createLeaderBoard()
    }
    console.log('gResults.length: ', gResults.length)
    console.log('gLeaderBoardLength: ', gLeaderBoardLength)
    if (gResults.length >= gLeaderBoardLength) {
        console.log('making leaderboard')
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
    // console.log('elModal: ', elModal) 
    var msg = (gGame.isVictory) ? 'You Win! 🏆' : 'Sorry, you blew up 💀'
    elModal.innerHTML = msg

}

function handleElements() {
    const elTopInfoContainer = document.querySelector('.top-info-container')
    const elLevelBtnsContainer = document.querySelector('.level-btns-container')
    const elModalContainer = document.querySelector('.modal-container')
    handleSmiley()

    if (gGame.isOn) {
        elLevelBtnsContainer.classList.add('hide')
        elTopInfoContainer.classList.remove('hide')
    } else if (gGame.showCount === 0 && gGame.markedCount === 0) {
        elLevelBtnsContainer.classList.remove('hide')
        elModalContainer.classList.add('hide')
    }
    if (!gGame.isOn && gGame.showCount > 0) {
        elModalContainer.classList.remove('hide')
    }
    
}

function onHint(elHint) {
    gGame.isHintMode = true
    elHint.classList.add('hint-clicked')
    const elCells = document.querySelectorAll('.cell')
    // console.log('elCells: ', elCells)
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
    var leaders = gResults.slice(0,gLeaderBoardLength)
    // console.log('leaders: ', leaders)
    for (var i = 0; i < gLeaderBoardLength; i++) {
        leaderBoard.push([])
        leaderBoard[i][0] = i+1
        leaderBoard[i][1] = leaders[i].nickname
        leaderBoard[i][2] = leaders[i].score
    }
    // console.log('leaderBoard: ', leaderBoard)
    renderLeaderBoard(leaderBoard,'.leaderboard-container')
}


function renderLeaderBoard(mat, selector) {
    var strHTML = '<table border="0"><tbody>'
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

    // console.log('strHTML: ', strHTML)
    const elContainer = document.querySelector(selector)
    elContainer.innerHTML = strHTML
    // console.log('elContainer: ', elContainer)
}

