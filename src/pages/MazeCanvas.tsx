import React, { useState } from 'react';
import type { ReactElement } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { generateRandomMaze, type CellWalls } from '../mazeUtils/mazeGenerator';

// 渲染单个单元格的墙壁
// 每个单元格只渲染右边框和下边框，避免相邻单元格共享边的重复渲染
// 边界处理：第一行需要渲染上边，第一列需要渲染左边
const RenderCellWalls = (
  cell: CellWalls,
  x: number,
  y: number,
  cellSize: number,
  rowIndex: number,
  colIndex: number,
  mazeSize: number
) => {
  const walls: ReactElement[] = [];
  const wallColor = 'black';
  const wallWidth = 2;

  // // 上墙 (top) - 只渲染第一行的上边框
  // if (rowIndex === 0 && cell.top === 1) {
  //   walls.push(
  //     <Line
  //       key={`${rowIndex}-${colIndex}-top`}
  //       points={[x, y, x + cellSize, y]}
  //       stroke={wallColor}
  //       strokeWidth={wallWidth}
  //     />
  //   );
  // }

  // 右墙 (right) - 渲染右边框
  if (cell.right === 1 && colIndex < mazeSize - 1) {
    walls.push(
      <Line
        key={`${rowIndex}-${colIndex}-right`}
        points={[x + cellSize, y, x + cellSize, y + cellSize]}
        stroke={wallColor}
        strokeWidth={wallWidth}
      />
    );
  }

  // 下墙 (bottom) - 渲染下边框
  if (cell.bottom === 1 && rowIndex < mazeSize - 1) {
    walls.push(
      <Line
        key={`${rowIndex}-${colIndex}-bottom`}
        points={[x, y + cellSize, x + cellSize, y + cellSize]}
        stroke={wallColor}
        strokeWidth={wallWidth}
      />
    );
  }

  // // 左墙 (left) - 只渲染第一列的左边框
  // if (colIndex === 0 && cell.left === 1) {
  //   walls.push(
  //     <Line
  //       key={`${rowIndex}-${colIndex}-left`}
  //       points={[x, y, x, y + cellSize]}
  //       stroke={wallColor}
  //       strokeWidth={wallWidth}
  //     />
  //   );
  // }

  return walls;
};
const cellSize = 50;
const defaultMazeSize = 10; // 默认迷宫大小

const MazeCanvas = () => {
  const [mazeSize, setMazeSize] = useState(defaultMazeSize);
  const [mazeData, setMazeData] = useState<CellWalls[][]>(() => generateRandomMaze(defaultMazeSize));

  // 刷新迷宫
  const handleRefreshMaze = () => {
    setMazeData(generateRandomMaze(defaultMazeSize));
  };

  return (
    <div>
      <div style={{ padding: '10px', backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
        <button
          onClick={handleRefreshMaze}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#1976D2';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#2196F3';
          }}
        >
          刷新迷宫
        </button>
      </div>
      <Stage width={window.innerWidth} height={window.innerHeight - 50} style={{ backgroundColor: '#f0f0f0' }}>
        <Layer>
          {mazeData.map((renderRow, rowIndex) => {
            const cells = renderRow.map((renderCell, colIndex) => {
              const walls = RenderCellWalls(renderCell, colIndex * cellSize, rowIndex * cellSize, cellSize, rowIndex, colIndex, mazeSize);
              return (
                <React.Fragment key={`cell-${rowIndex}-${colIndex}`}>
                  <Rect
                    x={colIndex * cellSize}
                    y={rowIndex * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill="white"
                    stroke="#e0e0e0"
                    strokeWidth={1}
                  />
                  {walls}
                </React.Fragment>
              );
            });

            return cells;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default React.memo(MazeCanvas);
