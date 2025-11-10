/**
 * ステージ管理 - 進行、報酬、難易度
 */

export class StageManager {
  constructor() {
    this.currentStage = 1;
    this.stages = this.initializeStages();
  }

  /**
   * ステージ定義を初期化
   */
  initializeStages() {
    return {
      1: {
        startGold: 100,
        waves: [
          { delay: 2.0, enemies: [{ type: 'slime', n: 10, interval: 0.8 }] },
          { delay: 2.0, enemies: [{ type: 'slime', n: 15, interval: 0.6 }] }
        ],
        clearBonusGold: 30
      },
      2: {
        startGold: 0, // 前ステージから引き継ぐ
        waves: [
          { delay: 2.0, enemies: [{ type: 'slime', n: 15, interval: 0.7 }] },
          { delay: 2.0, enemies: [
            { type: 'slime', n: 10, interval: 0.6 },
            { type: 'goblin', n: 8, interval: 0.8 }
          ]},
          { delay: 2.0, enemies: [
            { type: 'goblin', n: 12, interval: 0.5 }
          ]}
        ],
        clearBonusGold: 40
      },
      3: {
        startGold: 0,
        waves: [
          { delay: 2.0, enemies: [
            { type: 'slime', n: 20, interval: 0.5 },
            { type: 'goblin', n: 10, interval: 0.6 }
          ]},
          { delay: 2.0, enemies: [
            { type: 'thief', n: 15, interval: 0.4 }
          ]},
          { delay: 2.0, enemies: [
            { type: 'slime', n: 15, interval: 0.4 },
            { type: 'goblin', n: 15, interval: 0.4 },
            { type: 'thief', n: 10, interval: 0.5 }
          ]}
        ],
        clearBonusGold: 50
      },
      4: {
        startGold: 0,
        waves: [
          { delay: 2.0, enemies: [
            { type: 'goblin', n: 20, interval: 0.5 },
            { type: 'golem', n: 5, interval: 2.0 }
          ]},
          { delay: 2.0, enemies: [
            { type: 'thief', n: 20, interval: 0.4 },
            { type: 'golem', n: 8, interval: 1.5 }
          ]},
          { delay: 2.0, enemies: [
            { type: 'slime', n: 25, interval: 0.3 },
            { type: 'goblin', n: 20, interval: 0.4 },
            { type: 'golem', n: 10, interval: 1.2 }
          ]}
        ],
        clearBonusGold: 80
      },
      5: {
        startGold: 0,
        waves: [
          { delay: 2.0, enemies: [
            { type: 'demon_king', n: 1, interval: 0 }
          ]},
          { delay: 2.0, enemies: [
            { type: 'demon_king', n: 2, interval: 5.0 }
          ]},
          { delay: 2.0, enemies: [
            { type: 'demon_king', n: 3, interval: 3.0 }
          ]}
        ],
        clearBonusGold: 200
      }
      // さらにステージを追加可能
    };
  }

  /**
   * 現在のステージデータを取得
   */
  getCurrentStageData() {
    return this.stages[this.currentStage];
  }

  /**
   * 次のステージへ進む
   */
  nextStage() {
    this.currentStage++;
  }

  /**
   * ステージをリセット
   */
  resetStage() {
    this.currentStage = 1;
  }

  /**
   * 現在のステージ番号
   */
  getCurrentStageNumber() {
    return this.currentStage;
  }

  /**
   * ステージが存在するか
   */
  hasStage(stageNumber) {
    return !!this.stages[stageNumber];
  }
}
