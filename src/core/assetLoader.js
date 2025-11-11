/**
 * アセットローダー - 画像と音声の読み込み管理
 */

export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.audioBuffers = new Map();
    this.loaded = false;
    this.currentBGMSource = null; // 現在再生中のBGM
    this.activeSfxSources = new Set(); // 現在再生中の効果音
    this.masterVolume = 1.0; // マスターボリューム（0.0～1.0）
    this.audioContext = null;
    this.masterGainNode = null;
    this.bgmGainNode = null;
    this.sfxGainNode = null;

    // ポリフォニー制限用
    this.playingCounts = new Map(); // key -> 現在再生中の数
    this.maxPolyphony = new Map(); // key -> 最大同時再生数
    this.defaultMaxPolyphony = 8; // デフォルト上限
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
   * AudioContext を初期化
   */
  ensureAudioContext() {
    if (typeof window === 'undefined') return null;

    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API is not supported in this browser.');
        return null;
      }

      this.audioContext = new AudioContextClass();

      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.value = this.masterVolume;
      this.masterGainNode.connect(this.audioContext.destination);

      this.bgmGainNode = this.audioContext.createGain();
      this.bgmGainNode.gain.value = 1.0;
      this.bgmGainNode.connect(this.masterGainNode);

      this.sfxGainNode = this.audioContext.createGain();
      this.sfxGainNode.gain.value = 1.0;
      this.sfxGainNode.connect(this.masterGainNode);
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  /**
   * 音声を読み込み
   */
  async loadSound(key, path) {
    const audioContext = this.ensureAudioContext();
    if (!audioContext) {
      throw new Error('Web Audio API is not available.');
    }

    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch sound: ${path}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await new Promise((resolve, reject) => {
      audioContext.decodeAudioData(arrayBuffer, resolve, reject);
    });

    this.audioBuffers.set(key, audioBuffer);
    return audioBuffer;
  }

  /**
   * 複数の音声を一括読み込み
   */
  async loadSounds(soundList) {
    if (!soundList || soundList.length === 0) return [];
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
   * 特定の効果音の最大同時再生数を設定
   */
  setMaxPolyphony(key, max) {
    this.maxPolyphony.set(key, max);
  }

  /**
   * 音声を再生
   */
  playSound(key, volume = 1.0, loop = false) {
    if (this.masterVolume === 0) return; // マスターボリュームが0なら再生しない

    const buffer = this.audioBuffers.get(key);
    if (!buffer) return;

    const audioContext = this.ensureAudioContext();
    if (!audioContext || !this.sfxGainNode) return;

    // ポリフォニー上限チェック
    const currentCount = this.playingCounts.get(key) || 0;
    const maxCount = this.maxPolyphony.get(key) || this.defaultMaxPolyphony;

    if (currentCount >= maxCount) {
      // 上限に達している場合は再生をスキップ
      return;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1, volume));

    source.connect(gainNode);
    gainNode.connect(this.sfxGainNode);

    // 再生カウントを増やす
    this.playingCounts.set(key, currentCount + 1);

    source.start(0);

    const cleanup = () => {
      source.disconnect();
      gainNode.disconnect();
      this.activeSfxSources.delete(source);
      source.removeEventListener('ended', cleanup);

      // 再生カウントを減らす
      const count = this.playingCounts.get(key) || 1;
      this.playingCounts.set(key, Math.max(0, count - 1));
    };

    source.addEventListener('ended', cleanup);
    this.activeSfxSources.add(source);
  }

  /**
   * BGMを再生（ループ）
   */
  playBGM(key, volume = 1.0) {
    if (this.masterVolume === 0) return; // マスターボリュームが0なら再生しない

    const buffer = this.audioBuffers.get(key);
    if (!buffer) return;

    const audioContext = this.ensureAudioContext();
    if (!audioContext || !this.bgmGainNode) return;

    this.stopBGM();

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    this.bgmGainNode.gain.value = Math.max(0, Math.min(1, volume));

    source.connect(this.bgmGainNode);
    source.start(0);

    source.addEventListener('ended', () => {
      if (this.currentBGMSource === source) {
        this.currentBGMSource = null;
      }
    });

    this.currentBGMSource = source;
  }

  /**
   * BGMを停止
   */
  stopBGM() {
    if (this.currentBGMSource) {
      try {
        this.currentBGMSource.stop(0);
      } catch (_) {
        // ignore
      }
      this.currentBGMSource.disconnect();
      this.currentBGMSource = null;
    }
  }

  /**
   * すべての再生中の効果音・ファンファーレを停止
   */
  stopAllSounds() {
    this.activeSfxSources.forEach(source => {
      try {
        source.stop(0);
      } catch (_) {
        // ignore
      }
      source.disconnect();
    });
    this.activeSfxSources.clear();
  }

  /**
   * すべての音（BGM + 効果音）を停止
   */
  stopAllAudio() {
    this.stopBGM();
    this.stopAllSounds();
  }

  /**
   * マスターボリュームを設定（0.0～1.0）
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.masterVolume;
    }
  }

  /**
   * マスターボリュームを取得
   */
  getMasterVolume() {
    return this.masterVolume;
  }

  /**
   * 読み込み済みかチェック
   */
  isLoaded() {
    return this.loaded;
  }
}
