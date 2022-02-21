const audioContext = new AudioContext();

const freqPerBin = audioContext.sampleRate / 8192;

const startButton = document.createElement('button');
startButton.textContent = 'start';
const listenButton = document.createElement('button');
listenButton.textContent = 'listen';
startButton.addEventListener('click', start);
listenButton.addEventListener('click', listen);

window.onload = function () {
  document.body.appendChild(startButton);
  document.body.appendChild(listenButton);
};

function start() {
  const startTime = audioContext.currentTime + 1;
  const osc = audioContext.createOscillator();
  osc.type = 'sine';
  console.log(freqPerBin * 40, freqPerBin * 40 + freqPerBin * 40 * 2);
  osc.frequency.setValueAtTime(freqPerBin * 40, startTime);
  osc.frequency.linearRampToValueAtTime(
    freqPerBin * 40 + freqPerBin * 40 * 2,
    startTime + 2
  );
  osc.connect(audioContext.destination);
  osc.start();
  osc.stop(startTime + 2);
}

function listen() {
  navigator.mediaDevices
    .getUserMedia({ audio: { echoCancellation: false } })
    .then(function (stream) {
      start();
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 8192;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserNode);
      let count = 0;
      //const m = new Map<number, number>();
      //const c = new Map<number, number>();
      //const bufs:Float32Array[]=[];
      const interval = setInterval(() => {
        const buf = new Float32Array(analyserNode.frequencyBinCount);
        analyserNode.getFloatFrequencyData(buf);
        //bufs.push(buf);
        // for (let i = 0; i < 80; i++) {
        //   const v = m.get(count - i) ?? 0;
        //   m.set(count - i, v + buf[40 + i * 4]);
        //   const cc = c.get(count - i) ?? 0;
        //   c.set(count - i, cc + 1);
        // }
        //console.log(buf);
        const peak = peaks(buf, 5)
          .map((i) => ({
            f: (i * audioContext.sampleRate) / 2 / buf.length,
            val: buf[i],
          }))
          .filter((d) => 300 < d.f && d.f < 600 && d.val > -100)
          .sort((a, b) => b.val - a.val);
        if (peak.length >= 2) {
          console.log(peak[0].f, peak[1].f, peak[0].val, peak[1].val);
        }
        if (count > 40) {
          clearInterval(interval);
          //console.log(bufs);
          // m.forEach((v, k) => {
          //   const cc = c.get(k) ?? 0;
          //   console.log(k, v / cc)
          // })
        }
        count += 1;
      }, 100);
    });
}

function peaks(data: Float32Array, w: number) {
  const result = [];
  for (let i = w; i < data.length - w; i++) {
    let maxima = true;
    for (let shift = 1; shift <= w; shift++) {
      maxima &&= data[i - shift] < data[i] && data[i] > data[i + shift];
    }
    if (maxima) {
      result.push(i);
    }
  }
  return result;
}
