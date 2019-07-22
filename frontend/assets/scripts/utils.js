var Utils = function () {

  window.web3 = new Web3();

  pageTitlePreamble = 'SEEDVenture - Platform';

  copyToClipboard = function copyToClipboard(str) {
      const el = document.createElement('textarea');
      el.value = str === undefined || str === null ? '' : str.toString && str.toString() || ('' + str);
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
  };

  getJQueryElement = function (element, defaultElementName) {
    if (defaultElementName === undefined || defaultElementName === null
      || defaultElementName === '') {
      defaultElementName = 'html';
    }
    if (element === undefined || element === null || element === '') {
      return $(defaultElementName);
    }
    if (element instanceof jQuery) {
      return element;
    }
    try {
      element = $(element);
      if (element.parents('html').length > 0) {
        return element;
      }
    } catch (e) {
    }
    return $(defaultElementName);
  };

  getCurrentWindowDimension = function () {
    return {
      width: $(window).width(),
      height: $(window).height()
    };
  };

  getStuffLocation = function () {
    return base_url + '/assets/';
  };

  setPageTitle = function (title) {
    document.title = title;
  };

  setPageMessage = function (message) {
    var title = pageTitlePreamble;
    if (message !== undefined && message !== null && message !== '') {
      title += ' - ' + message;
    }
    setPageTitle(title);
  };

  getCurrentPage = function () {
    return document.location.pathname.replace('/', '');
  };

  goTo = function (path) {
    var url = base_url;
    if (path !== undefined && path !== null && path !== '') {
      if (path !== '/') {
        if (!path.startsWith('/')) {
          path = '/' + path;
        }
        if (!path.endsWith('.html')) {
          path += '.html';
        }
        url += path;
      }
    }
    window.location.href = url;
  }

  numberToString = function numberToString(num) {
    if(num === undefined || num === null) {
      num = 0;
    }
    let numStr = String(num);

    if (Math.abs(num) < 1.0) {
      let e = parseInt(num.toString().split('e-')[1]);
      if (e) {
        let negative = num < 0;
        if (negative) num *= -1
        num *= Math.pow(10, e - 1);
        numStr = '0.' + (new Array(e)).join('0') + num.toString().substring(2);
        if (negative) numStr = "-" + numStr;
      }
    }
    else {
      let e = parseInt(num.toString().split('+')[1]);
      if (e > 20) {
        e -= 20;
        num /= Math.pow(10, e);
        numStr = num.toString() + (new Array(e + 1)).join('0');
      }
    }
    return numStr;
  }

  roundWei = function (wei) {
    if (!wei) {
      return '0';
    }
    (typeof wei !== 'string') && (wei = Utils.numberToString(wei));
    var str = web3.utils.fromWei(wei, 'ether');
    var fixed = 2;
    if(str.indexOf(Utils.decimalsSeparator) !== -1) {
      var n = str.split(Utils.decimalsSeparator)[1]
      fixed = parseInt(n) === 0 ? 2 : n.length;
    }
    str = parseFloat(str).toFixed(fixed);
    fixed = 2;
    if(str.indexOf(Utils.decimalsSeparator) !== -1) {
      var n = str.split(Utils.decimalsSeparator)[1]
      fixed = parseInt(n) === 0 ? 2 : n.length;
    }
    var s = parseFloat(parseFloat(str).toFixed(fixed)).toLocaleString();
    if(s.indexOf(Utils.decimalsSeparator) === -1) {
      s += (Utils.decimalsSeparator + '00');
    }
    if(s.indexOf(Utils.decimalsSeparator) < s.length - 3) {
      s = s.split(Utils.decimalsSeparator)[0] + Utils.decimalsSeparator + s.split(Utils.decimalsSeparator)[1].substring(0, 2);
    }
    return s;
  }

  isEthereumAddress = function (ad) {
    if (ad === undefined || ad === null) {
      return false;
    }
    var address = ad.split(' ').join('');
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
      return false;
    } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
      return true;
    } else {
      address = address.replace('0x', '');
      var addressHash = web3.utils.sha3(address.toLowerCase());
      for (var i = 0; i < 40; i++) {
        if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
          //return false;
        }
      }
    }
    return true;
  };

  toEthereumChecksumAddress = function (address) {
    address = address.toLowerCase().replace('0x', '');
    var addressHash = web3.utils.sha3(address);
    var checksumAddress = '0x';

    for (var i = 0; i < address.length; i++) {
      if (parseInt(addressHash[i], 16) > 8) {
        checksumAddress += address[i].toUpperCase();
      } else {
        checksumAddress += address[i];
      }
    }
    return checksumAddress;
  };

  var toTitle = function toTitle(name) {
    var title = '';
    for(var i = 0; i < name.length; i++) {
        var character = name.charAt(i);
        if (!isNaN(character * 1) || character === character.toUpperCase()) {
            title += (' ' + character.toUpperCase());
        } else {
            title += (title.length === 0 ? character.toUpperCase() : character);
        }
    }
    return title;
  }

  return {
    getJQueryElement: getJQueryElement,
    getCurrentWindowDimension: getCurrentWindowDimension,
    getStuffLocation: getStuffLocation,
    setPageTitle: setPageTitle,
    setPageMessage: setPageMessage,
    getCurrentPage: getCurrentPage,
    goTo: goTo,
    roundWei: roundWei,
    isEthereumAddress: isEthereumAddress,
    toEthereumChecksumAddress,
    numberToString,
    copyToClipboard,
    dozensSeparator : (1000.02).toLocaleString().charAt(1),
    decimalsSeparator : (1000.02).toLocaleString().charAt(5),
    toTitle
  };
}();