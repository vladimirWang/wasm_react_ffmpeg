import type { CellWalls, Pos } from '../mazeUtils/mazeGenerator';

// 并查集实现
class UnionFind2 {
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
 * @param maze 二维数组，每个元素是 CellWalls 对象，表示单元格的墙壁信息
 * @returns 如果连通返回 true，否则返回 false
 */
export function isConnected2(maze: CellWalls[][], start: Pos, end: Pos): boolean {
  if (!maze || maze.length === 0 || !maze[0] || maze[0].length === 0) {
    return false;
  }

  const rows = maze.length;
  const cols = maze[0].length;

  // 创建并查集，大小为 rows * cols
  const uf = new UnionFind2(rows * cols);

  // 遍历所有单元格，检查相邻单元格之间的连通性
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const currentIndex = getIndex(row, col, cols);
      const currentCell = maze[row][col];

      // 检查右侧邻居
      if (col < cols - 1) {
        const rightCell = maze[row][col + 1];
        // 如果当前单元格的右边没有墙，且右侧单元格的左边也没有墙，则连通
        if (currentCell.right === 0 && rightCell.left === 0) {
          const rightIndex = getIndex(row, col + 1, cols);
          uf.union(currentIndex, rightIndex);
        }
      }

      // 检查下方邻居
      if (row < rows - 1) {
        const bottomCell = maze[row + 1][col];
        // 如果当前单元格的下边没有墙，且下方单元格的上边也没有墙，则连通
        if (currentCell.bottom === 0 && bottomCell.top === 0) {
          const bottomIndex = getIndex(row + 1, col, cols);
          uf.union(currentIndex, bottomIndex);
        }
      }
    }
  }

  // 检查起点和终点是否在同一个连通分量中
  const startIndex = getIndex(0, 0, cols);
  const endIndex = getIndex(rows - 1, cols - 1, cols);

  return uf.connected(startIndex, endIndex);
}
