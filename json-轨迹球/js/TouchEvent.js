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
    var _ctrlPtType = null;
    var _state = STATE.NONE;
    var _lastTapTime;
    var tapTimeout, touchTimeout, longTapTimeout;
    var longTapDelay = 1500;
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
            _this.longTap(_ctrlPtType);
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
    /**
     * 一个控制点按下时事件，判断单双击及长按事件
     * @param  {[array]} axis          [description]
     * @param  {[Number]} ctrlPtType [description]
     * @return {[type]}            [description]
     */
    function _oneCtrlPtStart(axis) {
        var tapTime = Date.now();
        var delta = tapTime - (_lastTapTime || tapTime);
        _state = STATE.TAP;
        if (delta > 0 && delta <= 250) {
            // 250ms 内再次点击则执行双击任务（控制点离开时），并取消单击定时任务
            _state = STATE.DTAP;
            clearTimeout(touchTimeout);
        } else {
            // 单击时创建长按事件的定时任务
            // 如果 longTapDelay 内没有终止 longTapTimeout，执行长按事件
            longTapTimeout = setTimeout(longTap, longTapDelay);
        }
        _lastTapTime = tapTime;
        // 调用对外接口
        _this.start(axis, _ctrlPtType);
    }

    function _ctrlPtMove(axis) {
        // if(Math.abs( e.pageX - lastMove ) < 10) return;
        if (_state === STATE.TAP) {
            cancelAll();
            // 调用对外接口
            _this.singleMove(axis, _ctrlPtType);
        }
    }

    function _ctrlPtEnd(axis) {
        cancelLongTap();
        if (_lastTapTime) {
            // tapTimeout = setTimeout(function() {
            if (_state === STATE.DTAP) {
                // cancelAll();
                clearTimeout(touchTimeout);
                _lastTapTime = null;
                _this.doubleTap(axis, _ctrlPtType);
            } else if (_state === STATE.TAP) {
                touchTimeout = setTimeout(function() {
                    _lastTapTime = touchTimeout = null;
                    _this.singleTap(axis, _ctrlPtType);
                }, 250)
            }
            _state = STATE.NONE;
            // }, 0)
        }
        _this.end(axis);
    }

    function mousedown(event) {
        event.preventDefault();
        event.stopPropagation();
        // console.log("s",event.buttons);
        _ctrlPtType = event.buttons;
        _oneCtrlPtStart([{
            pageX: event.pageX,
            pageY: event.pageY
        }]);
        document.addEventListener('mousemove', mousemove, false);
        document.addEventListener('mouseup', mouseup, false);
    }

    function mousemove(event) {
        event.preventDefault();
        event.stopPropagation();
        // console.log("s",event.buttons);
        _ctrlPtMove([{
            pageX: event.pageX,
            pageY: event.pageY
        }]);
    }

    function mouseup(event) {
        event.preventDefault();
        event.stopPropagation();
        _ctrlPtEnd(event);
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
    }

    function mousewheel(event) {
        event.preventDefault();
        event.stopPropagation();
        var delta = 0;
        if (event.wheelDelta) { // WebKit / Opera / Explorer 9
            delta = event.wheelDelta / 40;
        } else if (event.detail) { // Firefox
            delta = -event.detail;
        }
        _this.wheel(event, delta);
    }

    function touchstart(event) {
        event.preventDefault();
        event.stopPropagation();
        switch (event.touches.length) {
            case 1:
                _ctrlPtType = -1;
                _oneCtrlPtStart(event.touches, -1);
                break;
            case 2:
                cancelAll();
                _ctrlPtType = -2;
                _this.start(event.touches, _ctrlPtType);
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
                _ctrlPtMove(event.touches);
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
                _ctrlPtEnd(event.changedTouches);
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