import React, { useState, useMemo, useEffect, useRef } from "react";
import * as monaco from 'monaco-editor';
import type { ReactElement } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import {
  generateRandomMaze,
  type CellWalls,
  type Pos,
} from "../mazeUtils/mazeGenerator";
import { isConnected2 } from "../algo/unionFind2";
import FButton from "../components/FButton";
import { generatePerfectMaze } from "../mazeUtils/perfect";
import { animatePath } from "../mazeUtils/pathAnimator";

// 计算cell的实际位置（考虑墙壁宽度）
const getCellPosition = (
  index: number,
  cellSize: number,
  wallWidth: number
) => {
  return index * (cellSize + wallWidth);
};

// 渲染所有墙壁（与cell分开渲染）
const RenderAllWalls = (
  mazeData: CellWalls[][],
  cellSize: number,
  wallWidth: number,
  mazeSize: number
): ReactElement[] => {
  const walls: ReactElement[] = [];
  const wallColor = "black";

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
const defaultMazeSize = 4; // 默认迷宫大小

// 构建一个mock数据
const generateMockMaze = (size: number) => {
  const result: CellWalls[][] = Array.from({ length: size }, () => {
    return Array.from({ length: size }, () => ({
      top: 1,
      right: 1,
      bottom: 1,
      left: 1,
    }));
  });

  // 测试用: 构建一个第0行，第size-1列连通的迷宫
  for (let i = 0; i < size - 1; i++) {
    result[0][i] = { top: 1, bottom: 1, right: 0, left: 0 };
  }
  result[0][size - 1].bottom = 0;
  result[0][size - 1].left = 0;
  for (let i = 1; i < size; i++) {
    result[i][size - 1] = { top: 0, bottom: 0, right: 1, left: 1 };
  }
  // console.log("test maze data: ", result);
  return result;
};

const MazeCanvas = () => {
  const [mazeSize] = useState(defaultMazeSize);
  // const [mazeData, setMazeData] = useState<CellWalls[][]>(() => generateRandomMaze(defaultMazeSize));
  const [mazeData, setMazeData] = useState<CellWalls[][]>(() =>
    generateMockMaze(mazeSize)
  );
  const [solutionPath, setSolutionPath] = useState<Pos[]>([]);
  const animationCleanupRef = useRef<(() => void) | null>(null);

  // 刷新迷宫
  const handleRefreshMaze = () => {
    // 清理正在进行的动画
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }
    setMazeData(generateRandomMaze(defaultMazeSize));
    setSolutionPath([]);
  };

  // 计算canvas大小：n个cell + (n-1)个墙壁
  const cavansSize = useMemo(() => {
    return mazeSize * cellSize + (mazeSize - 1) * wallWidth;
  }, [mazeSize]);

  // 渲染所有cells
  const allCells = useMemo(() => {
    return mazeData
      .map((renderRow, rowIndex) => {
        return renderRow.map((_, colIndex) => {
          const cellX = getCellPosition(colIndex, cellSize, wallWidth);
          const cellY = getCellPosition(rowIndex, cellSize, wallWidth);
          const isSolutionPath = solutionPath.some(
            (pos) => pos.x === colIndex && pos.y === rowIndex
          );

          return (
            <Rect
              key={`cell-${rowIndex}-${colIndex}`}
              x={cellX}
              y={cellY}
              width={cellSize}
              height={cellSize}
              fill={isSolutionPath ? "red" : "white"}
              stroke="#e0e0e0"
              strokeWidth={0}
              onClick={() => {
                setSolutionPath([
                  ...solutionPath,
                  { x: colIndex, y: rowIndex },
                ]);
              }}
            />
          );
        });
      })
      .flat();
  }, [mazeData, solutionPath]);

  // 渲染所有walls
  const allWalls = useMemo(() => {
    return RenderAllWalls(mazeData, cellSize, wallWidth, mazeSize);
  }, [mazeData]);

  //   计算连通性
  const handleCalculateConnected = () => {
    const start: Pos = { x: 0, y: 0 };
    const end: Pos = { x: mazeSize - 1, y: mazeSize - 1 };
    const result = isConnected2(mazeData, start, end);
    console.log("result: ", result);
  };

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (editorRef.current) {
          const value = /* set from `myEditor.getModel()`: */ `function hello() {
              alert('Hello world!');
          }`;
          monaco.editor.create(editorRef.current, {
              // value: 'console.log("Hello, world!");',
              value,
              language: "javascript",
              automaticLayout: true,
          });
      }
      
      // 组件卸载时清理动画
      return () => {
          if (animationCleanupRef.current) {
              animationCleanupRef.current();
              animationCleanupRef.current = null;
          }
      };
  }, []);

  return (
    <div>
      <div
        className="flex flex-row gap-2 mb-4"
      >
        <FButton onClick={handleRefreshMaze}>
          刷新迷宫
        </FButton>
        <FButton
          onClick={handleRefreshMaze}
        >
          提交结果
        </FButton>
        <FButton
          onClick={handleCalculateConnected}
        >
          计算连通性
        </FButton>
        <FButton onClick={() => {
          const mazeData = generatePerfectMaze(4)
          setMazeData(mazeData)
          const result = isConnected2(mazeData, { x: 0, y: 0 }, { x: 3, y: 3 })
          console.log("result: ", result)
        }}>自动生成并计算连通性</FButton>
        <FButton onClick={() => {
          // 清理之前的动画
          if (animationCleanupRef.current) {
            animationCleanupRef.current();
            animationCleanupRef.current = null;
          }
          
          // 重置路径
          setSolutionPath([]);
          
          const paths: Pos[] = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 3, y: 0 },
            { x: 3, y: 1 },
            { x: 3, y: 2 },
            { x: 3, y: 3 }
          ];
          
          // 开始动画绘制路径
          const cleanup = animatePath(paths, (currentPath) => {
            setSolutionPath(currentPath);
          }, 500);
          
          animationCleanupRef.current = cleanup;
        }}>画出路径</FButton>
      </div>
      <div className="flex flex-row gap-2">
        <Stage
          width={cavansSize}
          height={cavansSize}
          style={{ backgroundColor: "#ff9900" }}
        >
          <Layer>
            {/* 先渲染所有cells */}
            {allCells}
            {/* 然后渲染所有walls */}
            {allWalls}
          </Layer>
        </Stage>

        <div ref={editorRef} style={{ width: 500, height: 600 }}></div>
      </div>
    </div>
  );
};

export default React.memo(MazeCanvas);
