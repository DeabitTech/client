function ConfigurationManager() {
  
  var context = this;

  var electron = window.require('electron').remote;
  var privateContext = {
    electron,
    fs: electron.require('fs'),
    app: electron.app,
    path: electron.require('path'),
    CryptoJS: electron.require('crypto-js'),
    configuration: window.userDataPath + 'config.json'
  };
  $(document).on('click', 'a[href^="http"]', function(event) {
    event && event.preventDefault();
    try {
      privateContext.electron.shell.openExternal(this.href);
    } catch(e) {
    }
  });
  
  context.dump = function dump(password) {
    if (password === undefined || password === null || password.split(' ').join('') === '' || privateContext.password !== md5(password).toUpperCase()) {
      throw 'password';
    }
    var userChosenPath = privateContext.electron.dialog.showSaveDialog({
      defaultPath: undefined,
      filters: [
        {
          name: "JSON File",
          extensions: ["json"]
        }
      ]
    });
    if(userChosenPath) {
      var oldData = privateContext.data;
      privateContext.data = userChosenPath;
      context.save();
      privateContext.data = oldData;
    }
    return userChosenPath;
  };
  
  context.import = function (userChosenPath) {
    typeof userChosenPath !== 'string' && (userChosenPath = privateContext.electron.dialog.showOpenDialog({
      defaultPath: undefined,
      filters: [
        {
          name: "JSON File",
          extensions: ["json"]
        }
      ],
      options: {
        openDirectory: false,
        multiSelections: false
      }
    }));
    if (userChosenPath === undefined || userChosenPath === null) {
      return;
    }
    userChosenPath = (typeof userChosenPath === 'string' ? userChosenPath : userChosenPath[0]).split('\\').join('/');
    if (privateContext.data === (window.userDataPath + 'data.json') && userChosenPath !== (window.userDataPath + 'data.json')) {
      try {
        privateContext.fs.unlinkSync((window.userDataPath + 'data.json'));
      } catch {
      }
    }
    privateContext.fs.writeFileSync(privateContext.configuration, JSON.stringify({ data: userChosenPath }));
    context.load();
    return userChosenPath;
  };
  
  context.move = function move(password) {
    var path = context.dump(password);
    path && context.import(path);
    context.unlockUser(password);
  };

  context.save = function save(user, password, newUser) {
    if (newUser === true) {
      if (!user) {
        throw 'user';
      }
      if (password === undefined || password === null || password.split(' ').join('') === '') {
        throw 'password';
      }
    }
    user && (context.content.user = user);
    password && (privateContext.password = md5(password).toUpperCase());
    user = context.content.user;
    var lang = context.content.lang;
    lang && (context.content.lang = {
      lang_config_stuff: lang.lang_config_stuff
    });
    if (user) {
      var data = JSON.stringify(context.content.user);
      privateContext.encryptedContent = {
        data,
        hash: privateContext.CryptoJS.SHA256(user.wallet.toLowerCase()).toString()
      };
      privateContext.encryptedContent.data = privateContext.CryptoJS.AES.encrypt(privateContext.encryptedContent.data, privateContext.password).toString();
      privateContext.encryptedContent.data = $.base64.encode(privateContext.encryptedContent.data);
    }
    privateContext.encryptedContent && (context.content.user = privateContext.encryptedContent);
    privateContext.fs.writeFileSync(privateContext.data, JSON.stringify(context.content, null, 4));
    context.encryptedUser = context.content.user;
    delete context.content.user;
    user && (context.content.user = user);
    lang && (context.content.lang = lang);
  };
  
  context.unlockUser = function unlockUser(password) {
    
    if (password === undefined || password === null || password.split(' ').join('') === '') {
      return false;
    }
    privateContext.password = md5(password).toUpperCase();
    var data = $.base64.decode(privateContext.encryptedContent.data).split('\n').join('');
    data = privateContext.CryptoJS.AES.decrypt(data, privateContext.password);
    data = data.toString(privateContext.CryptoJS.enc.Utf8);
    try {
      var user = JSON.parse(data);
      var hash = privateContext.CryptoJS.SHA256(user.wallet.toLowerCase()).toString();
      if (hash !== privateContext.encryptedContent.hash) {
        return false;
      }
      context.content.user = user;
    } catch(e) {
      return false;
    }
    $.publish('configuration/unlocked');
    return true;
  };

  context.forget = function forget(user) {
    var oldPlainUser = context.content.user;
    var oldPassword = privateContext.password;
    !user && privateContext.fs.unlinkSync(privateContext.configuration);
    try {
      !user && privateContext.fs.unlinkSync(window.userDataPath + 'data.json');
    } catch(e) {
    }
    user && privateContext.fs.writeFileSync(JSON.parse(privateContext.fs.readFileSync(privateContext.configuration, 'UTF-8')).data, JSON.stringify({user}));
    context.load();
    user && (context.content.user = oldPlainUser);
    user && (privateContext.password = oldPassword);
    !user && $.publish('list/updated');
    !user && client.blockchainManager.newProvider().then(client.contractsManager.checkBaskets);
    !user && $.publish('configuration/forgotten');
  }

  context.hasUser = function hasUser() {
    return privateContext.encryptedContent !== undefined && privateContext.encryptedContent !== null;
  };

  context.hasUnlockedUser = function hasUnlockedUser() {
    return context.hasUser() && context.content.user !== undefined && context.content.user !== null;
  };

  context.getDefaultConfiguration = function getDefaultConfiguration() {
    var defaultConfig = {};
    Object.keys(ecosystemData).map(function(key) {
        defaultConfig[key] = ecosystemData[key];
    });
    return defaultConfig;
  };

  (context.load = function load() {
    delete privateContext.password;
    delete context.content;
    privateContext.encryptedContent = null;
    privateContext.data = window.userDataPath + 'data.json'
    if (!privateContext.fs.existsSync(privateContext.configuration)) {
      privateContext.fs.writeFileSync(privateContext.configuration, JSON.stringify({ data: privateContext.data }));
      privateContext.fs.writeFileSync(privateContext.data, 'null');
    }
    privateContext.data = JSON.parse(privateContext.fs.readFileSync(privateContext.configuration, 'UTF-8')).data;
    if (!privateContext.fs.existsSync(privateContext.data)) {
      privateContext.fs.unlinkSync(privateContext.configuration);
      try {
        privateContext.fs.unlinkSync(window.userDataPath + 'data.json');
      } catch {
      }
      context.load();
      return;
    }
    try {
      context.content = JSON.parse(privateContext.fs.readFileSync(privateContext.data, 'UTF-8'));
    } catch(e) {
    }
    context.content = context.content || {};
    context.content.user && (context.encryptedUser = context.content.user);
    context.content.user && (privateContext.encryptedContent = context.content.user);
    delete context.content.user;
    var defaultConfiguration = context.getDefaultConfiguration();
    Object.keys(defaultConfiguration).map(key => !context.content[key] && (context.content[key] = defaultConfiguration[key]));
    if(context.content.list && context.content.list.length !== undefined) {
      var l = context.content.list;
      context.content.list = {};
      for(var i in l) {
        context.content.list[i + ''] = l[i];
      }
    }
  })();
  
};