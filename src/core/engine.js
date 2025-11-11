/**
 * ゲームエンジン - タイミング、シーン管理
 */

export class GameEngine {
  constructor() {
    this.lastTime = 0;
    this.deltaTime = 0;
    this.isPaused = false;
    this.gameSpeed = 1.0; // 1.0 = 通常速度, 2.0 = 2倍速, 4.0 = 4倍速
    this.currentScene = null;
  }

  /**
   * ゲームループを開始
   */
  start(updateCallback, renderCallback) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
    this.lastTime = performance.now();
    this.loop();
  }

  /**
   * メインループ
   */
  loop = (currentTime = performance.now()) => {
    // デルタタイム計算 (秒単位)
    this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // 最大0.1秒に制限
    this.lastTime = currentTime;

    if (!this.isPaused) {
      const adjustedDelta = this.deltaTime * this.gameSpeed;

      // 更新
      if (this.updateCallback) {
        this.updateCallback(adjustedDelta);
      }

      // 描画
      if (this.renderCallback) {
        this.renderCallback();
      }
    }

    requestAnimationFrame(this.loop);
  }

  /**
   * ポーズ/再開
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.lastTime = performance.now(); // ポーズ解除時に時間をリセット
    }
  }

  /**
   * ゲーム速度を設定
   * @param {number} speed - 1.0 = 通常, 2.0 = 2倍速
   */
  setGameSpeed(speed) {
    this.gameSpeed = speed;
  }

  /**
   * シーンを変更
   * @param {Object} scene - 新しいシーン
   */
  changeScene(scene) {
    if (this.currentScene && this.currentScene.exit) {
      this.currentScene.exit();
    }
    this.currentScene = scene;
    if (this.currentScene && this.currentScene.enter) {
      this.currentScene.enter();
    }
  }
}
