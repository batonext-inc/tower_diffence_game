/**
 * レンダラー - Canvas描画ユーティリティ
 */

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
  }

  /**
   * キャンバスをクリア
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 背景色で塗りつぶし
   */
  fillBackground(color = '#16213e') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 画像を描画
   */
  drawImage(image, x, y, width, height, centered = true) {
    if (!image || !image.complete) return;

    const drawX = centered ? x - width / 2 : x;
    const drawY = centered ? y - height / 2 : y;

    this.ctx.drawImage(image, drawX, drawY, width, height);
  }

  /**
   * 回転した画像を描画
   */
  drawRotatedImage(image, x, y, width, height, angle) {
    if (!image || !image.complete) return;

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    this.ctx.drawImage(image, -width / 2, -height / 2, width, height);
    this.ctx.restore();
  }

  /**
   * 矩形を描画
   */
  drawRect(x, y, width, height, color, filled = true) {
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;

    if (filled) {
      this.ctx.fillRect(x, y, width, height);
    } else {
      this.ctx.strokeRect(x, y, width, height);
    }
  }

  /**
   * 円を描画
   */
  drawCircle(x, y, radius, color, filled = true, lineWidth = 1) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;

    if (filled) {
      this.ctx.fill();
    } else {
      this.ctx.lineWidth = lineWidth;
      this.ctx.stroke();
    }
  }

  /**
   * テキストを描画
   */
  drawText(text, x, y, fontSize = 16, color = '#fff', align = 'left') {
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.fillText(text, x, y);
  }

  /**
   * オフスクリーンキャンバスを作成（静的レイヤー用）
   */
  createOffscreenCanvas(width, height) {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    return { canvas: this.offscreenCanvas, ctx: this.offscreenCtx };
  }

  /**
   * オフスクリーンキャンバスを描画
   */
  drawOffscreenCanvas(x = 0, y = 0) {
    if (this.offscreenCanvas) {
      this.ctx.drawImage(this.offscreenCanvas, x, y);
    }
  }

  /**
   * グリッドを描画（デバッグ用）
   */
  drawGrid(tileSize, rows, cols, color = 'rgba(255,255,255,0.1)') {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;

    for (let row = 0; row <= rows; row++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, row * tileSize);
      this.ctx.lineTo(cols * tileSize, row * tileSize);
      this.ctx.stroke();
    }

    for (let col = 0; col <= cols; col++) {
      this.ctx.beginPath();
      this.ctx.moveTo(col * tileSize, 0);
      this.ctx.lineTo(col * tileSize, rows * tileSize);
      this.ctx.stroke();
    }
  }
}
