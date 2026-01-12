import { ILayout } from "../pages/MazeCanvas";

// 定义单元格类型
export type CellWalls = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

// 定义位置类型, 不含像素信息，只有索引号
export type Pos = { 
  x: number, 
  y: number 
}

// 生成 n×n 的随机方形迷宫
export const generateRandomMaze = (n: ILayout): CellWalls[][] => {
  if (n.row <= 2 || n.col <= 2) {
    throw new Error('迷宫大小不能小于等于2')
  }

  const maze: CellWalls[][] = Array.from({ length: n.row }, () =>
    Array.from({ length: n.col }, () => ({
      top: 1,
      right: 1,
      bottom: 1,
      left: 1,
    }))
  );

  // 生成 n×n 的迷宫
  for (let row = 0; row < n.row; row++) {
    // const rowData: CellWalls[] = [];
    
    for (let col = 0; col < n.col; col++) {
      // 随机生成每个单元格的墙壁
      // 0 表示没有墙，1 表示有墙
      const current = maze[row][col]
      // 边界处理：确保外边界有墙
      if (row === 0) {
        current.top = 1; // 第一行的上边必须有墙
      }else if (row === n.row - 1) {
        current.bottom = 1; // 最后一行的下边必须有墙
      } else if (row < n.row-1) {
        // 随机决定当前单元格与下方单元格之间是否有墙
        const hasBottomWall = Math.random() > 0.5 ? 1 : 0;
        current.bottom = hasBottomWall;
        const bottomCell = maze[row + 1][col]
        bottomCell.top = hasBottomWall; // 同步下方单元格的顶部墙
      }
      if (col === 0) {
        current.left = 1; // 第一列的左边必须有墙
      } else if (col === n.col - 1) {
        current.right = 1; // 最后一列的右边必须有墙
      } else if (col < n.col-1) {
        // 随机决定当前单元格与右侧单元格之间是否有墙（0=无墙，1=有墙）
        const hasRightWall = Math.random() > 0.5 ? 1 : 0;
        current.right = hasRightWall;
        const rightCell = maze[row][col+1]
        rightCell.left = hasRightWall; // 同步右侧单元格的左侧墙
      }
    }
  }

  // 确保起点和终点不孤立
  const startRow = 0, startCol = 0;
  const endRow = n.row - 1, endCol = n.col - 1;
  // 起点至少开放右侧或下方（避免完全孤立）
  if (maze[startRow][startCol].right === 1 && maze[startRow][startCol].bottom === 1) {
    maze[startRow][startCol].right = 0;
    maze[startRow][startCol + 1].left = 0;
  }
  // 终点至少开放左侧或上方（避免完全孤立）
  if (maze[endRow][endCol].left === 1 && maze[endRow][endCol].top === 1) {
    maze[endRow][endCol].left = 0;
    maze[endRow][endCol - 1].right = 0;
  }

  return maze;
};