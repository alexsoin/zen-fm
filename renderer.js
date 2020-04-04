const { ipcRenderer } = require('electron')

function audioVisual() {
  let audio = document.getElementById("audio");
  let context = new AudioContext();
  let src = context.createMediaElementSource(audio);
  let analyser = context.createAnalyser();

  let canvas = document.getElementById("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let ctx = canvas.getContext("2d");

  src.connect(analyser);
  analyser.connect(context.destination);

  analyser.fftSize = 128;

  let bufferLength = analyser.frequencyBinCount;
  console.log(bufferLength);

  let dataArray = new Uint8Array(bufferLength);

  let WIDTH = canvas.width;
  let HEIGHT = canvas.height;

  let barWidth = (WIDTH / bufferLength) * 2.5;
  let barHeight;
  let x = 0;

  function renderFrame() {
    requestAnimationFrame(renderFrame);

    x = 0;

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = "#272727";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];

      let r = barHeight + (25 * (i / bufferLength));
      let g = 250 * (i / bufferLength);
      let b = 50;

      ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  renderFrame();
}

audioVisual();

ipcRenderer.on('render-fm', (event, arg) => {
  console.log('station: ', arg)
  let title = document.getElementById('title');
  let audio = document.getElementById('audio');
  let source = document.getElementById('audioSource');

  title.innerText = arg.title;
  source.src = arg.src;
  btnHandler.classList.add("play");

  audio.load();
  audio.play();
});

let handleStatus = (isLoad) => {
  let status = document.getElementById('status');
  if(isLoad) {
    status.classList.remove('show');
  } else {
    status.classList.add('show');
  }
}

ipcRenderer.on('is-load', (event, arg) => {
  handleStatus(arg)
});

document.querySelector('#close').addEventListener( 'click', () => { 
  ipcRenderer.send('close-window'); 
})

let btnHandler = document.querySelector('#handler');

btnHandler.addEventListener( 'click', (event) => { 
  const playClass = "play";

  if (btnHandler.classList.contains(playClass)) {
    let audio = document.getElementById('audio');

    audio.pause();
    audio.currentTime = 0;
    btnHandler.classList.remove(playClass);
  } else {
    ipcRenderer.send('play-latest'); 
    handleStatus(false)
    btnHandler.classList.add(playClass);
  }

})