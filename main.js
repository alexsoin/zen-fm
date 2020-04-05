const { app, BrowserWindow, Menu, Tray, screen, ipcMain } = require('electron');
const parsers = require("playlist-parser");
const M3U = parsers.M3U;
const axios = require('axios');
const Store = require('electron-store');

let window;
const URI_PLAYER = `${__dirname}/src/windows/player.html`;
const ICON = `${__dirname}/icon.ico`;
const store = new Store();
const defaultStore = {
  activeFM: 0,
  listFM: [
    { title: 'MAXIMUM', url: 'https://radiopotok.ru/f/station_m3u/station_87.m3u' },
    { title: 'ULTRA', url: 'https://radiopotok.ru/f/station_m3u/station_1414.m3u' },
    { title: 'Hard Rock FM', url: 'https://radiopotok.ru/f/station_m3u/station_1653.m3u' },
    { title: 'NRJ', url: 'https://radiopotok.ru/f/station_m3u/station_4.m3u' },
    { title: 'Европа Плюс', url: 'https://radiopotok.ru/f/station_m3u/station_1576.m3u' },
  ]
};

/** Если данных нет, создаём стандартные значения */
if(!store.get('fm')) {
  store.set('fm', defaultStore);
}

/**
 * Активая FM потока
 * 
 * @param Number id 
 */
const activeFM = (id) => {  
  const fm = store.get('fm');
  const list = fm.listFM;

  const {title, url} = list[id];
  store.set('fm.activeFM', id);

  axios.get(url).then((response) => { 
    const dataM3U = response.data;
    const playlist = M3U.parse(dataM3U);
    
    if(playlist[0]) {      
      const src = playlist[0].file;    
      window.webContents.send('render-fm', {
        src,
        title
      });
    }
  });

}

/** Обработчик включения последней радиостанции */
ipcMain.on('play-latest', (event, arg) => {
  const fm = store.get('fm');
  const latest = fm.activeFM;

  activeFM(latest);
  event.reply('is-load', true); // меняем статус загрузки
});

/** Обработчик закрытия окна */
ipcMain.on('close-window', (event, arg) => { window.hide(); });

/** Toggle window */
const toggleWindow = () => {
  
  if (window.isVisible()) {
    window.hide();
  } else {
    const position = getWindowPosition();
    
    window.setPosition(position.x, position.y, false);
    window.show();
  }
}

/** Расчет позиции окна */
const getWindowPosition = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();
        
  const x = Math.round(width - windowBounds.width);
  const y = Math.round(trayBounds.y - windowBounds.height);

  return {x, y}
};

/** Создание окна плеера */
const createWindow = () => {
  const sizeWindow = { width: 350, height: 450 };
  // const sizeWindow = { width: 1500, height: 650 };

  window = new BrowserWindow({
    width: sizeWindow.width,
    height: sizeWindow.height,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  window.loadFile(URI_PLAYER); // загружаем html контент
  // window.webContents.openDevTools(); // включение девтула

  /** Скрываем окно, если курсор вне фокуса */
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });
};

/** Создание менюя трея */
const createMenuTray = () => {
  const fm = store.get('fm');
  const list = fm.listFM;
  let arrMenu = [];

  arrMenu.push({ 
    label: 'Включить',
    click: (event) => {
      const fm = store.get('fm');
      const latest = fm.activeFM;

      console.log(event.label)
      activeFM(latest);
    } 
  });

  arrMenu.push({ type: "separator" });

  list.forEach((element, index) => {
    arrMenu.push({
      label: element.title,
      click: (event) => {
        console.log(event.label)
        activeFM(index);
      }
    });
  });

  arrMenu.push({ type: "separator" });

  arrMenu.push({ label: 'Выход', role: "quit"});

  return arrMenu;
}

/** Создаем трей */
const createTray = () => {
  const menu = createMenuTray();
  tray = new Tray(ICON);
  const contextMenu = Menu.buildFromTemplate(menu);
  tray.setToolTip('zenFM')
  tray.setContextMenu(contextMenu)

  tray.on('click', function (event) {
    toggleWindow();
  });
}

let tray = null
app.allowRendererProcessReuse = true;
app.on('ready', () => {
  try {
    createTray();
    createWindow();
  } catch (error) {
    console.log(error);
    app.quit();
  }
});