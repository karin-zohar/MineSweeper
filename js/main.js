'use strict'
console.log('hello!')

const WALL = '-'
const EMPTY = 'e'
const MINE = '💣'
const MARKED = '🚩'
var gBoard
var gDisplayBoard
var gGame
var gLevel


function onInit() {
    console.log('onInit good')
    resetGame()
    gLevel = onLevelBtn()
    gBoard = buildBoard()
    gDisplayBoard = buildDisplayBoard()
    renderBoard(gDisplayBoard, '.board-container')
}



function resetGame() {
    gGame = {
        isOn: false,
        showCount: 0,
        markedCount: 0,
        secsPassed: 0
    }
}

// function updateScore()

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
        if (gLatestNum === (gNumOfRows ** 2)) {
            clearInterval(timerInterval)
        }
        gGame.secsPassed = currTime
    })
}

function onLevelBtn() {
    gLevel = {
        size: 4,
        mines: 2
    }
    return gLevel
}

function onCell(cell) {
    // console.log('cell clicked!')
    var cellLocation = { i: cell.dataset.i, j: cell.dataset.j }
    var cellData = gBoard[cellLocation.i][cellLocation.j]
    if (!gGame.isOn) fillBoard(cellLocation)
    if (cellData.isMarked) {
        return
    }
    cellData.isShown = true
    // console.log('cellData: ', cellData)
    gDisplayBoard = buildDisplayBoard()
    // console.log('gDisplayBoard: ', gDisplayBoard)
    renderCell(cellLocation, gDisplayBoard[cellLocation.i][cellLocation.j])



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
    if (!gGame.isOn) fillBoard(cellLocation)
    if (cellData.isShown) {
        return
    }
    cellData.isMarked = (cellData.isMarked) ? false : true
    // console.log('cellData: ', cellData)
    gDisplayBoard = buildDisplayBoard()
    renderCell(cellLocation, gDisplayBoard[cellLocation.i][cellLocation.j])
    checkGameOver()
}

function fillBoard(cellLocation) {
    gGame.isOn = true
    startTimer()
    addMines(cellLocation)
    // gBoard[0][3].isMine = true
    // console.log('added mines')
    setMinesNegsCount(gBoard)
    // console.log('added MinesNegsCount')
}

function checkGameOver() {
    for (var i =0; i < gGame.mineLocations.length; i++) {
        const mineLocation = gGame.mineLocations[i]
        // console.log('mineLocation: ', mineLocation)
        const mineCell = gBoard[mineLocation.i][mineLocation.j]
        // console.log('mineCell: ', mineCell)
        if (!mineCell.isMarked) return false
    }
    gameOver(true)
}

function gameOver(isVictory) {
    if (isVictory) {
        console.log('You won!')
    } else {
        console.log('You lose')
    }
}