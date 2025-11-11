/**
 * 敵クラス
 */

import { Entity } from './entities.js';
import { tileToWorld } from './map.js';

export class Enemy extends Entity {
  constructor(type, pathWorldCoords) {
    const startPos = pathWorldCoords[0];
    super(startPos.x, startPos.y, type.hp);

    this.type = type;
    this.speed = type.speed; // px/sec
    this.bounty = type.bounty; // 撃破時のG
    this.pathWorldCoords = pathWorldCoords;
    this.pathIndex = 0;
    this.spriteId = type.spriteId;
    this.reachedGoal = false;
    this.attackingBase = false;
    this.attackTimer = 0;
    this.attackInterval = type.attackInterval || 1.0; // 秒
    this.attackDamage = type.attackDamage || 1;
  }

  /**
   * 更新
   */
  update(deltaTime) {
    if (!this.alive || this.reachedGoal) return;

    // 次のウェイポイントへ移動
    if (this.pathIndex < this.pathWorldCoords.length) {
      const target = this.pathWorldCoords[this.pathIndex];
      const dx = target.x - this.pos.x;
      const dy = target.y - this.pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 2) {
        // ウェイポイント到達
        this.pathIndex++;
        if (this.pathIndex >= this.pathWorldCoords.length) {
          this.reachedGoal = true;
          this.attackingBase = true;
          this.attackTimer = this.attackInterval; // 即座に攻撃開始
        }
      } else {
        // 移動
        const moveDistance = this.speed * deltaTime;
        this.pos.x += (dx / distance) * moveDistance;
        this.pos.y += (dy / distance) * moveDistance;
      }
    }
  }

  /**
   * 基地を攻撃
   */
  attackBase(base, deltaTime) {
    if (!this.attackingBase || !this.alive) return;

    this.attackTimer += deltaTime;
    if (this.attackTimer >= this.attackInterval) {
      base.takeDamage(this.attackDamage);
      this.attackTimer = 0;
    }
  }

  /**
   * 死亡時
   */
  onDeath() {
    // 撃破時の報酬処理は外部で行う
  }

  /**
   * 描画
   */
  render(renderer, assetLoader) {
    this.renderSprite(renderer, assetLoader);
    this.renderHealthBar(renderer);
  }

  /**
   * スプライトのみ描画
   */
  renderSprite(renderer, assetLoader) {
    if (!this.alive) return;

    const img = assetLoader.getImage(this.spriteId);
    if (img) {
      renderer.drawImage(img, this.pos.x, this.pos.y, 48, 48, true);
    } else {
      // プレースホルダー
      renderer.drawCircle(this.pos.x, this.pos.y, 16, '#ff6b6b', true);
    }
  }

  /**
   * HPバーとHP数値を描画
   */
  renderHealthBar(renderer) {
    if (!this.alive) return;

    this.drawHealthBar(renderer);
  }

  /**
   * HPバーを描画
   */
  drawHealthBar(renderer) {
    const barWidth = 40;
    const barHeight = 4;
    const x = this.pos.x - barWidth / 2;
    const y = this.pos.y - 30;

    // 背景
    renderer.drawRect(x, y, barWidth, barHeight, '#333', true);

    // HP
    const hpRatio = this.hp / this.maxHp;
    renderer.drawRect(x, y, barWidth * hpRatio, barHeight, '#4ecca3', true);

    // HP数値表示（HPバーの上に小さく）
    const hpText = Math.ceil(this.hp).toString();
    renderer.drawText(hpText, this.pos.x, y - 6, 10, '#ffffff', 'center');
  }
}

/**
 * 敵タイプ定義
 */
export const ENEMY_TYPES = {
  slime: {
    hp: 35,
    speed: 60, // px/sec
    bounty: 5,
    attackInterval: 1.0,
    attackDamage: 1,
    spriteId: 'enemy_slime'
  },
  goblin: {
    hp: 50,
    speed: 80, // px/sec (スライムより速い)
    bounty: 8,
    attackInterval: 0.8,
    attackDamage: 2,
    spriteId: 'enemy_goblin'
  },
  thief: {
    hp: 70,
    speed: 120, // px/sec (非常に速い)
    bounty: 10,
    attackInterval: 1.2,
    attackDamage: 1,
    spriteId: 'enemy_thief'
  },
  golem: {
    hp: 600,
    speed: 40, // px/sec (遅いが頑丈)
    bounty: 20,
    attackInterval: 1.5,
    attackDamage: 3,
    spriteId: 'enemy_golem'
  },
  demon_king: {
    hp: 2200,
    speed: 48, // px/sec (最終ボス)
    bounty: 100,
    attackInterval: 0.5,
    attackDamage: 5,
    spriteId: 'enemy_demon_king'
  }
};
