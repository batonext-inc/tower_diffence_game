/**
 * 入力管理 - マウス/タッチイベント
 */

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.mousePos = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.clickHandlers = [];
    this.mouseMoveHandlers = [];

    this.init();
  }

  /**
   * イベントリスナーを初期化
   */
  init() {
    // マウスイベント
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));

    // タッチイベント（スマホ対応）
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  /**
   * キャンバス座標を取得
   */
  getCanvasPosition(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  /**
   * マウス移動
   */
  handleMouseMove(e) {
    this.mousePos = this.getCanvasPosition(e.clientX, e.clientY);
    this.mouseMoveHandlers.forEach(handler => handler(this.mousePos));
  }

  /**
   * マウスダウン
   */
  handleMouseDown(e) {
    this.isMouseDown = true;
    this.mousePos = this.getCanvasPosition(e.clientX, e.clientY);
  }

  /**
   * マウスアップ
   */
  handleMouseUp(e) {
    this.isMouseDown = false;
  }

  /**
   * クリック
   */
  handleClick(e) {
    const pos = this.getCanvasPosition(e.clientX, e.clientY);
    this.clickHandlers.forEach(handler => handler(pos));
  }

  /**
   * タッチ開始
   */
  handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.isMouseDown = true;
      this.mousePos = this.getCanvasPosition(touch.clientX, touch.clientY);
    }
  }

  /**
   * タッチ移動
   */
  handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.mousePos = this.getCanvasPosition(touch.clientX, touch.clientY);
      this.mouseMoveHandlers.forEach(handler => handler(this.mousePos));
    }
  }

  /**
   * タッチ終了
   */
  handleTouchEnd(e) {
    e.preventDefault();
    this.isMouseDown = false;
    this.clickHandlers.forEach(handler => handler(this.mousePos));
  }

  /**
   * クリックハンドラーを登録
   */
  onClick(handler) {
    this.clickHandlers.push(handler);
  }

  /**
   * マウス移動ハンドラーを登録
   */
  onMouseMove(handler) {
    this.mouseMoveHandlers.push(handler);
  }

  /**
   * 現在のマウス位置を取得
   */
  getMousePosition() {
    return this.mousePos;
  }
}
