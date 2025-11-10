/**
 * エンティティ基底クラス - 位置、HP等の共通プロパティ
 */

export class Entity {
  constructor(x, y, hp = 100) {
    this.pos = { x, y };
    this.hp = hp;
    this.maxHp = hp;
    this.alive = true;
    this.spriteId = null;
  }

  /**
   * ダメージを受ける
   */
  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.onDeath();
    }
  }

  /**
   * 死亡時の処理（オーバーライド用）
   */
  onDeath() {
    // サブクラスで実装
  }

  /**
   * 生存しているか
   */
  isAlive() {
    return this.alive;
  }

  /**
   * 更新（オーバーライド用）
   */
  update(deltaTime) {
    // サブクラスで実装
  }

  /**
   * 描画（オーバーライド用）
   */
  render(renderer, assetLoader) {
    // サブクラスで実装
  }
}
