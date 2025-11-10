/**
 * ウェーブ管理 - 敵のスポーン
 */

import { Enemy, ENEMY_TYPES } from './enemy.js';

export class WaveManager {
  constructor(pathWorldCoords) {
    this.pathWorldCoords = pathWorldCoords;
    this.currentWave = 0;
    this.waves = [];
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveInProgress = false;
    this.waveDelay = 0;
    this.allWavesComplete = false;
    this.waitingForNextWave = false;
    this.waveClearStartTime = 0; // Wave Clear開始時刻（リアルタイム）
    this.waveClearDelay = 3000; // Wave Clear後の待機時間（ミリ秒、現実時間）
  }

  /**
   * ステージのウェーブ設定をロード
   */
  loadStageWaves(stageData) {
    this.waves = stageData.waves;
    this.currentWave = 0;
    this.allWavesComplete = false;
  }

  /**
   * 次のウェーブを開始
   */
  startNextWave() {
    if (this.currentWave >= this.waves.length) {
      this.allWavesComplete = true;
      return;
    }

    const wave = this.waves[this.currentWave];
    this.waveDelay = wave.delay || 0;
    this.spawnQueue = this.buildSpawnQueue(wave.enemies);
    this.waveInProgress = true;
    this.spawnTimer = 0;
    this.currentWave++;
  }

  /**
   * スポーンキューを構築
   */
  buildSpawnQueue(enemyConfigs) {
    const queue = [];
    let time = 0;

    enemyConfigs.forEach(config => {
      const enemyType = ENEMY_TYPES[config.type];
      for (let i = 0; i < config.n; i++) {
        queue.push({ type: enemyType, spawnTime: time });
        time += config.interval;
      }
    });

    return queue;
  }

  /**
   * 更新
   */
  update(deltaTime, enemies) {
    // Wave Clear待機中（現実時間でカウント）
    if (this.waitingForNextWave) {
      const elapsedTime = Date.now() - this.waveClearStartTime;
      if (elapsedTime >= this.waveClearDelay) {
        this.waitingForNextWave = false;
        this.startNextWave();
      }
      return;
    }

    if (!this.waveInProgress) return;

    // ウェーブ開始前の遅延
    if (this.waveDelay > 0) {
      this.waveDelay -= deltaTime;
      return;
    }

    this.spawnTimer += deltaTime;

    // スポーン処理
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnTime <= this.spawnTimer) {
      const spawn = this.spawnQueue.shift();
      const enemy = new Enemy(spawn.type, this.pathWorldCoords);
      enemies.push(enemy);
    }

    // スポーンキューが空になり、敵が全滅したらWave完了
    if (this.spawnQueue.length === 0) {
      const aliveEnemies = enemies.filter(e => e.alive).length;
      if (aliveEnemies === 0) {
        this.waveInProgress = false;

        // 次のWaveがある場合は待機状態に
        if (this.currentWave < this.waves.length) {
          this.waitingForNextWave = true;
          this.waveClearStartTime = Date.now(); // 現実時間を記録
        } else {
          // 全Wave完了
          this.allWavesComplete = true;
        }
      }
    }
  }

  /**
   * Wave Clear待機中か
   */
  isWaitingForNextWave() {
    return this.waitingForNextWave;
  }

  /**
   * Wave Clear待機の残り時間（秒）
   */
  getWaveClearTimeRemaining() {
    if (!this.waitingForNextWave) return 0;
    const elapsedTime = Date.now() - this.waveClearStartTime;
    const remainingMs = Math.max(0, this.waveClearDelay - elapsedTime);
    return remainingMs / 1000; // ミリ秒を秒に変換
  }

  /**
   * 全ウェーブが完了したか
```  /**
   * 全ウェーブが完了したか
   */
  isAllWavesComplete() {
    return this.allWavesComplete;
  }

  /**
   * 現在のウェーブ番号
   */
  getCurrentWaveNumber() {
    return this.currentWave;
  }

  /**
   * 総ウェーブ数
   */
  getTotalWaves() {
    return this.waves.length;
  }
}
