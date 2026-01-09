import type { Pos } from './mazeGenerator';

/**
 * 以动画形式逐步绘制路径
 * @param path 路径数组，格式为 Pos[]
 * @param onStep 每步的回调函数，接收当前已绘制的路径
 * @param interval 每步之间的间隔时间（毫秒），默认500ms
 * @returns 清理函数，用于取消动画
 */
export function animatePath(
  path: Pos[],
  onStep: (currentPath: Pos[]) => void,
  interval: number = 500
): () => void {
  if (path.length === 0) {
    return () => {};
  }

  let currentIndex = 0;
  const timers: NodeJS.Timeout[] = [];

  const step = () => {
    if (currentIndex < path.length) {
      const currentPath = path.slice(0, currentIndex + 1);
      onStep(currentPath);
      currentIndex++;
      
      if (currentIndex < path.length) {
        const timer = setTimeout(step, interval);
        timers.push(timer);
      }
    }
  };

  // 立即执行第一步
  step();

  // 返回清理函数
  return () => {
    timers.forEach(timer => clearTimeout(timer));
  };
}
