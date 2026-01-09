import type { CellWalls, Pos } from "../mazeUtils/mazeGenerator";

// 并查集实现
class UnionFind2 {
  public parent: number[];
  private rank: number[];
  private confirmConnected: (x: number, y: number) => boolean;

  constructor(
    size: number,
    confirmConnected: (x: number, y: number) => boolean = (
      _x: number,
      _y: number
    ) => true
  ) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
    this.confirmConnected = confirmConnected;
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

    // 是否可联通入参修复，应该传入原始的x,y而不是rootX,rootY
    const cellIsConnected = this.confirmConnected(x, y);
    if (!cellIsConnected) {
      return;
    }
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

// 根据打平后的索引号查找元素信息
function getMazeCellByFlatternIndex(
  mazeData: CellWalls[][],
  index: number
): Pos | null {
  if (mazeData.length === 0) {
    return null;
  }
  const mazeSize = mazeData[0].length;
  const rowIdx = Math.floor(index / mazeSize);
  const colIdx = index % mazeSize;
  return {
    x: colIdx,
    y: rowIdx,
  };
}

/**
 * 检查 start 和 end 两个点是否连通
 * @param maze 二维数组，每个元素是 CellWalls 对象，表示单元格的墙壁信息
 * @param start 起始位置，Pos 类型 { x: number, y: number }，x 是列，y 是行
 * @param end 结束位置，Pos 类型 { x: number, y: number }，x 是列，y 是行
 * @returns 如果连通返回 true，否则返回 false
 */
export function isConnected2(
  maze: CellWalls[][],
  start: Pos,
  end: Pos
): boolean {
  if (!maze || maze.length === 0 || !maze[0] || maze[0].length === 0) {
    return false;
  }

  const rows = maze.length;
  const cols = maze[0].length;

  // 验证 start 和 end 是否在有效范围内
  if (
    start.y < 0 ||
    start.y >= rows ||
    start.x < 0 ||
    start.x >= cols ||
    end.y < 0 ||
    end.y >= rows ||
    end.x < 0 ||
    end.x >= cols
  ) {
    return false;
  }
  // 创建并查集，大小为 rows * cols
  // n1,n2的顺序是二维数组中的由左至右，由上至下
  const uf = new UnionFind2(rows * cols, (n1: number, n2: number) => {
    const data1 = getMazeCellByFlatternIndex(maze, n1);
    if (!data1) return false;
    const { x: x1, y: y1 } = data1;
    const data2 = getMazeCellByFlatternIndex(maze, n2);
    if (!data2) return false;
    const { x: x2, y: y2 } = data2;
    const cell1 = maze[y1][x1];
    const cell2 = maze[y2][x2];
    // 如果两个元素处于一行，则进行连通性判断，否则如果mazeSize长度不等于1，直接判false
    if (y1 === y2) {
      return cell1.right === 0 && cell2.left === 0;
    }
    if (x1 === x2) {
      return cell1.bottom === 0 && cell2.top === 0;
    }
    const mazeSize = maze.length;
    return mazeSize === 1;
  });

  // 遍历所有单元格，检查相邻单元格之间的连通性
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const currentIndex = getIndex(row, col, cols);

      // 检查右侧邻居
      if (col < cols - 1) {
        // 如果当前单元格的右边没有墙，且右侧单元格的左边也没有墙，则连通
        const rightIndex = getIndex(row, col + 1, cols);
        uf.union(currentIndex, rightIndex);
      }

      // 检查下方邻居
      if (row < rows - 1) {
        // 如果当前单元格的下边没有墙，且下方单元格的上边也没有墙，则连通
        const bottomIndex = getIndex(row + 1, col, cols);
        uf.union(currentIndex, bottomIndex);
      }
    }
  }

  // 检查起点和终点是否在同一个连通分量中
  const startIndex = getIndex(start.y, start.x, cols);
  const endIndex = getIndex(end.y, end.x, cols);
  return uf.connected(startIndex, endIndex);
}
