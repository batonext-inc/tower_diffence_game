/**
 * WebRTCManager - 簡易P2P（手動シグナリング）管理
 * - Canvasの映像ストリーム送受信
 * - DataChannel（任意の将来拡張用）
 */

export class WebRTCManager {
  constructor() {
    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
    this.dataChannel = null;
    this.onRemoteStream = null; // (MediaStream) => void
    this.onDataMessage = null;  // (any) => void
    this.isHost = false;
  }

  _ensurePc() {
    if (this.pc) return;
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.pc.onicecandidate = (e) => {
      // ICE候補は最終的なlocalDescriptionに内包されるので、ここではログのみ
      // console.debug('ICE candidate', e.candidate);
    };

    this.pc.ontrack = (e) => {
      // リモート映像受信
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      this.remoteStream.addTrack(e.track);
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    this.pc.ondatachannel = (e) => {
      this._attachDataChannel(e.channel);
    };
  }

  _attachDataChannel(channel) {
    this.dataChannel = channel;
    this.dataChannel.onopen = () => {
      // console.log('Data channel open');
    };
    this.dataChannel.onmessage = (e) => {
      if (this.onDataMessage) {
        try {
          const data = JSON.parse(e.data);
          this.onDataMessage(data);
        } catch {
          this.onDataMessage(e.data);
        }
      }
    };
    this.dataChannel.onclose = () => {
      // console.log('Data channel closed');
    };
  }

  /**
   * Canvasから映像ストリームを作成し、送信トラックとして追加
   */
  async initLocalStreamFromCanvas(canvas, fps = 30) {
    // Safari対応: captureStreamが無い場合はオフスクリーンにミラー
    if (!canvas.captureStream) {
      throw new Error('このブラウザはcanvas.captureStreamに対応していません。');
    }
    this.localStream = canvas.captureStream(fps);
    this._ensurePc();
    for (const track of this.localStream.getTracks()) {
      this.pc.addTrack(track, this.localStream);
    }
  }

  /**
   * ホスト側：Offer生成
   */
  async createOffer() {
    this.isHost = true;
    this._ensurePc();
    // 先にデータチャネル作成
    const dc = this.pc.createDataChannel('data');
    this._attachDataChannel(dc);
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await this.pc.setLocalDescription(offer);
    // ICE収束を待ってからSDPを返す
    await this._waitForIceGatheringComplete();
    return JSON.stringify(this.pc.localDescription);
  }

  /**
   * 参加側：相手のOfferを適用してAnswer生成
   */
  async acceptOfferAndCreateAnswer(offerSdp) {
    this.isHost = false;
    this._ensurePc();
    const remoteDesc = new RTCSessionDescription(JSON.parse(offerSdp));
    await this.pc.setRemoteDescription(remoteDesc);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await this._waitForIceGatheringComplete();
    return JSON.stringify(this.pc.localDescription);
  }

  /**
   * ホスト側：相手のAnswerを適用
   */
  async acceptAnswer(answerSdp) {
    const remoteDesc = new RTCSessionDescription(JSON.parse(answerSdp));
    await this.pc.setRemoteDescription(remoteDesc);
  }

  /**
   * DataChannel送信
   */
  send(data) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.dataChannel.send(payload);
    }
  }

  /**
   * 切断
   */
  stop() {
    try {
      if (this.dataChannel) {
        this.dataChannel.close();
      }
      if (this.pc) {
        this.pc.onicecandidate = null;
        this.pc.ontrack = null;
        this.pc.ondatachannel = null;
        this.pc.getSenders().forEach(sender => {
          try { sender.track && sender.track.stop(); } catch { }
        });
        this.pc.close();
      }
      if (this.localStream) {
        this.localStream.getTracks().forEach(t => t.stop());
      }
    } finally {
      this.pc = null;
      this.dataChannel = null;
      this.localStream = null;
      this.remoteStream = null;
    }
  }

  _waitForIceGatheringComplete() {
    if (!this.pc) return Promise.resolve();
    if (this.pc.iceGatheringState === 'complete') {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const check = () => {
        if (!this.pc) return resolve();
        if (this.pc.iceGatheringState === 'complete') {
          this.pc.removeEventListener('icegatheringstatechange', check);
          resolve();
        }
      };
      this.pc.addEventListener('icegatheringstatechange', check);
      // 念のためタイムアウト
      setTimeout(() => {
        this.pc && this.pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }, 1500);
    });
  }
}


