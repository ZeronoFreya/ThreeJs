var container = document.getElementById('viewport');
var _console = document.getElementById('console');

var _lastLog;
function log () {
    var msg = "";
    for( var i = 0; i < arguments.length; i++ ){
        if (arguments[i]) {
            msg += arguments[i].toString().trim() + " ";
        }else{
            msg += "undefined ";
        }
    }
    msg = msg.trim();
    var i,span;
    var _lastCd = _console.lastChild;
    if ( !_lastCd ) {
        _lastCd = document.createElement('p');
        i = document.createElement('i');
        span = document.createElement('span');
        _lastCd.appendChild(i);
        _lastCd.appendChild(span);
    }
    if ( _lastLog == msg ) {
        i = _lastCd.firstChild;
        i.innerHTML = Number(i.innerHTML||"1") + 1;
        return;
    }
    _lastLog = msg ;
    _lastCd = _lastCd.cloneNode(true);
    _lastCd.firstChild.innerHTML = "";
    _lastCd.lastChild.innerHTML = msg;
     // p.html((new Date().getTime()) + ': ' + (new Date().getTime() - startTime) + ': ' + msg)
     _console.appendChild(_lastCd);
     _console.scrollTop = _console.scrollHeight;
};

var tapTimeout, touchTimeout, longTapTimeout;
var touch = {};
var now, delta;
var longTapDelay = 750;

function longTap() {
    longTapTimeout = null;
    if (touch.last && !touch.isDoubleTap) {
        log("longTap");
    }
    touch = {};
}

function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout);
    longTapTimeout = null;
}
function cancelAll() {
    if (touchTimeout) clearTimeout(touchTimeout);
    if (tapTimeout) clearTimeout(tapTimeout);
    // if (swipeTimeout) clearTimeout(swipeTimeout);
    if (longTapTimeout) clearTimeout(longTapTimeout);
    touchTimeout = tapTimeout = longTapTimeout = null;
    touch = {};
}
function mousedown( event ){
    event.preventDefault();
    event.stopPropagation();
    // log( "mousedown" );
    longTapTimeout = setTimeout(longTap, longTapDelay);
    touch.down = true;
    now = Date.now();
    delta = now - (touch.last || now);
    // mouse.x1 = event.touches[0].pageX;
    // mouse.y1 = event.touches[0].pageY;
    if (delta > 0 && delta <= 250){
        touch.isDoubleTap = true;
        clearTimeout(touchTimeout);
        // cancelLongTap();
    }
    touch.last = now;
    
    document.addEventListener( 'mousemove', mousemove, false );
    document.addEventListener( 'mouseup', mouseup, false );
}
function mousemove( event ){
    event.preventDefault();
    event.stopPropagation();
    cancelLongTap();
    log( "mousemove" );
}
function mouseup( event ){
    event.preventDefault();
    event.stopPropagation();
    // log( "mouseup" );
    cancelLongTap();

    if ('last' in touch){
        tapTimeout = setTimeout(function (){
            if (touch.isDoubleTap) {
                clearTimeout(tapTimeout);
                clearTimeout(touchTimeout);
                log("DoubleTap");
                touch = {};
            }else{
                touchTimeout = setTimeout(function () {
                    touchTimeout = null;
                    log("singleTap");
                    touch = {};
                }, 250)
            }
        },0)
    }
    document.removeEventListener( 'mousemove', mousemove );
    document.removeEventListener( 'mouseup', mouseup );
}
container.addEventListener( 'mousedown', mousedown, false );
// container.addEventListener( 'mousemove', mousemove, false );
// container.addEventListener( 'mouseup', mouseup, false );
