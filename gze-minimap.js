GZE_minimap = {
	
	size : { x : 200, y : 200 },
	
	_minimap : null,
	_minimapHandle : null,
	
	_visible : false,
	_cursorStartPos : { x: 0, y: 0 },
	_viewportStartPos : { x: 0, y: 0 },
	
	init : function() {
		GZE_minimap._minimap = $( '<div />' ).attr( 'id', 'gze-minimap' );
		GZE_minimap._minimapHandle = $( '<div />' ).attr( 'id', 'gze-minimap-viewport' ).appendTo( GZE_minimap._minimap );
		
		$( 'body' ).append( GZE_minimap._minimap );
		
		// Назначение горячей клавиши для открытия / закрытия карты
		GZE.bindHotKey( 86, function( keyState, isPressed ) {	// v
			if ( !isPressed ) return;
			if ( keyState == 'down' ) {
				GZE_minimap.showMinimap();
			} else {
				GZE_minimap.hideMinimap();
			}
		} );
		
		// Обработка движения мыши по мини-карте
		$( document ).on( "mousemove", function( e ) {
			GZE_minimap.mouseMoveHandler( e.pageX, e.pageY );
		} );
	},
	
	showMinimap : function() {
		if ( !GZE_minimap._visible ) {
			// Устанавливаем курсор мини-карты в текущую позицию экрана
			var posAtCenter = GZE.getPosAtScreenCenter();
			GZE_minimap.setHandlePos( posAtCenter.x, posAtCenter.y );
			
			var handleTop = ( GZE.mapOrigin.y - posAtCenter.y ) / GZE.mapSize.y * GZE_minimap.size.y;
			var handleLeft = ( posAtCenter.x - GZE.mapOrigin.x ) / GZE.mapSize.x * GZE_minimap.size.x;
		
			// Перемещаем мини-карту так, чтобы курсор оказался под мышкой
			GZE_minimap._minimap.css({
				top: GZE.mousePos.y - ( handleTop - ( GZE_minimap.size.y / 2 ) ),
				left: GZE.mousePos.x - ( handleLeft - ( GZE_minimap.size.x / 2 ) )
			});
			
			// Устанавливаем начальные данные и показываем мини-карту
			GZE_minimap._minimap.stop().fadeIn( 100 );
			GZE_minimap._visible = true;
			
			GZE_minimap._cursorStartPos.x =  GZE.mousePos.x;
			GZE_minimap._cursorStartPos.y =  GZE.mousePos.y;
			
			GZE_minimap._viewportStartPos.x = posAtCenter.x;
			GZE_minimap._viewportStartPos.y = posAtCenter.y;
		}
	},
	
	setHandlePos : function( x, y ) {
		var handleWidth = GZE._mapContainer.width() / GZE.zoom / GZE.mapSize.x * GZE_minimap.size.x;
		var handleHeight = GZE._mapContainer.height() / GZE.zoom / GZE.mapSize.y * GZE_minimap.size.y;
		
		var handleTop = ( GZE.mapOrigin.y - y ) / GZE.mapSize.y * GZE_minimap.size.y;
		var handleLeft = ( x - GZE.mapOrigin.x ) / GZE.mapSize.x * GZE_minimap.size.x;
		
		if ( handleLeft - ( handleWidth / 2 ) < 0 )
			handleLeft = handleWidth / 2;
		
		if ( handleLeft + ( handleWidth / 2 ) > GZE_minimap.size.x )
			handleLeft = GZE_minimap.size.x - ( handleWidth / 2 );
		
		if ( handleTop - ( handleHeight / 2 ) < 0 )
			handleTop = handleHeight / 2;
		
		if ( handleTop + ( handleHeight / 2 ) > GZE_minimap.size.y )
			handleTop = GZE_minimap.size.y - ( handleHeight / 2 );
		
		GZE_minimap._minimapHandle.css({
			width : handleWidth,
			height : handleHeight,
			marginLeft : -( handleWidth / 2 ),
			marginTop : -( handleHeight / 2 ),
			left : handleLeft,
			top : handleTop
		});
		
		var newPosX = GZE.mapOrigin.x + handleLeft * GZE.mapSize.x / GZE_minimap.size.x;
		var newPosY = GZE.mapOrigin.y - handleTop * GZE.mapSize.y / GZE_minimap.size.y;
		
		GZE.centerMapAt( newPosX, newPosY );
	},
	
	mouseMoveHandler : function( x, y ) {
		if ( GZE_minimap._visible ) {
			var mouseDeltaX = x - GZE_minimap._cursorStartPos.x;
			var mouseDeltaY = y - GZE_minimap._cursorStartPos.y;
			
			var positionDeltaX = mouseDeltaX * ( GZE.mapSize.x / GZE_minimap.size.x );
			var positionDeltaY = -( mouseDeltaY * ( GZE.mapSize.y / GZE_minimap.size.y ) );
			
			var newPosX = GZE_minimap._viewportStartPos.x + positionDeltaX;
			var newPosY = GZE_minimap._viewportStartPos.y + positionDeltaY;
			
			GZE_minimap.setHandlePos( newPosX, newPosY );
		}
	},
	
	hideMinimap : function() {
		if ( GZE_minimap._visible ) {
			GZE_minimap._minimap.stop().fadeOut( 100 );
			GZE_minimap._visible = false;
		}
	}
};
onJQueryLoad( function() { GZE_minimap.init(); } );