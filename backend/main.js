var {app, BrowserWindow, globalShortcut, remote} = require('electron');
const fs = require('fs');

app = app || remote.app;

var root = __dirname + '/../frontend/';

var userDataPath = app.getPath('userData').split('\\').join('/');
if(!userDataPath.endsWith('/')) {
    userDataPath += '/';
}

var debug = false;
process.argv.forEach(it => it === '--debug' && (debug = true));
var test = false;
process.argv.forEach(it => it === '--test' && (test = true));

var distURL = (debug || test) ? '' : 'https://cdn.jsdelivr.net/gh/seedventure/client/frontend/';
var replace = '\n    <script type="text/javascript" id="toDelete">window.userDataPath="' + userDataPath + '";window.distURL="' + distURL + '";var element=document.getElementById("toDelete");element.parentNode.removeChild(element);</script>';

var spaURL = distURL + 'spa/';
var styleTag = '<link href="' + spaURL + 'style.min.css" rel="stylesheet" type="text/css"></link>';
var scriptTag = '<script src="' + spaURL + 'script.min.js" type="text/javascript"></script>';
replace += (debug && !test) ? '' : ('\n    ' + styleTag + '\n    ' + scriptTag);

var loadURLOptions = {
    baseURLForDataURL: `file://${root}`
};

var electronWindow = null;

function loadData() {
    electronWindow.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(fs.readFileSync(root + 'index.html', 'UTF-8').split('${REPLACE}').join(replace)), loadURLOptions);
};

app.on('ready', async function() {
    test && (await require('../builder/app').run('frontend', 'spa', 'dist'));
    electronWindow = new BrowserWindow({width: 800, height: 600, webPreferences : { nodeIntegration : true }});
    loadData();
    (debug || test) && electronWindow.webContents.openDevTools();
    electronWindow.setMenu(null);
    electronWindow.maximize();
    globalShortcut.register('f5', loadData);
    globalShortcut.register('CommandOrControl+R', loadData);
});

app.on('window-all-closed', function(){
    if(process.platform != 'darwin') {
        app.quit();
    }
    process.exit(0);
});