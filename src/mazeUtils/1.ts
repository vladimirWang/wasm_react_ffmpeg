import { isConnected } from '../algo/unionFind';
import { generateRandomMaze } from './mazeGenerator'

// const data = generateRandomMaze(3)

// console.log("data: ", JSON.stringify(data))

const mock: number[][] = [
    [0, 0, 1, 1, 1],
    [1, 0, 1, 1, 1],
    [1, 0, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 1, 1, 0]
]

// 检查从 [0,0] 到 [length-1, length-1] 是否连通
const result = isConnected(mock);
console.log('从 [0,0] 到 [4,4] 是否连通:', result);

export { mock, result };