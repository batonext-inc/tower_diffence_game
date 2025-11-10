/**
 * UI管理 - HUD、ビルドメニュー等
 */

export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.hudHeight = 80;
    this.sidebarWidth = 200;
    this.fieldWidth = 640; // TILE_SIZE * 10
    this.selectedTowerType = 'solder'; // デフォルトで剣士を選択
    this.hoveredTile = null;
  }

  /**
   * HUDを描画（下部：タワー選択UI）
   */
  renderHUD(renderer, towerTypes, assetLoader) {
    const ctx = renderer.ctx;
    const hudY = this.canvas.height - this.hudHeight;

    // HUD背景（フィールド部分のみ）
    renderer.drawRect(0, hudY, this.fieldWidth, this.hudHeight, 'rgba(0,0,0,0.7)', true);

    // タイトル
    renderer.drawText('タワー選択', 20, hudY + 20, 16, '#4ecca3', 'left');

    // タワーボタン（順番を剣士→アーチャーに変更）
    const towerOrder = ['solder', 'archer'];
    let buttonX = 20;
    const buttonY = hudY + 35;
    const buttonWidth = 140;
    const buttonHeight = 35;
    const buttonSpacing = 10;

    towerOrder.forEach(key => {
      if (!towerTypes[key]) return;

      const tower = towerTypes[key];
      const isSelected = this.selectedTowerType === key;

      // ボタン背景
      const bgColor = isSelected ? 'rgba(78, 204, 163, 0.8)' : 'rgba(60, 60, 60, 0.8)';
      renderer.drawRect(buttonX, buttonY, buttonWidth, buttonHeight, bgColor, true);

      // ボタン枠
      ctx.strokeStyle = isSelected ? '#4ecca3' : '#666';
      ctx.lineWidth = 2;
      ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

      // タワー画像（右向き *_r.png）
      const spriteKey = `${tower.spriteId}_r`;
      const img = assetLoader.getImage(spriteKey);
      if (img) {
        renderer.drawImage(img, buttonX + 10, buttonY + buttonHeight / 2, 28, 28, true);
      }

      // タワー名（日本語）
      const towerName = key === 'archer' ? 'アーチャー' : key === 'solder' ? '剣士' : key;
      renderer.drawText(towerName, buttonX + 45, buttonY + 13, 14, '#fff', 'left');

      // コスト表示
      renderer.drawText(`${tower.cost}G`, buttonX + 45, buttonY + 28, 12, '#ffd93d', 'left');

      buttonX += buttonWidth + buttonSpacing;
    });
  }

  /**
   * サイドバーを描画（右側：ゲーム情報と速度ボタン）
   */
  renderSidebar(renderer, economy, base, stageManager, waveManager, gameSpeed) {
    const sidebarX = this.fieldWidth;
    const sidebarY = 0;
    const sidebarHeight = this.canvas.height;

    // サイドバー背景
    renderer.drawRect(sidebarX, sidebarY, this.sidebarWidth, sidebarHeight, 'rgba(0,0,0,0.9)', true);

    // タイトル
    renderer.drawText('ゲーム情報', sidebarX + this.sidebarWidth / 2, 30, 18, '#4ecca3', 'center');

    // ゴールド表示
    renderer.drawText('Gold', sidebarX + this.sidebarWidth / 2, 60, 14, '#ffd93d', 'center');
    renderer.drawText(`${economy.getGold()}G`, sidebarX + this.sidebarWidth / 2, 80, 20, '#ffffff', 'center');

    // 基地HP表示
    renderer.drawText('Base HP', sidebarX + this.sidebarWidth / 2, 110, 14, '#e74c3c', 'center');
    renderer.drawText(`${base.hp}/${base.maxHp}`, sidebarX + this.sidebarWidth / 2, 130, 20, '#ffffff', 'center');

    // ステージ表示
    renderer.drawText('Stage', sidebarX + this.sidebarWidth / 2, 160, 14, '#4ecca3', 'center');
    renderer.drawText(`${stageManager.getCurrentStageNumber()}`, sidebarX + this.sidebarWidth / 2, 180, 20, '#ffffff', 'center');

    // ウェーブ表示
    const currentWave = waveManager.getCurrentWaveNumber();
    const totalWaves = waveManager.getTotalWaves();
    renderer.drawText('Wave', sidebarX + this.sidebarWidth / 2, 210, 14, '#fff', 'center');
    renderer.drawText(`${currentWave}/${totalWaves}`, sidebarX + this.sidebarWidth / 2, 230, 20, '#ffffff', 'center');

    // スピード変更ボタン
    const speedButtonY = 270;
    const speedButtonHeight = 40;
    renderer.drawRect(sidebarX + 10, speedButtonY, this.sidebarWidth - 20, speedButtonHeight, 'rgba(100,100,100,0.8)', true);
    renderer.ctx.strokeStyle = '#4ecca3';
    renderer.ctx.lineWidth = 2;
    renderer.ctx.strokeRect(sidebarX + 10, speedButtonY, this.sidebarWidth - 20, speedButtonHeight);

    let speedText = '';
    if (gameSpeed === 0.5) speedText = '速度変更: ×1';
    else if (gameSpeed === 1.0) speedText = '速度変更: ×2';
    else if (gameSpeed === 2.0) speedText = '速度変更: ×4';
    renderer.drawText(speedText, sidebarX + this.sidebarWidth / 2, speedButtonY + speedButtonHeight / 2 + 5, 16, '#ffffff', 'center');
  }  /**
   * ビルドメニューを描画（簡易版）
   */
  renderBuildMenu(renderer, towerTypes) {
    // 右側にタワー選択UI
    const menuX = this.canvas.width - 150;
    const menuY = 20;

    renderer.drawRect(menuX, menuY, 140, 200, 'rgba(0,0,0,0.8)', true);
    renderer.drawText('タワー建設', menuX + 70, menuY + 25, 16, '#fff', 'center');

    let offsetY = 50;
    Object.keys(towerTypes).forEach(key => {
      const tower = towerTypes[key];
      const color = this.selectedTowerType === key ? '#4ecca3' : '#fff';

      // タワー名を日本語に変換
      const towerName = key === 'archer' ? 'アーチャー' : key;

      renderer.drawText(
        `${towerName}: ${tower.cost}G`,
        menuX + 10, menuY + offsetY, 14, color, 'left'
      );

      offsetY += 30;
    });
  }

  /**
   * ゲームオーバー画面
   */
  renderGameOver(renderer) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    renderer.drawRect(0, 0, this.canvas.width, this.canvas.height, 'rgba(0,0,0,0.8)', true);
    renderer.drawText('ゲームオーバー', centerX, centerY - 60, 48, '#e74c3c', 'center');

    // リスタートボタン
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = centerX - buttonWidth / 2;
    const buttonY = centerY + 20;

    renderer.drawRect(buttonX, buttonY, buttonWidth, buttonHeight, '#e74c3c', true);
    renderer.ctx.strokeStyle = '#ffffff';
    renderer.ctx.lineWidth = 2;
    renderer.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

    renderer.drawText('リスタート', centerX, buttonY + buttonHeight / 2 + 8, 24, '#ffffff', 'center');
  }

  /**
   * ステージクリア画面
   */
  renderStageClear(renderer, bonusGold) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    renderer.drawRect(0, 0, this.canvas.width, this.canvas.height, 'rgba(0,0,0,0.8)', true);
    renderer.drawText('ステージクリア！', centerX, centerY - 80, 48, '#4ecca3', 'center');
    renderer.drawText(`ボーナス: +${bonusGold}G`, centerX, centerY - 20, 24, '#ffd93d', 'center');

    // 次のステージボタン
    const buttonWidth = 220;
    const buttonHeight = 50;
    const buttonX = centerX - buttonWidth / 2;
    const buttonY = centerY + 30;

    renderer.drawRect(buttonX, buttonY, buttonWidth, buttonHeight, '#4ecca3', true);
    renderer.ctx.strokeStyle = '#ffffff';
    renderer.ctx.lineWidth = 2;
    renderer.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

    renderer.drawText('次のステージへ', centerX, buttonY + buttonHeight / 2 + 8, 24, '#ffffff', 'center');
  }

  /**
   * 全ステージクリア画面
   */
  renderAllClear(renderer) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    renderer.drawRect(0, 0, this.canvas.width, this.canvas.height, 'rgba(0,0,0,0.9)', true);

    // Congratulations!!! (大きく表示)
    renderer.drawText('Congratulations!!!', centerX, centerY - 100, 56, '#ffd93d', 'center');

    // 全ステージクリアメッセージ
    renderer.drawText('全ステージクリア！', centerX, centerY - 30, 32, '#4ecca3', 'center');
    renderer.drawText('おめでとうございます！', centerX, centerY + 10, 24, '#ffffff', 'center');

    // リスタートボタン
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = centerX - buttonWidth / 2;
    const buttonY = centerY + 70;

    renderer.drawRect(buttonX, buttonY, buttonWidth, buttonHeight, '#ffd93d', true);
    renderer.ctx.strokeStyle = '#ffffff';
    renderer.ctx.lineWidth = 2;
    renderer.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

    renderer.drawText('最初から遊ぶ', centerX, buttonY + buttonHeight / 2 + 8, 24, '#000000', 'center');
  }

  /**
   * タイルハイライト
   */
  renderTileHighlight(renderer, tileX, tileY, tileSize, canBuild, cost = null, isUpgrade = false) {
    const x = tileX * tileSize;
    const y = tileY * tileSize;

    // ハイライトの色を設定
    let color;
    if (isUpgrade) {
      color = 'rgba(255,200,0,0.3)'; // アップグレード：オレンジ
    } else {
      color = canBuild ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)';
    }

    renderer.drawRect(x, y, tileSize, tileSize, color, true);

    // コストを表示（建設またはアップグレード）
    if (cost !== null) {
      const centerX = x + tileSize / 2;
      const centerY = y + tileSize / 2;

      // 背景（半透明の黒）
      const bgWidth = isUpgrade ? 70 : 45;
      renderer.drawRect(centerX - bgWidth / 2, centerY - 10, bgWidth, 20, 'rgba(0,0,0,0.8)', true);

      // コストテキスト（サイズを小さく）
      const label = isUpgrade ? 'UP: ' : '';
      renderer.drawText(`${label}${cost}G`, centerX, centerY + 5, 13, '#ffd93d', 'center');
    }
  }

  /**
   * 選択されたタワータイプを設定
   */
  setSelectedTowerType(type) {
    this.selectedTowerType = type;
  }

  /**
   * 選択されたタワータイプを取得
   */
  getSelectedTowerType() {
    return this.selectedTowerType;
  }

  /**
   * スピードボタンの領域を取得（サイドバー内）
   */
  getSpeedButtonBounds() {
    const sidebarX = this.fieldWidth;
    const speedButtonY = 270;
    return {
      x: sidebarX + 10,
      y: speedButtonY,
      width: this.sidebarWidth - 20,
      height: 40
    };
  }

  /**
   * タワー選択ボタンの領域を取得
   */
  getTowerButtonBounds(towerTypes) {
    const hudY = this.canvas.height - this.hudHeight;
    const buttons = [];
    const towerOrder = ['solder', 'archer']; // 剣士→アーチャーの順
    let buttonX = 20;
    const buttonY = hudY + 35;
    const buttonWidth = 140;
    const buttonHeight = 35;
    const buttonSpacing = 10;

    towerOrder.forEach(key => {
      if (!towerTypes[key]) return;

      buttons.push({
        key: key,
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
      });
      buttonX += buttonWidth + buttonSpacing;
    });

    return buttons;
  }

  /**
   * ゲームオーバーのリスタートボタン領域を取得
   */
  getRestartButtonBounds() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const buttonWidth = 200;
    const buttonHeight = 50;
    return {
      x: centerX - buttonWidth / 2,
      y: centerY + 70,
      width: buttonWidth,
      height: buttonHeight
    };
  }

  /**
   * ステージクリアの次ステージボタン領域を取得
   */
  getNextStageButtonBounds() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const buttonWidth = 220;
    const buttonHeight = 50;
    return {
      x: centerX - buttonWidth / 2,
      y: centerY + 30,
      width: buttonWidth,
      height: buttonHeight
    };
  }

  /**
   * 座標がボタン内かチェック
   */
  isPointInButton(x, y, button) {
    return x >= button.x && x <= button.x + button.width &&
           y >= button.y && y <= button.y + button.height;
  }
}
