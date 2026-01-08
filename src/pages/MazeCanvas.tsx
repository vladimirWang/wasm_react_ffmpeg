import React, { useState, useEffect } from 'react';
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
// 每个单元格只渲染右边框和下边框，避免相邻单元格共享边的重复渲染
// 边界处理：第一行需要渲染上边，第一列需要渲染左边
const RenderCellWalls = (
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
  if (cell.right === 1 && colIndex < cellSize - 1) {
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
  if (cell.bottom === 1 && rowIndex < cellSize - 1) {
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

const MazeCanvas = () => {
  return (
    <div>
      <Stage width={window.innerWidth} height={window.innerHeight} style={{ backgroundColor: '#f0f0f0' }}>
        <Layer>
          {mazeData.map((renderRow, rowIndex) => {
            const cells = renderRow.map((renderCell, colIndex) => {
              const walls = RenderCellWalls(renderCell, colIndex * cellSize, rowIndex * cellSize, cellSize, rowIndex, colIndex);
              return <>
                <Rect
                  key={`cell-${rowIndex}-${colIndex}`}
                  x={colIndex * cellSize}
                  y={rowIndex * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="white"
                  stroke="#e0e0e0"
                  strokeWidth={1}
                />
                {walls}
              </>
            });

            return cells;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default React.memo(MazeCanvas);
