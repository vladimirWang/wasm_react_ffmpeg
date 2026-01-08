import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';

// const mazeData = [
//   [0, 1, 0, 0, 0, 1, 0],
//   [0, 1, 1, 1, 0, 1, 0],
//   [0, 0, 0, 1, 0, 0, 0],
//   [1, 1, 0, 1, 1, 1, 0],
//   [0, 0, 0, 0, 0, 1, 1],
//   [0, 0, 0, 0, 0, 0, 0],
// ]
const mazeData = [
  [{
    top: 0,
    right: 1,
    bottom: 0,
    left: 0
  }, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }],
  [{
    top: 0,
    right: 1,
    bottom: 0,
    left: 0
  }, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }], [{
    top: 0,
    right: 1,
    bottom: 0,
    left: 0
  }, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }]
]


// 定义单元格类型
type CellWalls = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

// 渲染单个单元格的墙壁
const renderCellWalls = (
  cell: CellWalls,
  x: number,
  y: number,
  cellSize: number,
  rowIndex: number,
  colIndex: number
) => {
  const walls: ReactElement[] = [];
  const wallColor = 'black';
  const wallWidth = 2;

  // 上墙 (top)
  if (cell.top === 1) {
    walls.push(
      <Line
        key={`${rowIndex}-${colIndex}-top`}
        points={[x, y, x + cellSize, y]}
        stroke={wallColor}
        strokeWidth={wallWidth}
      />
    );
  }

  // 右墙 (right)
  if (cell.right === 1) {
    walls.push(
      <Line
        key={`${rowIndex}-${colIndex}-right`}
        points={[x + cellSize, y, x + cellSize, y + cellSize]}
        stroke={wallColor}
        strokeWidth={wallWidth}
      />
    );
  }

  // 下墙 (bottom)
  if (cell.bottom === 1) {
    walls.push(
      <Line
        key={`${rowIndex}-${colIndex}-bottom`}
        points={[x, y + cellSize, x + cellSize, y + cellSize]}
        stroke={wallColor}
        strokeWidth={wallWidth}
      />
    );
  }

  // 左墙 (left)
  if (cell.left === 1) {
    walls.push(
      <Line
        key={`${rowIndex}-${colIndex}-left`}
        points={[x, y, x, y + cellSize]}
        stroke={wallColor}
        strokeWidth={wallWidth}
      />
    );
  }

  return walls;
};

