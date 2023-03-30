
// console.log('connected util')
//getrandint -exclusive
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

//getrandint -inclusive

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}


//renderCell
// location is an object like this - { i: 2, j: 7 }
function renderCell(location, value) {
    // Select the elCell and set the value
    const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)
    elCell.innerHTML = value
}

//countNeighbors

function countNeighbors(cellI, cellJ, mat, gameElement, checkValue) {
    var neighborsCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= mat[i].length) continue
            if (mat[i][j][gameElement] ===  checkValue) neighborsCount++
        }
    }
    return neighborsCount
}

function getNeighbors(cellI, cellJ, mat) {
    const neighbors = []
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= mat[i].length) continue
            neighbors.push(mat[i][j])
        }
    }
    return neighbors
}

//drawNum 
function drawNum(nums) {
    var randIdx = getRandomInt(0, nums.length)
    var num = nums[randIdx]
    nums.splice(randIdx, 1)
    return num
}

//getEmptyCell
function getEmptyPos() {
    const emptyPoss = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].type !== WALL && !gBoard[i][j].gameElement) {
                emptyPoss.push({ i, j })
            }
        }
    }

    const randIdx = getRandomInt(0, emptyPoss.length)
    return emptyPoss[randIdx]
}

function getRandomPos(board) {
    const i = getRandomInt(0,board.length)
    const j = getRandomInt(0, board[0].length)
    const randPos = {i,j}
    return randPos
}


//create mat
function createMat(ROWS, COLS) {
    const mat = []
    for (var i = 0; i < ROWS; i++) {
        const row = []
        for (var j = 0; j < COLS; j++) {
            row.push('')
        }
        mat.push(row)
    }
    return mat
}

// render board

function renderBoard(mat, selector) {

    var strHTML = '<table border="0"><tbody>'
    
    for (var i = 0; i < mat.length; i++) {

        strHTML += '<tr>'
        for (var j = 0; j < mat[0].length; j++) {

            const cell = mat[i][j]
            const className = `cell cell-${i}-${j}`

            strHTML += `<td data-i="${i}" data-j="${j}" class="${className}" onClick="onCellClicked(this)" oncontextmenu="onMarkCell(this)">${cell}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>'

    const elContainer = document.querySelector(selector)
    elContainer.innerHTML = strHTML
}

