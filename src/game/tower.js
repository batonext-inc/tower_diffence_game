/**
 * タワークラス
 */

import { Entity } from './entities.js';

/**
 * 発射体（弾）クラス
 */
export class Projectile {
  constructor(x, y, target, damage, speed = 300, towerType = 'archer') {
    this.pos = { x, y };
    this.target = target;
    this.damage = damage;
    this.speed = speed; // px/sec
    this.alive = true;
    this.towerType = towerType; // タワータイプを保持
  }

  update(deltaTime) {
    if (!this.alive || !this.target.alive) {
      this.alive = false;
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      // 命中
      this.target.takeDamage(this.damage);
      this.alive = false;
    } else {
      // 移動
      const moveDistance = this.speed * deltaTime;
      this.pos.x += (dx / distance) * moveDistance;
      this.pos.y += (dy / distance) * moveDistance;
    }
  }

  render(renderer) {
    if (!this.alive) return;

    // 剣士の場合は赤いバツ印エフェクト
    if (this.towerType === 'solder') {
      const ctx = renderer.ctx;
      ctx.save();

      // 敵と発射地点の中間位置に描画
      const midX = (this.pos.x + this.target.pos.x) / 2;
      const midY = (this.pos.y + this.target.pos.y) / 2;

      ctx.translate(midX, midY);

      // バツ印（×）を描画
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      const size = 6;
      ctx.beginPath();
      ctx.moveTo(-size, -size);
      ctx.lineTo(size, size);
      ctx.moveTo(size, -size);
      ctx.lineTo(-size, size);
      ctx.stroke();

      ctx.restore();
      return;
    }

    // アーチャーの場合は矢
    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const angle = Math.atan2(dy, dx);

    const ctx = renderer.ctx;
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(angle);

    // 矢の形状（細長い三角形）
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.moveTo(8, 0);        // 先端
    ctx.lineTo(-6, -3);      // 左後ろ
    ctx.lineTo(-4, 0);       // 中央後ろ
    ctx.lineTo(-6, 3);       // 右後ろ
    ctx.closePath();
    ctx.fill();

    // 矢の輪郭
    ctx.strokeStyle = '#ffa000';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * タワークラス
 */
export class Tower extends Entity {
  constructor(type, tileX, tileY, worldX, worldY) {
    super(worldX, worldY, 100);

    this.type = type;
    this.level = 1;
    this.cost = type.cost;
    this.upgradeCost = type.upgradeCost;
    this.totalCost = type.cost; // 累計コスト（売却時の参考用）
    this.range = type.range;
    this.fireRate = type.fireRate; // 発/秒
    this.damage = type.damage;
    this.tile = { x: tileX, y: tileY };
    this.targetMode = type.targetMode || 'first';
    this.spriteId = type.spriteId;

    this.fireTimer = 0;
    this.currentTarget = null;
    this.direction = 'r'; // 向き（8方向: u,d,l,r,lu,ld,ru,rd）
  }

  /**
   * 更新
   */
  update(deltaTime, enemies, projectiles) {
    this.fireTimer += deltaTime;

    // ターゲット選択
    this.currentTarget = this.selectTarget(enemies);

    // 発射
    if (this.currentTarget && this.fireTimer >= 1.0 / this.fireRate) {
      this.fire(projectiles);
      this.fireTimer = 0;
    }

    // 向きを更新
    if (this.currentTarget) {
      this.updateDirection(this.currentTarget);
    }
  }

  /**
   * ターゲットを選択
   */
  selectTarget(enemies) {
    const inRange = enemies.filter(enemy => {
      if (!enemy.alive) return false;
      const dx = enemy.pos.x - this.pos.x;
      const dy = enemy.pos.y - this.pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= this.range;
    });

    if (inRange.length === 0) return null;

    // 常に最も近い敵をターゲット
    return inRange.reduce((best, enemy) => {
      const dxBest = best.pos.x - this.pos.x;
      const dyBest = best.pos.y - this.pos.y;
      const distBest = Math.sqrt(dxBest * dxBest + dyBest * dyBest);

      const dxEnemy = enemy.pos.x - this.pos.x;
      const dyEnemy = enemy.pos.y - this.pos.y;
      const distEnemy = Math.sqrt(dxEnemy * dxEnemy + dyEnemy * dyEnemy);

      return distEnemy < distBest ? enemy : best;
    });
  }

  /**
   * 発射
   */
  fire(projectiles) {
    if (!this.currentTarget) return;
    const projectile = new Projectile(
      this.pos.x,
      this.pos.y,
      this.currentTarget,
      this.damage,
      300,
      this.type.spriteId.replace('tower_', '') // 'tower_solder' -> 'solder'
    );
    projectiles.push(projectile);
  }

  /**
   * アップグレード
   */
  upgrade() {
    this.totalCost += this.upgradeCost; // 累計コストを更新
    this.level++;
    this.damage = Math.floor(this.damage * 1.4);
    this.upgradeCost = Math.floor(this.upgradeCost * 1.2);
  }

  /**
   * 向きを更新（8方向）
   */
  updateDirection(target) {
    const dx = target.pos.x - this.pos.x;
    const dy = target.pos.y - this.pos.y;
    const angle = Math.atan2(dy, dx);
    const deg = angle * 180 / Math.PI;

    // 8方向に分類
    if (deg >= -22.5 && deg < 22.5) this.direction = 'r';
    else if (deg >= 22.5 && deg < 67.5) this.direction = 'rd';
    else if (deg >= 67.5 && deg < 112.5) this.direction = 'd';
    else if (deg >= 112.5 && deg < 157.5) this.direction = 'ld';
    else if (deg >= 157.5 || deg < -157.5) this.direction = 'l';
    else if (deg >= -157.5 && deg < -112.5) this.direction = 'lu';
    else if (deg >= -112.5 && deg < -67.5) this.direction = 'u';
    else if (deg >= -67.5 && deg < -22.5) this.direction = 'ru';
  }

  /**
   * 描画
   */
  render(renderer, assetLoader) {
    if (!this.alive) return;

    // 射程範囲（デバッグ用、オプション）
    // renderer.drawCircle(this.pos.x, this.pos.y, this.range, 'rgba(255,255,255,0.1)', false);

    // タワー画像（8方向 or 4方向）
    let spriteKey = `${this.spriteId}_${this.direction}`;
    let img = assetLoader.getImage(spriteKey);

    // 8方向の画像がない場合、4方向にフォールバック
    if (!img && this.direction.length === 2) {
      // 斜め方向を4方向に変換（lu→u, ld→d, ru→u, rd→dなど）
      const fallbackDirection = this.direction[1]; // 2文字目を使用
      spriteKey = `${this.spriteId}_${fallbackDirection}`;
      img = assetLoader.getImage(spriteKey);
    }

    if (img) {
      renderer.drawImage(img, this.pos.x, this.pos.y, 48, 48, true);
    } else {
      // プレースホルダー
      renderer.drawRect(this.pos.x - 16, this.pos.y - 16, 32, 32, '#4ecdc4', true);
    }

    // レベル表示（タワー画像の中央やや上に表示してマスからはみ出さないように）
    renderer.drawText(`Lv${this.level}`, this.pos.x, this.pos.y - 8, 11, '#fff', 'center');
  }
}

/**
 * タワータイプ定義
 */
export const TOWER_TYPES = {
  archer: {
    cost: 40,
    upgradeCost: 30,
    range: 160,
    fireRate: 2.2, // 2.2発/秒
    damage: 4,
    targetMode: 'first',
    spriteId: 'tower_archer'
  },
  solder: {
    cost: 30,
    upgradeCost: 20,
    range: 120,
    fireRate: 1.5, // 1.5発/秒
    damage: 5.5,
    targetMode: 'closest',
    spriteId: 'tower_solder'
  }
  // 他のタワータイプを追加可能
};
