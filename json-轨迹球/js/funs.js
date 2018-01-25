var fullscreen = {
  isFullscreen: function() {
    var explorer = window.navigator.userAgent.toLowerCase();
    if (explorer.indexOf('chrome') > 0) { //chrome
      if (document.body.scrollHeight == window.screen.height && document.body.scrollWidth == window.screen.width) {
        return true;
      } else {
        return false;
      }
    } else { //IE 9+  fireFox
      if (window.outerHeight == screen.height && window.outerWidth == screen.width) {
        return true;
      } else {
        return false;
      }
    }
  },
  fullScreen: function(flag) {
    if (flag) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
      return;
    }
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  },
  toggleFullscreen: function() {
    if (this.isFullscreen()) {
      this.fullScreen(false);
      return;
    }
    this.fullScreen(true);
  }
}
