function launchFullScreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
    fullscreen.innerHTML = "退出全屏";
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
    fullscreen.innerHTML = "全屏";
}
var fullscreen = document.getElementById('fullscreen');
fullscreen.innerHTML = "全屏";
var isFullScreen;
fullscreen.onclick = function() {
    isFullScreen = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
    isFullScreen ? exitFullscreen() : launchFullScreen(document.documentElement);
}