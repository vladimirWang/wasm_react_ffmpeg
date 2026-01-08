import React, { useState, useMemo } from 'react';
import type { ReactElement } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { generateRandomMaze, type CellWalls, type Pos } from '../mazeUtils/mazeGenerator';

// 计算cell的实际位置（考虑墙壁宽度）
const getCellPosition = (index: number, cellSize: number, wallWidth: number) => {
  return index * (cellSize + wallWidth);
};

// 渲染所有墙壁（与cell分开渲染）
const RenderAllWalls = (
  mazeData: CellWalls[][],
  cellSize: number,
  wallWidth: number,
  mazeSize:number
): ReactElement[] => {
  const walls: ReactElement[] = [];
  const wallColor = 'black';

  mazeData.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellX = getCellPosition(colIndex, cellSize, wallWidth);
      const cellY = getCellPosition(rowIndex, cellSize, wallWidth);

      // // 上墙 (top) - 只渲染第一行的上边框
      // if (rowIndex === 0 && cell.top === 1) {
      //   walls.push(
      //     <Line
      //       key={`${rowIndex}-${colIndex}-top`}
      //       points={[cellX, cellY, cellX + cellSize, cellY]}
      //       stroke={wallColor}
      //       strokeWidth={wallWidth}
      //     />
      //   );
      // }

      // 右墙 (right) - 渲染右边框（最后一列不渲染，因为它是边界）
      if (cell.right === 1 && colIndex < mazeSize - 1) {
        const rightWallX = cellX + cellSize;
        walls.push(
          <Line
            key={`${rowIndex}-${colIndex}-right`}
            points={[rightWallX, cellY, rightWallX, cellY + cellSize]}
            stroke={wallColor}
            strokeWidth={wallWidth}
          />
        );
      }

      // 下墙 (bottom) - 渲染下边框（最后一行不渲染，因为它是边界）
      if (cell.bottom === 1 && rowIndex < mazeSize - 1) {
        const bottomWallY = cellY + cellSize;
        walls.push(
          <Line
            key={`${rowIndex}-${colIndex}-bottom`}
            points={[cellX, bottomWallY, cellX + cellSize, bottomWallY]}
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
      //       points={[cellX, cellY, cellX, cellY + cellSize]}
      //       stroke={wallColor}
      //       strokeWidth={wallWidth}
      //     />
      //   );
      // }
    });
  });

  return walls;
};
const cellSize = 50;
const wallWidth = 1;
const defaultMazeSize = 10; // 默认迷宫大小

const MazeCanvas = () => {
  const [mazeSize] = useState(defaultMazeSize);
  const [mazeData, setMazeData] = useState<CellWalls[][]>(() => generateRandomMaze(defaultMazeSize));
  const [solutionPath, setSolutionPath] = useState<Pos[]>([]);

  // 刷新迷宫
  const handleRefreshMaze = () => {
    setMazeData(generateRandomMaze(defaultMazeSize));
    setSolutionPath([]);
  };

  // 计算canvas大小：n个cell + (n-1)个墙壁
  const cavansSize = useMemo(() => {
    return mazeSize * cellSize + (mazeSize - 1) * wallWidth;
  }, [mazeSize]);

  // 渲染所有cells
  const allCells = useMemo(() => {
    return mazeData.map((renderRow, rowIndex) => {
      return renderRow.map((_, colIndex) => {
        const cellX = getCellPosition(colIndex, cellSize, wallWidth);
        const cellY = getCellPosition(rowIndex, cellSize, wallWidth);
        const isSolutionPath = solutionPath.some(pos => pos.x === colIndex && pos.y === rowIndex);
        
        return (
          <Rect
            key={`cell-${rowIndex}-${colIndex}`}
            x={cellX}
            y={cellY}
            width={cellSize}
            height={cellSize}
            fill={isSolutionPath ? 'red' : 'white'}
            stroke="#e0e0e0"
            strokeWidth={0}
            onClick={() => {
              setSolutionPath([...solutionPath, { x: colIndex, y: rowIndex }]);
            }}
          />
        );
      });
    }).flat();
  }, [mazeData, solutionPath]);

  // 渲染所有walls
  const allWalls = useMemo(() => {
    return RenderAllWalls(mazeData, cellSize, wallWidth, mazeSize);
  }, [mazeData]);

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
            fontWeight: '500',
            marginRight: '8px'
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
          提交结果
        </button>
      </div>
      <Stage width={cavansSize} height={cavansSize} style={{ backgroundColor: '#ff9900' }}>
        <Layer>
          {/* 先渲染所有cells */}
          {allCells}
          {/* 然后渲染所有walls */}
          {allWalls}
        </Layer>
      </Stage>
    </div>
  );
};

export default React.memo(MazeCanvas);