const MazeCanvas = () => {
  // 暂存区：按行存储数据，pendingData[rowIndex][colIndex] = cellData
  const [pendingData, setPendingData] = useState<Map<number, Map<number, CellWalls>>>(new Map());
  // 已完整加载并可以渲染的行
  const [renderedRows, setRenderedRows] = useState<number[]>([]);
  const cellSize = 50;

  // 将暂存的行数据标记为可渲染
  const markRowAsRendered = (rowIndex: number) => {
    setRenderedRows((prev: number[]) => {
      if (!prev.includes(rowIndex)) {
        return [...prev, rowIndex];
      }
      return prev;
    });
  };

  // 镜像加载逻辑
  useEffect(() => {
    const loadMirrorData = async () => {
      // 初始化暂存区
      const tempPendingData = new Map<number, Map<number, CellWalls>>();

      // 辅助函数：检查某一行是否完整（基于临时数据）
      const checkRowComplete = (rowIndex: number, data: Map<number, Map<number, CellWalls>>): boolean => {
        if (!mazeData[rowIndex]) return false;
        const expectedColCount = mazeData[rowIndex].length;
        const rowData = data.get(rowIndex);
        if (!rowData) return false;
        return rowData.size === expectedColCount;
      };

      // 辅助函数：加载单元格对 (x, y) 和镜像 (y, x)
      const loadCellPair = async (
        x: number,
        y: number,
        data: Map<number, Map<number, CellWalls>>,
        checkComplete: (rowIndex: number, data: Map<number, Map<number, CellWalls>>) => boolean,
        markRendered: (rowIndex: number) => void
      ) => {
        // 加载 (x, y) 的数据
        const cellXY = mazeData[x]?.[y];
        if (cellXY) {
          if (!data.has(x)) {
            data.set(x, new Map());
          }
          data.get(x)!.set(y, cellXY);
          console.log(`加载 (${x}, ${y}):`, cellXY);

          // 同时加载镜像位置 (y, x) 的数据（如果存在且不同）
          if (y !== x && mazeData[y]?.[x]) {
            const cellYX = mazeData[y][x];
            if (!data.has(y)) {
              data.set(y, new Map());
            }
            data.get(y)!.set(x, cellYX);
            console.log(`镜像加载 (${y}, ${x}):`, cellYX);
          }

          // 检查 x 行是否完整
          if (checkComplete(x, data)) {
            console.log(`行 ${x} 数据完整，准备渲染`);
            markRendered(x);
          }

          // 检查 y 行是否完整（如果 y !== x）
          if (y !== x && checkComplete(y, data)) {
            console.log(`行 ${y} 数据完整，准备渲染`);
            markRendered(y);
          }

          // 模拟加载延迟
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      };

      // 优化：双向遍历，从两端向中间靠拢，只遍历一半
      // 利用镜像特性：加载 (x, y) 时自动加载 (y, x)，所以只需遍历上三角或下三角
      const totalRows = mazeData.length;
      const midRow = Math.floor(totalRows / 2);

      // 从头部和尾部同时向中间遍历
      for (let i = 0; i <= midRow; i++) {
        const forwardX = i;
        const backwardX = totalRows - 1 - i;
        
        // 处理每一行的所有列（双向遍历列）
        const rowsToProcess = backwardX !== forwardX ? [forwardX, backwardX] : [forwardX];
        // debugger;
        for (const x of rowsToProcess) {
          const row = mazeData[x];
          if (!row) continue;
          
          const rowLength = row.length;
          const midCol = Math.floor(rowLength / 2);

          // 从列的头部和尾部同时向中间遍历
          for (let j = 0; j <= midCol; j++) {
            const forwardY = j;
            const backwardY = rowLength - 1 - j;

            // 加载正向位置 (x, forwardY) 和镜像位置 (forwardY, x)
            await loadCellPair(x, forwardY, tempPendingData, checkRowComplete, markRowAsRendered);

            // 如果不是同一位置，加载反向位置 (x, backwardY) 和镜像位置 (backwardY, x)
            if (forwardY !== backwardY) {
              await loadCellPair(x, backwardY, tempPendingData, checkRowComplete, markRowAsRendered);
            }
          }
        }

        // 批量更新状态，减少 render 次数（每处理完一对行后更新一次）
        setPendingData(new Map(tempPendingData));
      }
    };

    loadMirrorData();
  }, []);

  // 一次性渲染所有已完整加载的行
  const renderAllCells = () => {
    const elements: ReactElement[] = [];

    // 只渲染已完整加载的行
    renderedRows.forEach((rowIndex: number) => {
      const rowData = pendingData.get(rowIndex);
      if (!rowData) return;

      // 遍历该行的所有列
      rowData.forEach((cell: CellWalls, colIndex: number) => {
        const x = colIndex * cellSize;
        const y = rowIndex * cellSize;

        // 渲染单元格背景（可选）
        elements.push(
          <Rect
            key={`cell-${rowIndex}-${colIndex}`}
            x={x}
            y={y}
            width={cellSize}
            height={cellSize}
            fill="white"
            stroke="#e0e0e0"
            strokeWidth={1}
          />
        );

        // 渲染单元格的墙壁
        const walls = renderCellWalls(cell, x, y, cellSize, rowIndex, colIndex);
        elements.push(...walls);
      });
    });

    return elements;
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight} style={{ backgroundColor: '#f0f0f0' }}>
      <Layer>
        {renderAllCells()}
      </Layer>
    </Stage>
  );
};

export default MazeCanvas;
