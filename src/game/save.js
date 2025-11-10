/**
 * セーブ/ロード管理 - localStorage
 */

export class SaveManager {
  constructor() {
    this.saveKey = 'towerDefenseSave';
  }

  /**
   * ゲームデータを保存
   */
  save(data) {
    try {
      const saveData = {
        stage: data.stage,
        gold: data.gold,
        baseHp: data.baseHp,
        timestamp: Date.now()
      };
      localStorage.setItem(this.saveKey, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }

  /**
   * ゲームデータを読み込み
   */
  load() {
    try {
      const saveData = localStorage.getItem(this.saveKey);
      if (saveData) {
        return JSON.parse(saveData);
      }
      return null;
    } catch (error) {
      console.error('Load failed:', error);
      return null;
    }
  }

  /**
   * セーブデータを削除
   */
  deleteSave() {
    localStorage.removeItem(this.saveKey);
  }

  /**
   * セーブデータが存在するか
   */
  hasSave() {
    return !!localStorage.getItem(this.saveKey);
  }
}
