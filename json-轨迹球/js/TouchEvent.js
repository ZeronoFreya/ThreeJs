// https://developer.mozilla.org/zh-CN/docs/Web/Events/mousemove
// THREE.TouchEvent = function(object) {
var TouchEvent = function(object) {
    this.object = object;
    var _this = this;
    var STATE = {
        NONE: -1,
        TAP: 0,
        DTAP: 1,
        TOUCH_BTN: -1,
        LEFT_BTN: 0,
        MIDDLE_BTN: 1,
        RIGHT_BTN: 2
    };
    var _lastButtons = null;
    var _state = STATE.NONE;
    var tapTime, _lastTapTime, delta;
    var tapTimeout, touchTimeout, longTapTimeout;
    var longTapDelay = 750;
    this.start = function(e, _s, S) {
        console.log("start");
    }
    this.end = function(e) {
        console.log("end");
    }
    this.wheel = function(e, d) {
        console.log("wheel",e.pageX, e.pageY, d);
    }
    this.singleTap = function(e) {
        console.log("singleTap");
    }
    this.doubleTap = function(e) {
        console.log("doubleTap");
    }
    this.longTap = function() {
        console.log("longTap");
    }
    this.singleMove = function(e) {
        console.log("singleMove");
    }
    this.doubleMove = function(e1, e2) {
        console.log("doubleMove");
    }

    function longTap() {
        longTapTimeout = null;
        if (_state === STATE.TAP) {
            _this.longTap(_lastButtons);
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

    function _startEvent(e, eb) {
        tapTime = Date.now();
        delta = tapTime - (_lastTapTime || tapTime);
        _state = STATE.TAP;
        if (delta > 0 && delta <= 250) {
            _state = STATE.DTAP;
            clearTimeout(touchTimeout);
        } else {
            longTapTimeout = setTimeout(longTap, longTapDelay);
        }
        _lastTapTime = tapTime;
        _this.start(e, eb, _state, STATE);
    }

    function moveEvent(e, eb) {
        // if(Math.abs( e.pageX - lastMove ) < 10) return;
        if (_state === STATE.TAP) {
            cancelAll();
            _this.singleMove(e, eb);
        }
    }

    function _endEvent(e, eb) {
        cancelLongTap();
        if (_lastTapTime) {
            // tapTimeout = setTimeout(function() {
            if (_state === STATE.DTAP) {
                // cancelAll();
                clearTimeout(touchTimeout);
                _lastTapTime = null;
                _this.doubleTap(e, eb);
            } else if (_state === STATE.TAP) {
                touchTimeout = setTimeout(function() {
                    _lastTapTime = touchTimeout = null;
                    _this.singleTap(e, eb);
                }, 250)
            }
            _state = STATE.NONE;
            // }, 0)
        }
        _this.end(e, eb, _state, STATE);
    }

    function mousedown(event) {
        event.preventDefault();
        event.stopPropagation();
        // console.log("s",event.buttons);
        _lastButtons = event.buttons;
        _startEvent(event, _lastButtons);
        document.addEventListener('mousemove', mousemove, false);
        document.addEventListener('mouseup', mouseup, false);
    }

    function mousemove(event) {
        event.preventDefault();
        event.stopPropagation();
        // console.log("s",event.buttons);
        moveEvent(event, _lastButtons);
    }

    function mouseup(event) {
        event.preventDefault();
        event.stopPropagation();
        // _lastButtons = event.buttons;
        _endEvent(event, _lastButtons);
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
    }

    function mousewheel(event) {
        // if (_this.enabled === false) return;
        event.preventDefault();
        event.stopPropagation();
        var delta = 0;
        if (event.wheelDelta) { // WebKit / Opera / Explorer 9
            delta = event.wheelDelta / 40;
        } else if (event.detail) { // Firefox
            delta = -event.detail;
        }
        _this.wheel(event, delta);
        // _zoomStart.y += delta * 0.01;
        // _this.dispatchEvent(_startEvent);
        // _this.dispatchEvent(_endEvent);
    }

    function touchstart(event) {
        event.preventDefault();
        event.stopPropagation();
        switch (event.touches.length) {
            case 1:
                _startEvent(event.touches[0], -1);
                break;
            case 2:
                cancelAll();
                _this.start(event.touches, -2);
                break;
            default:
                cancelAll();
        }
    }

    function touchmove(event) {
        event.preventDefault();
        event.stopPropagation();
        if (_state === STATE.NONE) return;
        switch (event.touches.length) {
            case 1:
                moveEvent(event.touches[0], STATE.TOUCH_BTN);
                break;
            case 2:
                _this.doubleMove(event.touches);
                break;
            default:
                break;
        }
    }

    function touchend(event) {
        event.preventDefault();
        event.stopPropagation();
        switch (event.touches.length) {
            case 0:
                _endEvent(event.changedTouches[0], STATE.TOUCH_BTN);
                break;
            case 1:
                _state = STATE.NONE;
                break;
            default:
                _state = STATE.NONE;
        }
    }
    this.object.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    }, false);
    this.object.addEventListener('mousewheel', mousewheel, false);
    this.object.addEventListener('DOMMouseScroll', mousewheel, false); // firefox
    this.object.addEventListener('mousedown', mousedown, false);
    this.object.addEventListener('touchstart', touchstart, false);
    this.object.addEventListener('touchend', touchend, false);
    this.object.addEventListener('touchmove', touchmove, false);
}