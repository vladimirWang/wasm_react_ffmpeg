// 定义单元格类型
export type CellWalls = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

// 定义位置类型
export type Pos = { 
  x: number, 
  y: number 
}

// 生成 n×n 的随机方形迷宫
export const generateRandomMaze = (n: number): CellWalls[][] => {
  if (n <= 0) {
    return [];
  }

  const maze: CellWalls[][] = [];

  // 生成 n×n 的迷宫
  for (let row = 0; row < n; row++) {
    const rowData: CellWalls[] = [];
    
    for (let col = 0; col < n; col++) {
      // 随机生成每个单元格的墙壁
      // 0 表示没有墙，1 表示有墙
      const cell: CellWalls = {
        top: Math.random() > 0.5 ? 1 : 0,
        right: Math.random() > 0.5 ? 1 : 0,
        bottom: Math.random() > 0.5 ? 1 : 0,
        left: Math.random() > 0.5 ? 1 : 0,
      };

      // 边界处理：确保外边界有墙
      if (row === 0) {
        cell.top = 1; // 第一行的上边必须有墙
      }
      if (row === n - 1) {
        cell.bottom = 1; // 最后一行的下边必须有墙
      }
      if (col === 0) {
        cell.left = 1; // 第一列的左边必须有墙
      }
      if (col === n - 1) {
        cell.right = 1; // 最后一列的右边必须有墙
      }

      rowData.push(cell);
    }
    
    maze.push(rowData);
  }

  return maze;
};
