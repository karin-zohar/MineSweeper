'use strict'
console.log('hello!')

const EMPTY = '?'
const MINE = '💣'
const MARKED = '🚩'
const LIFE = '💖'
var gBoard
var gDisplayBoard
var gGame
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
}



function resetGame() {
    gGame = {
        isOn: false,
        showCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: 3
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
    },100)
}

function onLevelBtn(levelBtn) {
    var size
    var mines
    console.log('level btn clicked')
    const level = levelBtn.dataset.level

    switch (level) {
        case 'beginner':
            size = 4
            mines = 2
            break;
        case 'medium':
            size = 8
            mines = 14
            break;
        case 'expert':
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
    if (!gGame.isOn) fillBoard(cellLocation)
    if (cellData.isMarked) {
        return
    }
    
    if (cellData.isMine) {
        if (cellData.isShown) return
        updateLives()
        // checkGameOver()
    }
    cellData.isShown = true
    if (cellData.minesAroundCount === 0 && !cellData.isMine) {
        const cellNegs = getNeighbors(cellLocation.i, cellLocation.j, gBoard) //returns array of neighbors
        expandShown(cellNegs)
    }
    
    gDisplayBoard = buildDisplayBoard()
    renderBoard(gDisplayBoard, '.board-container')
    checkGameOver(false)
}

function expandShown(cellNegs) {
    for (var i = 0; i < cellNegs.length; i++) {
        cellNegs[i].isShown = true
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
    if (!gGame.isOn && !cellData.isMarked) fillBoard(cellLocation)
    if (cellData.isShown) {
        return
    }
    cellData.isMarked = (cellData.isMarked) ? false : true
    // console.log('cellData: ', cellData)
    gDisplayBoard = buildDisplayBoard()
    renderCell(cellLocation, gDisplayBoard[cellLocation.i][cellLocation.j])
    checkGameOver(true)
}

function fillBoard(cellLocation) {
    gGame.isOn = true
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
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard.length; j++) {
                const cell = gBoard[i][j]
                if (!cell.isShown) {
                    if (cell.isMarked) {
                        continue
                    }
                    return
                }
            }
        }
        console.log('case 3')
        gameOver(true)
    }
        
    }



function gameOver(isVictory) {
    if (isVictory) {
        gGame.isOn = false
        console.log('You won!')
    } else {
        console.log('You lose')
    }
}


function updateLives() {
    gGame.lives--
    const elLives = document.querySelector('.lives')
    // console.log('elLives: ', elLives)
    var lives = LIFE.repeat(gGame.lives)
    // console.log('lives: ', lives)
    var strHTML = `LIVES: ${lives}`
    // console.log('strHTML: ', strHTML)
    elLives.innerHTML = strHTML
}