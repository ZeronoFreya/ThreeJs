var container = document.getElementById('viewport');
var _console = document.getElementById('console');
var _lastLog;

var STATE = {
    NONE: -1,
    TAP: 0,
    DTAP: 1
};
var _state = STATE.NONE;
var tapTime,_lastTapTime,delta;
function log() {
    var msg = "";
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i]) {
            msg += arguments[i].toString().trim() + " ";
        } else {
            msg += "undefined ";
        }
    }
    msg = msg.trim();
    var i, span;
    var _lastCd = _console.lastChild;
    if (!_lastCd) {
        _lastCd = document.createElement('p');
        i = document.createElement('i');
        span = document.createElement('span');
        _lastCd.appendChild(i);
        _lastCd.appendChild(span);
    }
    if (_lastLog == msg) {
        i = _lastCd.firstChild;
        i.innerHTML = Number(i.innerHTML || "1") + 1;
        return;
    }
    _lastLog = msg;
    _lastCd = _lastCd.cloneNode(true);
    _lastCd.firstChild.innerHTML = "";
    _lastCd.lastChild.innerHTML = msg;
    // p.html((new Date().getTime()) + ': ' + (new Date().getTime() - startTime) + ': ' + msg)
    _console.appendChild(_lastCd);
    _console.scrollTop = _console.scrollHeight;
};
var tapTimeout, touchTimeout, longTapTimeout;

var longTapDelay = 750;

function longTap() {
    longTapTimeout = null;
    if (_state === STATE.TAP) {
        log("longTap");
    }
    _state = STATE.NONE;
    _lastTapTime = null;
}

function cancelLongTap() {
    if (longTapTimeout) {
        clearTimeout(longTapTimeout);
        longTapTimeout = null;
    }
}

function cancelAll() {
    if (touchTimeout) clearTimeout(touchTimeout);
    if (tapTimeout) clearTimeout(tapTimeout);
    // if (swipeTimeout) clearTimeout(swipeTimeout);
    if (longTapTimeout) clearTimeout(longTapTimeout);
    _lastTapTime = touchTimeout = tapTimeout = longTapTimeout = null;
}

function aa() {
    // log("aa");
    longTapTimeout = setTimeout(longTap, longTapDelay);
    tapTime = Date.now();
    delta = tapTime - (_lastTapTime || tapTime);
    _state = STATE.TAP;
    if (delta > 0 && delta <= 250) {
        _state = STATE.DTAP;
        clearTimeout(touchTimeout);
    }
    _lastTapTime = tapTime;
}

function aa2() {
    cancelAll();
}

function bb(e) {
    // console.log(touch);
    if (_state === STATE.TAP){
        cancelAll();
        log("1 move");
    }
}

function bb2(e) {
    log("2 move");
}

function cc() {
    cancelLongTap();
    if ( _lastTapTime ) {
        tapTimeout = setTimeout(function() {
            if (_state === STATE.DTAP) {
                cancelAll();
                log("DoubleTap");
            } else if (_state === STATE.TAP) {
                touchTimeout = setTimeout(function() {
                    touchTimeout = null;
                    log("singleTap");
                    _lastTapTime = null;
                }, 250)
            }
            _state = STATE.NONE;
        }, 0)
    }
}
function cc2(){
    _state = STATE.NONE;
}
function mousedown(event) {
    event.preventDefault();
    event.stopPropagation();
    // log( "mousedown" );
    aa();
    document.addEventListener('mousemove', mousemove, false);
    document.addEventListener('mouseup', mouseup, false);
}

function mousemove(event) {
    event.preventDefault();
    event.stopPropagation();
    bb(event);
}

function mouseup(event) {
    event.preventDefault();
    event.stopPropagation();
    // log( "mouseup" );
    cc();
    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
}

function touchstart(event) {
    event.preventDefault();
    event.stopPropagation();
    switch (event.touches.length) {
        case 1:
            aa();
            break;
        case 2:
            log("2");
            aa2();
            break;
        default:
            log("3+");
            aa2();
    }
}

function touchmove(event) {
    event.preventDefault();
    event.stopPropagation();
    if (_state === STATE.NONE) return;
    switch (event.touches.length) {
        case 1:
            bb(event.touches);
            break;
        case 2:
            bb2(event.touches);
            break;
        default:
    }
}

function touchend(event) {
    event.preventDefault();
    event.stopPropagation();
    switch (event.touches.length) {
        case 0:
            cc();
            break;
        case 1:
            cc2();
            break;
        default:
            cc2();
    }
}
container.addEventListener('mousedown', mousedown, false);
container.addEventListener('touchstart', touchstart, false);
container.addEventListener('touchend', touchend, false);
container.addEventListener('touchmove', touchmove, false);