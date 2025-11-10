/**
 * 経済システム - ゴールド管理
 */

export class Economy {
  constructor(initialGold = 100) {
    this.gold = initialGold;
  }

  /**
   * ゴールドを追加
   */
  addGold(amount) {
    this.gold += amount;
  }

  /**
   * ゴールドを消費
   */
  spendGold(amount) {
    if (this.gold >= amount) {
      this.gold -= amount;
      return true;
    }
    return false;
  }

  /**
   * 購入可能かチェック
   */
  canAfford(cost) {
    return this.gold >= cost;
  }

  /**
   * 現在のゴールド
   */
  getGold() {
    return this.gold;
  }

  /**
   * ゴールドをセット
   */
  setGold(amount) {
    this.gold = amount;
  }
}
