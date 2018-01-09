/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 */

THREE.TrackballControls = function ( object, touchEvent, domElement ) {
	// var status = document.getElementById('status');
	var _this = this;
	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;

	this.screen = { left: 0, top: 0, width: 0, height: 0 };

	this.rotateSpeed = 1.0;
	this.zoomSpeed = 1.2;
	this.panSpeed = 0.3;

	this.noRotate = false;
	this.noZoom = false;
	this.noPan = false;
	this.noRoll = false;


	this.staticMoving = false;
	this.dynamicDampingFactor = 0.2;

	this.minDistance = 0;
	this.maxDistance = Infinity;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];


	// internals

	var EPS = 0.000001;

	var lastPosition = new THREE.Vector3();
	var lastTouch = new THREE.Vector2();

	var _state = STATE.NONE,
	_prevState = STATE.NONE,
	_touchesLength = 0,
	_lastTouchDate = 0,

	_eye = new THREE.Vector3(),

	_rotateStart = new THREE.Vector3(),
	_rotateEnd = new THREE.Vector3(),

	_zoomStart = new THREE.Vector2(),
	_zoomEnd = new THREE.Vector2(),

	_touchZoomDistanceStart = 0,
	_touchZoomDistanceEnd = 0,

	_panStart = new THREE.Vector2(),
	_panEnd = new THREE.Vector2();

	// for reset

	this.position0 = this.object.position.clone();
	this.up0 = this.object.up.clone();


	// events

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start'};
	var endEvent = { type: 'end'};


	// methods

	this.setTarget = function ( target ) {
		this.target = target;
		this.target0 = this.target.clone();
	}

	this.setTarget( new THREE.Vector3() );

	this.handleResize = function () {

		if ( this.domElement === document ) {

			this.screen.left = 0;
			this.screen.top = 0;
			this.screen.width = window.innerWidth;
			this.screen.height = window.innerHeight;

		} else {

			var box = this.domElement.getBoundingClientRect();
			// adjustments come from similar code in the jquery offset() function
			var d = this.domElement.ownerDocument.documentElement;
			this.screen.left = box.left + window.pageXOffset - d.clientLeft;
			this.screen.top = box.top + window.pageYOffset - d.clientTop;
			this.screen.width = box.width;
			this.screen.height = box.height;

		}

	};

	this.handleEvent = function ( event ) {

		if ( typeof this[ event.type ] == 'function' ) {

			this[ event.type ]( event );

		}

	};

	var getMouseOnScreen = ( function () {

		var vector = new THREE.Vector2();

		return function ( pageX, pageY ) {

			vector.set(
				( pageX - _this.screen.left ) / _this.screen.width,
				( pageY - _this.screen.top ) / _this.screen.height
			);

			return vector;

		};

	}() );

	var getMouseProjectionOnBall = ( function () {

		var vector = new THREE.Vector3();
		var objectUp = new THREE.Vector3();
		var mouseOnBall = new THREE.Vector3();

		return function ( pageX, pageY ) {

			mouseOnBall.set(
				( pageX - _this.screen.width * 0.5 - _this.screen.left ) / (_this.screen.width*.5),
				( _this.screen.height * 0.5 + _this.screen.top - pageY ) / (_this.screen.height*.5),
				0.0
			);

			var length = mouseOnBall.length();

			if ( _this.noRoll ) {

				if ( length < Math.SQRT1_2 ) {

					mouseOnBall.z = Math.sqrt( 1.0 - length*length );

				} else {

					mouseOnBall.z = .5 / length;

				}

			} else if ( length > 1.0 ) {

				mouseOnBall.normalize();

			} else {

				mouseOnBall.z = Math.sqrt( 1.0 - length * length );

			}

			_eye.copy( _this.object.position ).sub( _this.target );

			vector.copy( _this.object.up ).setLength( mouseOnBall.y )
			vector.add( objectUp.copy( _this.object.up ).cross( _eye ).setLength( mouseOnBall.x ) );
			vector.add( _eye.setLength( mouseOnBall.z ) );

			return vector;

		};

	}() );

	this.rotateCamera = (function(){

		var axis = new THREE.Vector3(),
			quaternion = new THREE.Quaternion();


		return function () {

			var angle = Math.acos( _rotateStart.dot( _rotateEnd ) / _rotateStart.length() / _rotateEnd.length() );

			if ( angle ) {

				axis.crossVectors( _rotateStart, _rotateEnd ).normalize();

				angle *= _this.rotateSpeed;

				quaternion.setFromAxisAngle( axis, -angle );

				_eye.applyQuaternion( quaternion );
				_this.object.up.applyQuaternion( quaternion );

				_rotateEnd.applyQuaternion( quaternion );

				if ( _this.staticMoving ) {

					_rotateStart.copy( _rotateEnd );

				} else {

					quaternion.setFromAxisAngle( axis, angle * ( _this.dynamicDampingFactor - 1.0 ) );
					_rotateStart.applyQuaternion( quaternion );

				}

			}
		}

	}());

	this.zoomCamera = function () {

		if ( _state === STATE.TOUCH_ZOOM_PAN ) {

			var factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
			_touchZoomDistanceStart = _touchZoomDistanceEnd;
			_eye.multiplyScalar( factor );

		} else {

			var factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;

			if ( factor !== 1.0 && factor > 0.0 ) {

				_eye.multiplyScalar( factor );

				if ( _this.staticMoving ) {

					_zoomStart.copy( _zoomEnd );

				} else {

					_zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;

				}

			}

		}

	};

	this.panCamera = (function(){

		var mouseChange = new THREE.Vector2(),
			objectUp = new THREE.Vector3(),
			pan = new THREE.Vector3();

		return function () {

			mouseChange.copy( _panEnd ).sub( _panStart );

			if ( mouseChange.lengthSq() ) {

				mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

				pan.copy( _eye ).cross( _this.object.up ).setLength( mouseChange.x );
				pan.add( objectUp.copy( _this.object.up ).setLength( mouseChange.y ) );

				_this.object.position.add( pan );
				_this.target.add( pan );

				if ( _this.staticMoving ) {

					_panStart.copy( _panEnd );

				} else {

					_panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

				}

			}
		}

	}());

	this.checkDistances = function () {

		if ( !_this.noZoom || !_this.noPan ) {

			if ( _eye.lengthSq() > _this.maxDistance * _this.maxDistance ) {

				_this.object.position.addVectors( _this.target, _eye.setLength( _this.maxDistance ) );

			}

			if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

				_this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );

			}

		}

	};

	this.update = function () {

		_eye.subVectors( _this.object.position, _this.target );

		if ( !_this.noRotate ) {

			_this.rotateCamera();

		}

		if ( !_this.noZoom ) {

			_this.zoomCamera();

		}

		if ( !_this.noPan ) {

			_this.panCamera();

		}

		_this.object.position.addVectors( _this.target, _eye );

		_this.checkDistances();

		_this.object.lookAt( _this.target );

		if ( lastPosition.distanceToSquared( _this.object.position ) > EPS ) {

			_this.dispatchEvent( changeEvent );

			lastPosition.copy( _this.object.position );

		}

	};

	this.reset = function () {

		_state = STATE.NONE;
		_prevState = STATE.NONE;

		_this.target.copy( _this.target0 );
		_this.object.position.copy( _this.position0 );
		_this.object.up.copy( _this.up0 );

		_eye.subVectors( _this.object.position, _this.target );

		_this.object.lookAt( _this.target );

		_this.dispatchEvent( changeEvent );

		lastPosition.copy( _this.object.position );

	};

	this.getRaycasterPoint = function(event){
		// var touches = event.changedTouches;
		// var x = touches ? touches[0].pageX : event.clientX ,
		// 	y = touches ? touches[0].pageY : event.clientY ;
		var x = event.pageX,
			y = event.pageY;
        var mouse = new THREE.Vector2();
	        mouse.x = ( x / window.innerWidth ) * 2 - 1;
	        mouse.y = - ( y / window.innerHeight ) * 2 + 1;
	    //新建一个三维单位向量 假设z方向就是0.5
	    //根据照相机，把这个向量转换到视点坐标系
	    var vector = new THREE.Vector3(mouse.x, mouse.y,0.5).unproject(_this.object);
	    //在视点坐标系中形成射线,射线的起点向量是照相机， 射线的方向向量是照相机到点击的点，这个向量应该归一标准化。
	    var raycaster = new THREE.Raycaster(_this.object.position, vector.sub(_this.object.position).normalize());
	    //射线和模型求交，选中一系列直线
	    var intersects = raycaster.intersectObjects(objects);
	    if (intersects.length > 0) {
	        //选中第一个射线相交的物体
	        return intersects[0].point;
	    }
	    return false;
	}

	this.setCamera = function ( vrp, len ) {
		if(vrp){
			_this.target.copy( vrp );
	     	_this.object.lookAt( _this.target );
			_this.object.position.addVectors( _this.target, _eye.setLength( len ) );
		}
	}

	// listeners

	function keydown( event ) {

		if ( _this.enabled === false ) return;

		window.removeEventListener( 'keydown', keydown );

		_prevState = _state;

		if ( _state !== STATE.NONE ) {

			return;

		} else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && !_this.noRotate ) {

			_state = STATE.ROTATE;

		} else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && !_this.noZoom ) {

			_state = STATE.ZOOM;

		} else if ( event.keyCode === _this.keys[ STATE.PAN ] && !_this.noPan ) {

			_state = STATE.PAN;

		}

	}

	function keyup( event ) {

		if ( _this.enabled === false ) return;

		_state = _prevState;

		window.addEventListener( 'keydown', keydown, false );

	}

	touchEvent.start = function (event, eb,a,b) {
		switch(eb){
            case -1:
            case 1:
            	// log("L start");
            	if(!_this.noRotate){
            		_rotateStart.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );
				_rotateEnd.copy( _rotateStart );
            	}
            break;
            case 4:
            // log("M start");
            	if (!_this.noZoom) {
            		_zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
				_zoomEnd.copy(_zoomStart);
            	}
            break;
            case 2:
            // log("R start");
            if (!_this.noPan) {
            		_panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
				_panEnd.copy(_panStart)
            	}
            break;
            default:
            break;
        }
        /*
		if (event.button === undefined) {
			_rotateStart.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );
			_rotateEnd.copy( _rotateStart );
		}else{
			if ( _state === STATE.NONE ) {

				_state = event.button;

			}
			if ( _state === STATE.ROTATE && !_this.noRotate ) {

				_rotateStart.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );
				_rotateEnd.copy( _rotateStart );

			} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

				_zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
				_zoomEnd.copy(_zoomStart);

			} else if ( _state === STATE.PAN && !_this.noPan ) {

				_panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
				_panEnd.copy(_panStart)

			}
		}
		*/
		_this.dispatchEvent( startEvent );
	}
	/*
	function mousedown( event ) {

		if ( _this.enabled === false ) return;
		_lastTouchDate = new Date().getTime();

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.NONE ) {

			_state = event.button;

		}
		if ( _state === STATE.ROTATE && !_this.noRotate ) {

			_rotateStart.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );
			_rotateEnd.copy( _rotateStart );

		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

			_zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_zoomEnd.copy(_zoomStart);

		} else if ( _state === STATE.PAN && !_this.noPan ) {

			_panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_panEnd.copy(_panStart)

		}

		document.addEventListener( 'mousemove', mousemove, false );
		document.addEventListener( 'mouseup', mouseup, false );

		_this.dispatchEvent( startEvent );

	}
*/
	touchEvent.singleMove = function (event, eb) {
		switch(eb){
            case -1:
            case 1:
            // log("L singleMove");
            	if(!_this.noRotate){
            		_rotateEnd.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );
            	}
            break;
            case 4:
            // log("M singleMove");
            	if(!_this.noZoom){
            		_zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            	}
            break;
            case 2:
            // log("R singleMove");
            	if(!_this.noPan){
            		_panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            	}
            break;
            default:
            break;
        }
        /*
		if (event.button === undefined){
			_rotateEnd.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );
		}else{
			if ( _state === STATE.ROTATE && !_this.noRotate ) {

				_rotateEnd.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );

			} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

				_zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

			} else if ( _state === STATE.PAN && !_this.noPan ) {

				_panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

			}
		}
		*/
	}
	/*
	function mousemove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();
		if ( _state === STATE.ROTATE && !_this.noRotate ) {

			_rotateEnd.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );

		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

			_zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		} else if ( _state === STATE.PAN && !_this.noPan ) {

			_panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		}

	}
*/
	touchEvent.doubleMove = function(e1, e2) {
        var dx = e1.pageX - e2.pageX;
		var dy = e1.pageY - e2.pageY;
		_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

		var x = ( e1.pageX + e2.pageX ) / 2;
		var y = ( e1.pageY + e2.pageY ) / 2;
		_panEnd.copy( getMouseOnScreen( x, y ) );
    }
	touchEvent.end = function (event) {
		_state = STATE.NONE;
		_this.dispatchEvent( endEvent );
	}
	touchEvent.doubleTap = function(event, eb) {
		switch(eb){
            case -1:
            case 1:
            // log("L doubleTap");
            	var vrp = _this.getRaycasterPoint(event);
			_this.setCamera(vrp, 20);
            break;
        }
    }
    /*
	function mouseup( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();
		// console.log(_state);
		if( new Date().getTime() - _lastTouchDate < 200 ){
			var vrp = _this.getRaycasterPoint(event);
			_this.setCamera(vrp);
		}


		_state = STATE.NONE;

		document.removeEventListener( 'mousemove', mousemove );
		document.removeEventListener( 'mouseup', mouseup );
		_this.dispatchEvent( endEvent );

	}
	*/
	touchEvent.wheel = function (event, delta) {
		_zoomStart.y += delta * 0.01;
		_this.dispatchEvent( startEvent );
		_this.dispatchEvent( endEvent );
	}
	/*
	function mousewheel( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta / 40;

		} else if ( event.detail ) { // Firefox

			delta = -event.detail / 3;

		}

		_zoomStart.y += delta * 0.01;
		_this.dispatchEvent( startEvent );
		_this.dispatchEvent( endEvent );

	}
	*/
	/*
	var now, delta;
	var touch = {};
	function touchstart( event ) {
		event.preventDefault();
		event.stopPropagation();
		if ( _this.enabled === false ) return;
		now = Date.now();
		delta = now - (touch.last || now);
		touch.x1 = event.touches[0].pageX;
		touch.y1 = event.touches[0].pageY;
		if (delta > 0 && delta <= 250) touch.isDoubleTap = true;
		touch.last = now;
		_lastTouchDate = new Date().getTime();
		switch ( event.touches.length ) {
			case 1:
				_touchesLength = 1;
				_state = STATE.TOUCH_ROTATE;
				// lastTouch.x = event.changedTouches[0].pageX;
				// lastTouch.y = event.changedTouches[0].pageY;
				_rotateStart.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				_rotateEnd.copy( _rotateStart );
				break;

			case 2:
				_touchesLength = 2;
				_state = STATE.TOUCH_ZOOM_PAN;
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				_panStart.copy( getMouseOnScreen( x, y ) );
				_panEnd.copy( _panStart );
				break;

			default:
				_touchesLength = 0;
				_state = STATE.NONE;

		}
		_this.dispatchEvent( startEvent );


	}

	function touchmove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();
		// cancelLongTap();
		touch.x2 = event.touches[0].pageX;
		touch.y2 = event.touches[0].pageY;
		if (event.touches.length > 1 || Math.abs(touch.x1 - touch.x2) > 10)
			touch = {};
		switch ( event.touches.length ) {
			case 1:
				lastTouch = Math.abs( event.touches[0].pageX - lastTouch ) < 10 ? lastTouch : 0;
				if( _touchesLength == 1 )
					_rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				break;

			case 2:
				if( _touchesLength == 2 ){
					var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
					var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
					_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

					var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
					var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
					_panEnd.copy( getMouseOnScreen( x, y ) );
				}
				break;

			default:
				_state = STATE.NONE;

		}

	}

	function touchend( event ) {

		if ( _this.enabled === false ) return;
		if(_touchesLength == 1 && touch.isDoubleTap){
			var vrp = _this.getRaycasterPoint(event);
			_this.setCamera(vrp);
			touch = {};
		}else{

			switch ( event.touches.length ) {

				case 1:
					_touchesLength = 1;
					_rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
					_rotateStart.copy( _rotateEnd );
					break;

				case 2:
					_touchesLength = 2;
					_touchZoomDistanceStart = _touchZoomDistanceEnd = 0;

					var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
					var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
					_panEnd.copy( getMouseOnScreen( x, y ) );
					_panStart.copy( _panEnd );
					break;
				default:
					_touchesLength = 0;
					break;

			}
		}
		_state = STATE.NONE;
		_this.dispatchEvent( endEvent );

	}
*/
	// this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	// this.domElement.addEventListener( 'mousedown', mousedown, false );

	// this.domElement.addEventListener( 'mousewheel', mousewheel, false );
	// this.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

	// this.domElement.addEventListener( 'touchstart', touchstart, false );
	// this.domElement.addEventListener( 'touchend', touchend, false );
	// this.domElement.addEventListener( 'touchmove', touchmove, false );

	window.addEventListener( 'keydown', keydown, false );
	window.addEventListener( 'keyup', keyup, false );

	this.handleResize();

	// force an update at start
	this.update();

};

THREE.TrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );
