const canvas = document.querySelector('#signal-plot');
const context = canvas.getContext('2d');
const controls = document.querySelector('.plot-select');

const views = {
  tokens: {
    title: '選択トークンの確率',
    unit: '% / step',
    description: '生成の途中で選択トークンの確率が下がり、終盤に上がるサンプルです。',
    metrics: [['生成ステップ', '32'], ['最大確率', '94%'], ['最小確率', '27%']],
    values: [41, 55, 48, 69, 64, 62, 77, 68, 84, 80, 71, 75, 59, 64, 51, 56, 38, 27, 40, 37, 57, 63, 55, 72, 69, 81, 75, 89, 85, 93, 90, 94],
  },
  layers: {
    title: 'レイヤーごとの活動量',
    unit: 'norm / layer',
    description: '12層の活動量のサンプルです。後半のレイヤーで活動量が高くなります。',
    metrics: [['レイヤー数', '12'], ['最大ノルム', '8.4'], ['最小ノルム', '2.4']],
    values: [2.4, 3.8, 3.2, 4.6, 4.0, 5.0, 4.2, 6.5, 5.9, 8.4, 7.2, 7.8],
  },
  attention: {
    title: 'トークン間のアテンション',
    unit: 'weight / token',
    description: '8トークン分のアテンション行列のサンプルです。各行のトークンが、それ以前のどのトークンを参照するかを色の強さで示します。',
    metrics: [['トークン数', '8'], ['表示ヘッド', '1'], ['最大の重み', '1.00']],
    values: [
      [1], [.69, .31], [.45, .16, .39], [.26, .12, .11, .51],
      [.2, .08, .44, .09, .19], [.17, .11, .08, .4, .1, .14],
      [.08, .16, .06, .07, .48, .05, .1], [.09, .05, .13, .12, .08, .11, .37, .05],
    ],
  },
};

let activeView = 'tokens';

function drawPlot() {
  if (!context) return;

  const { width, height } = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(width * pixelRatio));
  canvas.height = Math.max(1, Math.round(height * pixelRatio));
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.font = '10px monospace';
  context.textBaseline = 'middle';

  const values = views[activeView].values;
  const left = 29;
  const top = 9;
  const plotWidth = width - left - 12;
  const plotHeight = height - top - 22;

  if (activeView === 'attention') {
    const columns = values.length;
    const cellWidth = plotWidth / columns;
    const cellHeight = plotHeight / columns;

    values.forEach((row, rowIndex) => {
      context.fillStyle = '#a9b7ad';
      context.fillText(String(rowIndex + 1), 7, top + (rowIndex + .5) * cellHeight);

      for (let column = 0; column < columns; column++) {
        const weight = row[column] ?? 0;
        context.fillStyle = weight ? `rgba(193, 242, 140, ${.12 + weight * .88})` : '#26312a';
        context.fillRect(left + column * cellWidth, top + rowIndex * cellHeight, cellWidth - 2, cellHeight - 2);
      }

      context.fillStyle = '#a9b7ad';
      context.fillText(String(rowIndex + 1), left + (rowIndex + .5) * cellWidth - 3, height - 5);
    });
    return;
  }

  const max = activeView === 'tokens' ? 100 : 10;
  const bottom = top + plotHeight;
  const y = (value) => bottom - value / max * plotHeight;
  const tickCount = 4;

  for (let tick = 0; tick <= tickCount; tick++) {
    const value = max * tick / tickCount;
    const position = y(value);
    context.fillStyle = '#a9b7ad';
    context.fillText(String(value), 2, position);
    context.strokeStyle = '#344038';
    context.beginPath();
    context.moveTo(left, position);
    context.lineTo(width - 12, position);
    context.stroke();
  }

  const labelIndices = [0, Math.round(values.length / 4) - 1, Math.round(values.length / 2) - 1, Math.round(values.length * .75) - 1, values.length - 1];
  if (activeView === 'layers') {
    const slot = plotWidth / values.length;
    values.forEach((value, index) => {
      context.fillStyle = index === values.indexOf(Math.max(...values)) ? '#c1f28c' : '#74996d';
      context.fillRect(left + (index + .16) * slot, y(value), slot * .68, bottom - y(value));
    });
    context.fillStyle = '#a9b7ad';
    labelIndices.forEach((index) => context.fillText(String(index + 1), left + (index + .38) * slot, height - 5));
    return;
  }

  const x = (index) => left + index / (values.length - 1) * plotWidth;
  const gradient = context.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, 'rgba(193, 242, 140, .27)');
  gradient.addColorStop(1, 'rgba(193, 242, 140, .01)');
  const line = new Path2D();
  line.moveTo(x(0), y(values[0]));
  values.slice(1).forEach((value, index) => line.lineTo(x(index + 1), y(value)));

  const fill = new Path2D(line);
  fill.lineTo(x(values.length - 1), bottom);
  fill.lineTo(x(0), bottom);
  fill.closePath();
  context.fillStyle = gradient;
  context.fill(fill);
  context.strokeStyle = '#c1f28c';
  context.lineWidth = 1.75;
  context.stroke(line);

  context.fillStyle = '#a9b7ad';
  labelIndices.forEach((index) => context.fillText(String(index + 1), x(index) - 4, height - 5));
}

function showView(name) {
  activeView = name;
  const view = views[name];
  document.querySelector('#plot-title').textContent = view.title;
  document.querySelector('#plot-unit').textContent = view.unit;
  document.querySelector('#plot-description').textContent = view.description;

  view.metrics.forEach(([label, value], index) => {
    document.querySelector(`#metric-label-${index + 1}`).textContent = label;
    document.querySelector(`#metric-value-${index + 1}`).textContent = value;
  });

  controls.querySelectorAll('button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.view === name));
  });
  drawPlot();
}

if (context) {
  controls.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => showView(button.dataset.view));
  });
  controls.hidden = false;
  canvas.hidden = false;
  showView(activeView);
  new ResizeObserver(drawPlot).observe(canvas);
}
