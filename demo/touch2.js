// THREE.TouchEvent = function(object) {
var TouchEvent = function(object) {
    this.object = object;
    var _this = this;
    var STATE = {
        NONE: -1,
        TAP: 0,
        DTAP: 1
    };
    var _state = STATE.NONE;
    var tapTime, _lastTapTime, delta;
    var tapTimeout, touchTimeout, longTapTimeout;
    var longTapDelay = 750;

    this.singleTap = function() {
        console.log("singleTap");
    }
    this.doubleTap = function() {
        console.log("doubleTap");
    }
    this.longTap = function() {
        console.log("longTap");
    }
    this.singleMove = function() {
        console.log("singleMove");
    }
    this.doubleMove = function() {
        console.log("doubleMove");
    }

    function longTap() {
        longTapTimeout = null;
        if (_state === STATE.TAP) {
            _this.longTap();
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

    function startEvent() {
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

    function moveEvent(e) {
        if (_state === STATE.TAP) {
            cancelAll();
            _this.singleMove();
        }
    }

    function endEvent() {
        cancelLongTap();
        if (_lastTapTime) {
            tapTimeout = setTimeout(function() {
                if (_state === STATE.DTAP) {
                    cancelAll();
                    _this.doubleTap();
                } else if (_state === STATE.TAP) {
                    touchTimeout = setTimeout(function() {
                        _lastTapTime = touchTimeout = null;
                        _this.singleTap();
                    }, 250)
                }
                _state = STATE.NONE;
            }, 0)
        }
    }

    function mousedown(event) {
        event.preventDefault();
        event.stopPropagation();
        startEvent();
        document.addEventListener('mousemove', mousemove, false);
        document.addEventListener('mouseup', mouseup, false);
    }

    function mousemove(event) {
        event.preventDefault();
        event.stopPropagation();
        moveEvent(event);
    }

    function mouseup(event) {
        event.preventDefault();
        event.stopPropagation();
        endEvent();
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
    }

    function touchstart(event) {
        event.preventDefault();
        event.stopPropagation();
        switch (event.touches.length) {
            case 1:
                startEvent();
                break;
            case 2:
                cancelAll();
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
                moveEvent(event.touches);
                break;
            case 2:
                _this.doubleMove();
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
                endEvent();
                break;
            case 1:
                _state = STATE.NONE;
                break;
            default:
                _state = STATE.NONE;
        }
    }
    this.object.addEventListener('mousedown', mousedown, false);
    this.object.addEventListener('touchstart', touchstart, false);
    this.object.addEventListener('touchend', touchend, false);
    this.object.addEventListener('touchmove', touchmove, false);
}