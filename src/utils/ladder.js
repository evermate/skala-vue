// 사다리타기(아미다쿠지) 생성/추적 로직. SVG 좌표 변환은 컴포넌트가 맡고, 여기서는 순수
// 데이터(가로줄 배치, 세로줄이 최종적으로 어디로 떨어지는지)만 다룬다.

// 같은 행(row)에 인접한 가로줄 두 개가 놓이면 그 행에서 한 칸이 두 번 움직이게 돼 추적이
// 꼬이므로, 직전에 놓은 가로줄과 최소 한 칸 이상 띄운다.
export function generateRungs(playerCount, rowCount) {
  const rungs = Array.from({ length: rowCount }, () => Array.from({ length: playerCount - 1 }, () => false))
  for (let r = 0; r < rowCount; r += 1) {
    let lastPlacedCol = -2
    for (let c = 0; c < playerCount - 1; c += 1) {
      if (c - lastPlacedCol < 2) continue
      if (Math.random() < 0.45) {
        rungs[r][c] = true
        lastPlacedCol = c
      }
    }
  }
  return rungs
}

export function traceColumn(rungs, playerCount, startCol) {
  let col = startCol
  const moves = []
  rungs.forEach((row, r) => {
    if (col > 0 && row[col - 1]) {
      moves.push({ row: r, toCol: col - 1 })
      col -= 1
    } else if (col < playerCount - 1 && row[col]) {
      moves.push({ row: r, toCol: col + 1 })
      col += 1
    }
  })
  return { start: startCol, end: col, moves }
}

export function traceAll(rungs, playerCount) {
  return Array.from({ length: playerCount }, (_, start) => traceColumn(rungs, playerCount, start))
}
