import type { CellWalls } from './mazeGenerator';

// 生成n×n的完美迷宫（CellWalls结构）
export function generatePerfectMaze(n: number): CellWalls[][] {
  if (n <= 1) return [];

  // 1. 初始化：所有墙设为1（全墙），单元格标记为未访问
  const maze: CellWalls[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => ({ top: 1, right: 1, bottom: 1, left: 1 }))
  );
  const visited: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

  // 2. 随机选起点（比如(0,0)），标记为已访问
  const startRow = 0, startCol = 0;
  visited[startRow][startCol] = true;
  // 存储“待扩展的墙”（格式：[当前行, 当前列, 方向（0=上/1=右/2=下/3=左）]）
  const walls: [number, number, number][] = [];

  // 3. 初始化起点的相邻墙
  const addWalls = (row: number, col: number) => {
    // 上
    if (row > 0) walls.push([row, col, 0]);
    // 右
    if (col < n - 1) walls.push([row, col, 1]);
    // 下
    if (row < n - 1) walls.push([row, col, 2]);
    // 左
    if (col > 0) walls.push([row, col, 3]);
  };
  addWalls(startRow, startCol);

  // 4. 随机扩展墙，生成完美迷宫
  while (walls.length > 0) {
    // 随机选一个待扩展的墙
    const randomIdx = Math.floor(Math.random() * walls.length);
    const [row, col, dir] = walls.splice(randomIdx, 1)[0];

    // 计算墙对面的单元格
    let neighborRow = row, neighborCol = col;
    switch (dir) {
      case 0: neighborRow = row - 1; break; // 上
      case 1: neighborCol = col + 1; break; // 右
      case 2: neighborRow = row + 1; break; // 下
      case 3: neighborCol = col - 1; break; // 左
    }

    // 若对面单元格未访问，则打通这堵墙
    if (!visited[neighborRow][neighborCol]) {
      // 打通当前单元格的墙
      switch (dir) {
        case 0: maze[row][col].top = 0; break;
        case 1: maze[row][col].right = 0; break;
        case 2: maze[row][col].bottom = 0; break;
        case 3: maze[row][col].left = 0; break;
      }
      // 打通对面单元格的对应墙（保证共享墙一致）
      switch (dir) {
        case 0: maze[neighborRow][neighborCol].bottom = 0; break;
        case 1: maze[neighborRow][neighborCol].left = 0; break;
        case 2: maze[neighborRow][neighborCol].top = 0; break;
        case 3: maze[neighborRow][neighborCol].right = 0; break;
      }
      // 标记对面单元格为已访问，并添加其相邻墙
      visited[neighborRow][neighborCol] = true;
      addWalls(neighborRow, neighborCol);
    }
  }

  return maze;
}