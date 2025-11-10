/**
 * Tower Defense Game - メインエントリーポイント
 */

import { GameEngine } from './core/engine.js';
import { Renderer } from './core/renderer.js';
import { AssetLoader } from './core/assetLoader.js';
import { InputManager } from './core/input.js';

import { GameMap, TILE_SIZE, worldToTile, canBuildOnTile, tileToWorld } from './game/map.js';
import { Base } from './game/base.js';
import { Tower, TOWER_TYPES } from './game/tower.js';
import { WaveManager } from './game/wave.js';
import { Economy } from './game/economy.js';
import { StageManager } from './game/stage.js';
import { UI } from './game/ui.js';
import { SaveManager } from './game/save.js';

/**
 * ゲーム状態
 */
const GAME_STATE = {
  LOADING: 'loading',
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
  STAGE_CLEAR: 'stageClear',
  ALL_CLEAR: 'allClear'
};

/**
 * メインゲームクラス
 */
class TowerDefenseGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.loadingDiv = document.getElementById('loading');

    // Canvas サイズ設定（フィールド + 右サイドパネル + 下HUD）
    this.fieldWidth = TILE_SIZE * 10; // 640px
    this.sidebarWidth = 200; // 右サイドパネル
    this.hudHeight = 80; // 下部HUD
    this.canvas.width = this.fieldWidth + this.sidebarWidth; // 840px
    this.canvas.height = TILE_SIZE * 10 + this.hudHeight; // 720px

    // コアシステム初期化
    this.engine = new GameEngine();
    this.renderer = new Renderer(this.canvas);
    this.assetLoader = new AssetLoader();
    this.inputManager = new InputManager(this.canvas);

    // ゲームシステム初期化
    this.gameMap = new GameMap();
    this.economy = new Economy(50);
    this.stageManager = new StageManager();
    this.waveManager = new WaveManager(this.gameMap.getPathWorldCoordinates());
    this.ui = new UI(this.canvas);
    this.saveManager = new SaveManager();

    // ゲームオブジェクト
    this.base = null;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];

    // ゲーム状態
    this.gameState = GAME_STATE.LOADING;

    // 入力イベント登録
    this.setupInputHandlers();

    // キーボードイベント
    this.setupKeyboardHandlers();
  }

  /**
   * 初期化
   */
  async init() {
    // アセット読み込み
    const imageList = [
      // 敵
      { key: 'enemy_slime', path: './assets/sprites/enemy/slime.png' },
      { key: 'enemy_goblin', path: './assets/sprites/enemy/goblin.png' },
      { key: 'enemy_thief', path: './assets/sprites/enemy/thief.png' },
      { key: 'enemy_golem', path: './assets/sprites/enemy/golem.png' },
      { key: 'enemy_demon_king', path: './assets/sprites/enemy/demon_king.png' },

      // タワー（アーチャー8方向）
      { key: 'tower_archer_u', path: './assets/sprites/ally/archer/archer_u.png' },
      { key: 'tower_archer_d', path: './assets/sprites/ally/archer/archer_d.png' },
      { key: 'tower_archer_l', path: './assets/sprites/ally/archer/archer_l.png' },
      { key: 'tower_archer_r', path: './assets/sprites/ally/archer/archer_r.png' },
      { key: 'tower_archer_lu', path: './assets/sprites/ally/archer/archer_lu.png' },
      { key: 'tower_archer_ld', path: './assets/sprites/ally/archer/archer_ld.png' },
      { key: 'tower_archer_ru', path: './assets/sprites/ally/archer/archer_ru.png' },
      { key: 'tower_archer_rd', path: './assets/sprites/ally/archer/archer_rd.png' },

      // タワー（剣士4方向）
      { key: 'tower_solder_u', path: './assets/sprites/ally/solder/solder_u.png' },
      { key: 'tower_solder_d', path: './assets/sprites/ally/solder/solder_d.png' },
      { key: 'tower_solder_l', path: './assets/sprites/ally/solder/solder_l.png' },
      { key: 'tower_solder_r', path: './assets/sprites/ally/solder/solder_r.png' },

      // 基地
      { key: 'base_tower', path: './assets/sprites/ally/tower.png' }
    ];

    const success = await this.assetLoader.loadAll(imageList, []);

    if (success) {
      this.loadingDiv.classList.add('hidden');
      this.showTitleScreen();
    } else {
      this.loadingDiv.textContent = 'Failed to load assets!';
    }
  }

  /**
   * タイトル画面を表示
   */
  showTitleScreen() {
    this.gameState = GAME_STATE.TITLE;

    // ゲームループを開始（タイトル画面の描画用）
    this.engine.start(
      (dt) => this.update(dt),
      () => this.render()
    );
  }

  /**
   * ゲーム開始
   */
  startGame() {
    // 基地を初期化
    const goalPos = tileToWorld(this.gameMap.goal.x, this.gameMap.goal.y);
    this.base = new Base(goalPos.x, goalPos.y, 50);

    // ステージデータをロード
    const stageData = this.stageManager.getCurrentStageData();
    this.economy.setGold(stageData.startGold);
    this.waveManager.loadStageWaves(stageData);

    // 最初のウェーブを開始
    this.waveManager.startNextWave();

    // ゲーム状態を変更
    this.gameState = GAME_STATE.PLAYING;
  }

  /**
   * 更新
   */
  update(deltaTime) {
    if (this.gameState !== GAME_STATE.PLAYING) return;

    // ウェーブ管理
    this.waveManager.update(deltaTime, this.enemies);

    // 敵の更新
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime);

      // 基地への攻撃
      if (enemy.attackingBase) {
        enemy.attackBase(this.base, deltaTime);
      }
    });

    // 死んだ敵を削除＆報酬
    this.enemies = this.enemies.filter(enemy => {
      if (!enemy.alive) {
        this.economy.addGold(enemy.bounty);
        return false;
      }
      return true;
    });

    // タワーの更新
    this.towers.forEach(tower => {
      tower.update(deltaTime, this.enemies, this.projectiles);
    });

    // 弾の更新
    this.projectiles.forEach(projectile => {
      projectile.update(deltaTime);
    });

    // 死んだ弾を削除
    this.projectiles = this.projectiles.filter(p => p.alive);

    // 基地が破壊されたらゲームオーバー
    if (!this.base.alive) {
      this.gameState = GAME_STATE.GAME_OVER;
    }

    // ステージクリア判定（Wave Clear待機中でない、かつ全Wave完了、かつ生存敵が0）
    if (
      !this.waveManager.isWaitingForNextWave() &&
      this.waveManager.isAllWavesComplete() &&
      this.enemies.filter(e => e.alive).length === 0
    ) {
      this.stageClear();
    }
  }

  /**
   * 描画
   */
  render() {
    this.renderer.clear();
    this.renderer.fillBackground();

    // タイトル画面
    if (this.gameState === GAME_STATE.TITLE) {
      this.renderTitleScreen();
      return;
    }

    // マップ描画
    this.gameMap.render(this.renderer);

    // 基地描画
    if (this.base) {
      this.base.render(this.renderer, this.assetLoader);
    }

    // タワー描画
    this.towers.forEach(tower => {
      tower.render(this.renderer, this.assetLoader);
    });

    // 敵描画（スプライトのみ）
    this.enemies.forEach(enemy => {
      enemy.renderSprite(this.renderer, this.assetLoader);
    });

    // 弾描画
    this.projectiles.forEach(projectile => {
      projectile.render(this.renderer);
    });

    // 敵のHPバー・HP数値を最前面に描画
    this.enemies.forEach(enemy => {
      enemy.renderHealthBar(this.renderer);
    });

    // UI描画
    if (this.base) {
      // 下部HUD（タワー選択）
      this.ui.renderHUD(this.renderer, TOWER_TYPES, this.assetLoader);

      // 右側サイドバー（ゲーム情報）
      this.ui.renderSidebar(this.renderer, this.economy, this.base, this.stageManager, this.waveManager, this.engine.gameSpeed);

      // タイルハイライト（マウスホバー時）
      const mousePos = this.inputManager.getMousePosition();
      const tile = worldToTile(mousePos.x, mousePos.y);

      // フィールド内のタイルハイライト
      if (tile.y < 10 && tile.x < 10) {
        const existingTower = this.getTowerAtTile(tile.x, tile.y);
        const canBuild = canBuildOnTile(tile.x, tile.y);

        // 既存タワーがある場合、アップグレードコストと範囲を表示
        if (existingTower) {
          // 攻撃範囲を描画
          this.renderer.drawCircle(existingTower.pos.x, existingTower.pos.y, existingTower.range, 'rgba(255, 200, 100, 0.2)', true);
          this.renderer.drawCircle(existingTower.pos.x, existingTower.pos.y, existingTower.range, 'rgba(255, 200, 100, 0.5)', false, 2);

          // タイルハイライトとアップグレードコスト表示
          this.ui.renderTileHighlight(this.renderer, tile.x, tile.y, TILE_SIZE, false, existingTower.upgradeCost, true);
        }
        // 建設可能な場合、選択中のタワーの建設コストと範囲を表示
        else if (canBuild) {
          const selectedType = this.ui.getSelectedTowerType() || 'archer';
          const towerType = TOWER_TYPES[selectedType];
          if (towerType) {
            // 建設予定位置の中心座標を計算
            const centerX = tile.x * TILE_SIZE + TILE_SIZE / 2;
            const centerY = tile.y * TILE_SIZE + TILE_SIZE / 2;

            // 攻撃範囲を描画
            this.renderer.drawCircle(centerX, centerY, towerType.range, 'rgba(100, 200, 255, 0.2)', true);
            this.renderer.drawCircle(centerX, centerY, towerType.range, 'rgba(100, 200, 255, 0.5)', false, 2);

            // タイルハイライトとコスト表示
            this.ui.renderTileHighlight(this.renderer, tile.x, tile.y, TILE_SIZE, canBuild, towerType.cost, false);
          }
        }
        // 建設不可の場合
        else {
          this.ui.renderTileHighlight(this.renderer, tile.x, tile.y, TILE_SIZE, canBuild, null, false);
        }
      }
    }

    // Wave Clear メッセージ表示
    if (this.waveManager.isWaitingForNextWave()) {
      const currentWave = this.waveManager.currentWave;
      const timeRemaining = this.waveManager.getWaveClearTimeRemaining();

      // 半透明の背景
      this.renderer.drawRect(0, 0, this.canvas.width, this.canvas.height, 'rgba(0,0,0,0.5)', true);

      // Wave Clear メッセージ
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      this.renderer.drawText(
        `Wave ${currentWave} Clear!!!`,
        centerX,
        centerY - 30,
        48,
        '#4ecca3',
        'center'
      );

      // カウントダウン表示
      const countdown = Math.ceil(timeRemaining);
      this.renderer.drawText(
        `${countdown}秒後に開始`,
        centerX,
        centerY + 30,
        32,
        '#ffffff',
        'center'
      );
    }

    // ゲームオーバー/クリア画面
    if (this.gameState === GAME_STATE.GAME_OVER) {
      this.ui.renderGameOver(this.renderer);
    } else if (this.gameState === GAME_STATE.STAGE_CLEAR) {
      const bonusGold = this.stageManager.getCurrentStageData().clearBonusGold;
      this.ui.renderStageClear(this.renderer, bonusGold);
    } else if (this.gameState === GAME_STATE.ALL_CLEAR) {
      this.ui.renderAllClear(this.renderer);
    }
  }

  /**
   * タイトル画面を描画
   */
  renderTitleScreen() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // 背景を暗くする
    this.renderer.drawRect(0, 0, this.canvas.width, this.canvas.height, 'rgba(0,0,0,0.8)', true);

    // タイトル
    this.renderer.drawText('TOWER DEFENSE', centerX, centerY - 200, 48, '#4ecca3', 'center');

    // サブタイトル
    this.renderer.drawText('基地を守り抜け！', centerX, centerY - 150, 24, '#ffffff', 'center');

    // タワー情報表示
    this.renderTowerInfo();

    // 開始ボタンエリア（点滅効果）
    const time = Date.now() / 1000;
    const alpha = 0.5 + Math.sin(time * 3) * 0.3;
    this.renderer.drawText(
      'クリックしてスタート',
      centerX,
      centerY + 180,
      32,
      `rgba(255, 235, 59, ${alpha})`,
      'center'
    );

    // 操作説明
    this.renderer.drawText('操作方法:', centerX, centerY + 240, 18, '#aaaaaa', 'center');
    this.renderer.drawText('クリック: タワー建設/レベルアップ', centerX, centerY + 265, 14, '#888888', 'center');
    this.renderer.drawText('速度ボタン: ゲーム速度変更 (×1/×2/×4)', centerX, centerY + 285, 14, '#888888', 'center');

    // クレジット
    this.renderer.drawText('Tower Defense Game v1.0', centerX, this.canvas.height - 30, 12, '#666666', 'center');
  }

  /**
   * タワー情報を表示
   */
  renderTowerInfo() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const towerOrder = ['solder', 'archer'];

    towerOrder.forEach((towerKey, index) => {
      const towerType = TOWER_TYPES[towerKey];
      const xOffset = (index === 0 ? -180 : 180); // 剣士は左、アーチャーは右
      const x = centerX + xOffset;
      const y = centerY - 20;

      // タワー画像
      const spriteKey = towerKey === 'solder' ? `tower_${towerKey}_d` : `tower_${towerKey}_rd`;
      const img = this.assetLoader.getImage(spriteKey);
      if (img) {
        this.renderer.drawImage(img, x, y - 40, 64, 64, true);
      }

      // タワー名
      const towerName = towerKey === 'solder' ? '剣士' : 'アーチャー';
      this.renderer.drawText(towerName, x, y + 45, 20, '#ffd93d', 'center');

      // ステータス表示
      const stats = [
        `コスト: ${towerType.cost}G`,
        `ダメージ: ${towerType.damage}`,
        `射程: 半径${Math.round(towerType.range / 100)}マス`,
        `連射速度: ${towerType.fireRate.toFixed(1)}/s`
      ];

      stats.forEach((stat, i) => {
        this.renderer.drawText(stat, x, y + 70 + i * 20, 14, '#cccccc', 'center');
      });
    });
  }

  /**
   * 入力ハンドラー設定
   */
  setupInputHandlers() {
    this.inputManager.onClick((pos) => {
      // タイトル画面でクリックしたらゲーム開始
      if (this.gameState === GAME_STATE.TITLE) {
        this.startGame();
        return;
      }

      // ゲームオーバー画面：リスタートボタン
      if (this.gameState === GAME_STATE.GAME_OVER) {
        const restartButton = this.ui.getRestartButtonBounds();
        if (this.ui.isPointInButton(pos.x, pos.y, restartButton)) {
          this.restart();
        }
        return;
      }

      // ステージクリア画面：次ステージボタン
      if (this.gameState === GAME_STATE.STAGE_CLEAR) {
        const nextStageButton = this.ui.getNextStageButtonBounds();
        if (this.ui.isPointInButton(pos.x, pos.y, nextStageButton)) {
          this.nextStage();
        }
        return;
      }

      // 全ステージクリア画面：リスタートボタン
      if (this.gameState === GAME_STATE.ALL_CLEAR) {
        const restartButton = this.ui.getRestartButtonBounds();
        if (this.ui.isPointInButton(pos.x, pos.y, restartButton)) {
          this.restart();
        }
        return;
      }

      if (this.gameState !== GAME_STATE.PLAYING) return;

      const tile = worldToTile(pos.x, pos.y);

      // HUD領域のクリック（タワー選択）
      const hudY = this.canvas.height - this.ui.hudHeight;
      if (pos.y >= hudY && pos.x < this.fieldWidth) {
        this.handleHUDClick(pos);
        return;
      }

      // サイドバー領域のクリック
      if (pos.x >= this.fieldWidth) {
        this.handleSidebarClick(pos);
        return;
      }

      // 既存タワーのクリック判定（レベルアップ）
      const existingTower = this.getTowerAtTile(tile.x, tile.y);
      if (existingTower && tile.x < 10 && tile.y < 10) {
        this.upgradeTower(existingTower);
        return;
      }

      // マップ上のクリック（タワー建設）
      if (tile.x < 10 && tile.y < 10 && canBuildOnTile(tile.x, tile.y)) {
        this.buildTower(tile.x, tile.y);
      }
    });
  }

  /**
   * HUDクリック処理（タワー選択）
   */
  handleHUDClick(pos) {
    const towerButtons = this.ui.getTowerButtonBounds(TOWER_TYPES);

    towerButtons.forEach(button => {
      if (this.ui.isPointInButton(pos.x, pos.y, button)) {
        this.ui.setSelectedTowerType(button.key);
        console.log(`Selected tower type: ${button.key}`);
      }
    });
  }

  /**
   * サイドバークリック処理（速度変更）
   */
  handleSidebarClick(pos) {
    // スピード変更ボタン
    const speedButton = this.ui.getSpeedButtonBounds();
    if (this.ui.isPointInButton(pos.x, pos.y, speedButton)) {
      this.toggleSpeed();
      return;
    }
  }

  /**
   * タワー建設
   */
  buildTower(tileX, tileY) {
    const selectedType = this.ui.getSelectedTowerType() || 'archer';
    const towerType = TOWER_TYPES[selectedType];

    if (!towerType) return;

    // 同じマスに既にタワーがあるかチェック
    if (this.getTowerAtTile(tileX, tileY)) {
      console.log('A tower already exists at this location!');
      return;
    }

    if (this.economy.canAfford(towerType.cost)) {
      const worldPos = tileToWorld(tileX, tileY);
      const tower = new Tower(towerType, tileX, tileY, worldPos.x, worldPos.y);

      this.towers.push(tower);
      this.economy.spendGold(towerType.cost);

      console.log(`Tower built at (${tileX}, ${tileY})`);
    } else {
      console.log('Not enough gold!');
    }
  }

  /**
   * 指定タイルにあるタワーを取得
   */
  getTowerAtTile(tileX, tileY) {
    return this.towers.find(tower =>
      tower.tile.x === tileX && tower.tile.y === tileY
    );
  }

  /**
   * タワーをアップグレード
   */
  upgradeTower(tower) {
    if (!tower || !tower.alive) return;

    if (this.economy.canAfford(tower.upgradeCost)) {
      this.economy.spendGold(tower.upgradeCost);
      tower.upgrade();
      console.log(`Tower upgraded to level ${tower.level}! (Damage: ${tower.damage}, Range: ${tower.range})`);
    } else {
      console.log(`Not enough gold! Need ${tower.upgradeCost}G for upgrade.`);
    }
  }

  /**
   * ゲームスピードを切り替え (0.5 → 1.0 → 2.0 → 0.5...)
   */
  toggleSpeed() {
    if (this.engine.gameSpeed === 0.5) {
      this.engine.setGameSpeed(1.0);
    } else if (this.engine.gameSpeed === 1.0) {
      this.engine.setGameSpeed(2.0);
    } else {
      this.engine.setGameSpeed(0.5);
    }
  }

  /**
   * ステージクリア
   */
  stageClear() {
    const bonusGold = this.stageManager.getCurrentStageData().clearBonusGold;
    this.economy.addGold(bonusGold);

    // 次のステージがあるかチェック
    const nextStageNumber = this.stageManager.getCurrentStageNumber() + 1;
    if (this.stageManager.hasStage(nextStageNumber)) {
      // 次のステージがある場合はステージクリア画面を表示
      this.gameState = GAME_STATE.STAGE_CLEAR;
      console.log('Stage Clear!');
    } else {
      // 最後のステージの場合は直接全クリア画面を表示
      this.gameState = GAME_STATE.ALL_CLEAR;
      console.log('All stages cleared!');
    }
  }

  /**
   * 次のステージへ
   */
  nextStage() {
    this.stageManager.nextStage();

    if (this.stageManager.hasStage(this.stageManager.getCurrentStageNumber())) {
      // ステージデータをロード
      const stageData = this.stageManager.getCurrentStageData();
      this.waveManager.loadStageWaves(stageData);

      // 基地HPを回復（オプション）
      this.base.hp = this.base.maxHp;

      // 敵と弾をクリア
      this.enemies = [];
      this.projectiles = [];

      // 最初のウェーブを開始
      this.waveManager.startNextWave();

      this.gameState = GAME_STATE.PLAYING;
    } else {
      // 全ステージクリア
      this.gameState = GAME_STATE.ALL_CLEAR;
      console.log('All stages cleared!');
    }
  }

  /**
   * ゲームをリスタート
   */
  restart() {
    this.stageManager.resetStage();
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.base = null;

    // タイトル画面に戻る
    this.gameState = GAME_STATE.TITLE;
  }

  /**
   * キーボードハンドラー設定（PC用補助機能として残す）
   */
  setupKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      // P - ポーズ（PC用）
      if (e.key === 'p' || e.key === 'P') {
        if (this.gameState === GAME_STATE.PLAYING) {
          this.engine.togglePause();
        }
      }
    });
  }
}

/**
 * ゲーム起動
 */
window.addEventListener('DOMContentLoaded', () => {
  const game = new TowerDefenseGame();
  game.init();
});
