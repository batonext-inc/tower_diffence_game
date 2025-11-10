/**
 * アセットローダー - 画像と音声の読み込み管理
 */

export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.sounds = new Map();
    this.loaded = false;
  }

  /**
   * 画像を読み込み
   */
  loadImage(key, path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
      img.src = path;
    });
  }

  /**
   * 複数の画像を一括読み込み
   */
  async loadImages(imageList) {
    const promises = imageList.map(({ key, path }) => this.loadImage(key, path));
    return Promise.all(promises);
  }

  /**
   * 音声を読み込み
   */
  loadSound(key, path) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this.sounds.set(key, audio);
        resolve(audio);
      };
      audio.onerror = () => reject(new Error(`Failed to load sound: ${path}`));
      audio.src = path;
    });
  }

  /**
   * 複数の音声を一括読み込み
   */
  async loadSounds(soundList) {
    const promises = soundList.map(({ key, path }) => this.loadSound(key, path));
    return Promise.all(promises);
  }

  /**
   * すべてのアセットを読み込み
   */
  async loadAll(imageList = [], soundList = []) {
    try {
      await this.loadImages(imageList);
      await this.loadSounds(soundList);
      this.loaded = true;
      return true;
    } catch (error) {
      console.error('Asset loading failed:', error);
      return false;
    }
  }

  /**
   * 画像を取得
   */
  getImage(key) {
    return this.images.get(key);
  }

  /**
   * 音声を取得
   */
  getSound(key) {
    return this.sounds.get(key);
  }

  /**
   * 音声を再生
   */
  playSound(key, volume = 1.0) {
    const sound = this.sounds.get(key);
    if (sound) {
      const clone = sound.cloneNode();
      clone.volume = volume;
      clone.play();
    }
  }

  /**
   * 読み込み済みかチェック
   */
  isLoaded() {
    return this.loaded;
  }
}
