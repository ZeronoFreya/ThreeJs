var Console = function(object){
    var _this = this;
    this.object = object;
    var _lastLog;

    return function () {
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
        var _lastCd = _this.object.lastChild;
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
        _this.object.appendChild(_lastCd);
        _this.object.scrollTop = _this.object.scrollHeight;
    };
}