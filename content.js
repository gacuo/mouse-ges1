// Mouse Gesture Navigation - Content Script

// ジェスチャー状態管理
let isGesturing = false;
let gesturePoints = [];
let gestureCanvas = null;
let gestureContext = null;

// ジェスチャー認識のための方向定数
const DIRECTIONS = {
  RIGHT: 'R',
  LEFT: 'L',
  UP: 'U',
  DOWN: 'D'
};

// ジェスチャーとアクションのマッピング
const GESTURE_ACTIONS = {
  'L': 'goBack',         // 左へのジェスチャーで戻る
  'R': 'goForward',      // 右へのジェスチャーで進む
  'DR': 'closeTab',      // 下→右のジェスチャーでタブを閉じる
  'UD': 'reloadTab'      // 上→下のジェスチャーでタブを更新
};

// ジェスチャー認識の閾値
const GESTURE_THRESHOLD = 30;  // px

// キャンバス作成関数
function createCanvas() {
  // すでに存在する場合は削除
  removeCanvas();
  
  // キャンバスを作成し設定
  gestureCanvas = document.createElement('canvas');
  gestureCanvas.id = 'mouse-gesture-canvas';
  gestureCanvas.width = window.innerWidth;
  gestureCanvas.height = window.innerHeight;
  gestureCanvas.style.position = 'fixed';
  gestureCanvas.style.top = '0';
  gestureCanvas.style.left = '0';
  gestureCanvas.style.pointerEvents = 'none'; // マウスイベントを透過
  gestureCanvas.style.zIndex = '2147483647'; // 最前面に表示
  
  document.body.appendChild(gestureCanvas);
  gestureContext = gestureCanvas.getContext('2d');
  
  // 線のスタイル設定
  gestureContext.strokeStyle = 'rgba(255, 0, 0, 0.7)';
  gestureContext.lineWidth = 2;
  gestureContext.lineJoin = 'round';
  gestureContext.lineCap = 'round';
}

// キャンバス削除関数
function removeCanvas() {
  const existingCanvas = document.getElementById('mouse-gesture-canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }
  gestureCanvas = null;
  gestureContext = null;
}

// マウス移動を描画する関数
function drawGesture(event) {
  if (!gestureContext) return;
  
  gesturePoints.push({ x: event.clientX, y: event.clientY });
  
  // 軌跡描画
  gestureContext.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);
  gestureContext.beginPath();
  
  if (gesturePoints.length > 0) {
    gestureContext.moveTo(gesturePoints[0].x, gesturePoints[0].y);
    
    for (let i = 1; i < gesturePoints.length; i++) {
      gestureContext.lineTo(gesturePoints[i].x, gesturePoints[i].y);
    }
    
    gestureContext.stroke();
  }
}

// 方向を認識する関数
function recognizeDirection(startPoint, endPoint) {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  
  // 水平・垂直判定のための閾値
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > GESTURE_THRESHOLD) {
    return dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
  } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > GESTURE_THRESHOLD) {
    return dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
  }
  
  return null;
}

// ジェスチャーを単純化する関数
function simplifyGesture(points) {
  if (points.length < 2) return '';
  
  const segments = [];
  let currentDirection = null;
  let startPoint = points[0];
  
  for (let i = 1; i < points.length; i += 5) { // 5ポイントごとに方向を検出
    const endPoint = points[i];
    const direction = recognizeDirection(startPoint, endPoint);
    
    if (direction && direction !== currentDirection) {
      currentDirection = direction;
      segments.push(direction);
      startPoint = endPoint;
    }
  }
  
  // 最後の区間
  const lastDirection = recognizeDirection(startPoint, points[points.length - 1]);
  if (lastDirection && lastDirection !== currentDirection) {
    segments.push(lastDirection);
  }
  
  return segments.join('');
}

// ジェスチャー完了時の処理関数
function completeGesture() {
  if (gesturePoints.length < 2) {
    removeCanvas();
    return;
  }
  
  const gesture = simplifyGesture(gesturePoints);
  console.log('Recognized gesture:', gesture);
  
  // アクションを実行
  if (GESTURE_ACTIONS[gesture]) {
    // バックグラウンドスクリプトにメッセージを送信
    chrome.runtime.sendMessage({ action: GESTURE_ACTIONS[gesture] });
  }
  
  // 少し待ってからキャンバスを削除（航跡を見せるため）
  setTimeout(removeCanvas, 500);
}

// マウス右ボタンダウンでジェスチャー開始
document.addEventListener('mousedown', function(event) {
  if (event.button === 2) { // 右クリック
    event.preventDefault();
    isGesturing = true;
    gesturePoints = [{ x: event.clientX, y: event.clientY }];
    createCanvas();
  }
}, true);

// マウス移動でジェスチャー描画
document.addEventListener('mousemove', function(event) {
  if (isGesturing) {
    event.preventDefault();
    drawGesture(event);
  }
}, true);

// マウスアップでジェスチャー完了
document.addEventListener('mouseup', function(event) {
  if (isGesturing && event.button === 2) { // 右クリックのリリース
    event.preventDefault();
    isGesturing = false;
    completeGesture();
    gesturePoints = [];
  }
}, true);

// コンテキストメニュー抑制（オプション機能）
document.addEventListener('contextmenu', function(event) {
  if (isGesturing) {
    event.preventDefault();
    return false;
  }
}, true);

// ウィンドウサイズ変更時にキャンバスをリサイズ
window.addEventListener('resize', function() {
  if (gestureCanvas) {
    gestureCanvas.width = window.innerWidth;
    gestureCanvas.height = window.innerHeight;
    
    // 線のスタイルを再設定
    gestureContext.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    gestureContext.lineWidth = 2;
    gestureContext.lineJoin = 'round';
    gestureContext.lineCap = 'round';
  }
});