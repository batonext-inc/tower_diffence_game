/**
 * 基地クラス
 */

import { Entity } from './entities.js';

export class Base extends Entity {
  constructor(x, y, hp = 50) {
    super(x, y, hp);
    this.spriteId = 'base_tower';
    this.assetLoader = null; // assetLoaderを保持
  }

  /**
   * assetLoaderを設定
   */
  setAssetLoader(assetLoader) {
    this.assetLoader = assetLoader;
  }

  /**
   * ダメージを受ける（オーバーライド）
   */
  takeDamage(damage) {
    this.hp -= damage;

    // ダメージ効果音を再生
    if (this.assetLoader && this.alive) {
      this.assetLoader.playSound('se_damage_tower', 0.4);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.onDeath();
    }
  }

  /**
   * 死亡時（ゲームオーバー）
   */
  onDeath() {
    console.log('Base destroyed! Game Over!');
  }

  /**
   * 描画
   */
  render(renderer, assetLoader) {
    const img = assetLoader.getImage(this.spriteId);

    if (img) {
      // tower.pngのサイズに合わせて大きく表示
      renderer.drawImage(img, this.pos.x, this.pos.y - 20, 96, 96, true);
    } else {
      // プレースホルダー
      renderer.drawRect(this.pos.x - 32, this.pos.y - 32, 64, 64, '#e74c3c', true);
    }

    // HPバー
    this.drawHealthBar(renderer);
  }

  /**
   * HPバーを描画
   */
  drawHealthBar(renderer) {
    const barWidth = 60;
    const barHeight = 8;
    const x = this.pos.x - barWidth / 2;
    const y = this.pos.y - 80;

    // 背景
    renderer.drawRect(x, y, barWidth, barHeight, '#333', true);

    // HP
    const hpRatio = this.hp / this.maxHp;
    const color = hpRatio > 0.5 ? '#4ecca3' : hpRatio > 0.2 ? '#ffd93d' : '#e74c3c';
    renderer.drawRect(x, y, barWidth * hpRatio, barHeight, color, true);

    // HPテキスト
    renderer.drawText(`${this.hp}/${this.maxHp}`, this.pos.x, y - 5, 12, '#fff', 'center');
  }
}
