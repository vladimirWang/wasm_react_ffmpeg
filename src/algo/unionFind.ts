// 并查集实现
class UnionFind {
  private parent: number[];
  private rank: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
  }

  // 查找根节点，带路径压缩
  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // 路径压缩
    }
    return this.parent[x];
  }

  // 合并两个集合
  union(x: number, y: number): void {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return;

    // 按秩合并
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }
  }

  // 检查两个元素是否在同一个集合中
  connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }
}

/**
 * 将二维坐标转换为一维索引
 */
function getIndex(row: number, col: number, cols: number): number {
  return row * cols + col;
}

/**
 * 检查从 [0,0] 到 [length-1, length-1] 是否连通
 * @param maze 二维数组，0表示通道，1表示墙
 * @returns 如果连通返回 true，否则返回 false
 */
export function isConnected(maze: number[][]): boolean {
  if (!maze || maze.length === 0 || !maze[0] || maze[0].length === 0) {
    return false;
  }

  const rows = maze.length;
  const cols = maze[0].length;

  // 检查起点和终点是否为通道（0）
  if (maze[0][0] !== 0 || maze[rows - 1][cols - 1] !== 0) {
    return false;
  }

  // 创建并查集，大小为 rows * cols
  const uf = new UnionFind(rows * cols);

  // 方向数组：上、右、下、左
  const directions = [
    [-1, 0], // 上
    [0, 1],  // 右
    [1, 0],  // 下
    [0, -1]  // 左
  ];

  // 遍历所有单元格
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // 如果当前单元格是墙，跳过
      if (maze[row][col] !== 0) {
        continue;
      }

      const currentIndex = getIndex(row, col, cols);

      // 检查四个方向的相邻单元格
      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;

        // 检查边界
        if (
          newRow >= 0 &&
          newRow < rows &&
          newCol >= 0 &&
          newCol < cols &&
          maze[newRow][newCol] === 0 // 相邻单元格也是通道
        ) {
          const neighborIndex = getIndex(newRow, newCol, cols);
          // 合并当前单元格和相邻通道单元格
          uf.union(currentIndex, neighborIndex);
        }
      }
    }
  }

  // 检查起点和终点是否在同一个连通分量中
  const startIndex = getIndex(0, 0, cols);
  const endIndex = getIndex(rows - 1, cols - 1, cols);

  return uf.connected(startIndex, endIndex);
}
