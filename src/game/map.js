/**
 * マップ管理 - タイル、パス定義
 */

export const TILE_SIZE = 64; // px
export const GRID_ROWS = 10;
export const GRID_COLS = 10;

// タイルタイプ
export const TILE_TYPE = {
  GROUND: 0,    // 地面（建設可能）
  PATH: 1,      // 道
  BLOCKED: 2    // 建設不可
};

/**
 * 10x10マップの初期定義（0=地面、1=道、2=ブロック）を設定
 */
export const map10x10 = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

/**
 * パス（ウェイポイント）- 敵が辿る経路
 * タイル座標 {x, y} の配列
 */
export const path = [
  { x: -1, y: 1 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 2, y: 2 },
  { x: 2, y: 3 },
  { x: 2, y: 4 },
  { x: 2, y: 5 },
  { x: 2, y: 6 },
  { x: 2, y: 7 },
  { x: 2, y: 8 },
  { x: 3, y: 8 },
  { x: 4, y: 8 },
  { x: 5, y: 8 },
  { x: 6, y: 8 },
  { x: 6, y: 7 },
  { x: 6, y: 6 },
  { x: 6, y: 5 },
  { x: 6, y: 4 },
  { x: 7, y: 4 },
  { x: 8, y: 4 },
  { x: 9, y: 4 }
];

// スタート・ゴール
export const start = { x: -1, y: 1 };
export const goal = { x: 9, y: 4 };

/**
 * タイル座標をワールド座標（ピクセル）に変換
 */
export function tileToWorld(tileX, tileY) {
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2
  };
}

/**
 * ワールド座標をタイル座標に変換
 */
export function worldToTile(worldX, worldY) {
  return {
    x: Math.floor(worldX / TILE_SIZE),
    y: Math.floor(worldY / TILE_SIZE)
  };
}

/**
 * タイルが建設可能かチェック
 */
export function canBuildOnTile(tileX, tileY) {
  if (tileX < 0 || tileX >= GRID_COLS || tileY < 0 || tileY >= GRID_ROWS) {
    return false;
  }
  return map10x10[tileY][tileX] === TILE_TYPE.GROUND;
}

/**
 * マップクラス
 */
export class GameMap {
  constructor() {
    this.tiles = map10x10;
    this.path = path;
    this.start = start;
    this.goal = goal;
  }

  /**
   * マップを描画
   */
  render(renderer) {
    // グリッド描画
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        const tileType = this.tiles[row][col];

        // タイルの色分け
        let color;
        switch (tileType) {
          case TILE_TYPE.PATH:
            color = '#8B7355'; // 茶色（道）
            break;
          case TILE_TYPE.BLOCKED:
            color = '#555'; // グレー（ブロック）
            break;
          default:
            color = '#4a7c59'; // 緑（地面）
        }

        renderer.drawRect(x, y, TILE_SIZE, TILE_SIZE, color, true);

        // グリッド線
        renderer.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        renderer.ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }

    // スタート位置マーカー
    const startWorld = tileToWorld(this.start.x, this.start.y);
    renderer.drawCircle(startWorld.x, startWorld.y, 10, '#00ff00', true);

    // ゴール位置マーカー
    const goalWorld = tileToWorld(this.goal.x, this.goal.y);
    renderer.drawCircle(goalWorld.x, goalWorld.y, 10, '#ff0000', true);
  }

  /**
   * パスの総ワールド座標を取得
   */
  getPathWorldCoordinates() {
    return this.path.map(p => tileToWorld(p.x, p.y));
  }
}
