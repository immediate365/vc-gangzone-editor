GZE = {
	mapSize : { x : 4002, y : 4002 },
	mapOrigin : { x : 3998, y : 3053 },
	zoom : 1,
	zoomMin : 0.2,
	zoomMax : 4,
	zoomSteps : [ 0.2, 0.25, 0.33, 0.5, 0.75, 1, 1.5, 2, 3, 4 ],
	gangzonesAlpha : 0.5,
	gangzoneDragBorderScrollTolerance : 20,		// При перетаскивании зоны, перемещая курсор к краю карты она будет прокручиваться. Это - размер зоны
	gangzones : {},
	gangzonesAutoIncrement : 1,
	activeGangzone : null,
	lastActiveGangzoneInfo : null,
	
	_mapWrap : null,
	_menu : null,
	_mapContainer : null,
	
	_hotKeyBindings : {},
	
	mousePos : { x: 0, y: 0 },	// Позиция мышки
	
	init : function() {
		GZE._mapContainer = $( '#gze-map-container' );
		GZE._mapWrap = $( '#gze-map-wrap' );
		GZE._menu = $( '#gze-menu' );
		
		// Ресайз меню
		var menuIsResizing = false;
		var menuResizeStartX = 0;
		var menuResizeStartWidth = 0;
		$( '#gze-menu-toggle' ).bind( 'mousedown', function( e ) {
			menuIsResizing = true;
			menuResizeStartX = e.clientX;
			menuResizeStartWidth = GZE._menu.width();
		} );
		$( 'body' ).bind( 'mouseup', function( e ) {
			menuIsResizing = false;
		} );
		$( 'body' ).bind( 'mousemove', function( e ) {
			if ( menuIsResizing ) {
				// Изменяется размер меню
				if ( e.buttons != 0 ) {
					// Зажата кнопка мыши
					var width = e.clientX - menuResizeStartX + menuResizeStartWidth;
					if ( width < 0 ) {
						width = 0;
					} else if ( width > 400 ) {
						width = 400;
					}
						
					GZE._menu.css( 'width', width + 'px' );
					GZE._mapWrap.css( {
						paddingLeft : width,
						marginLeft : -width
					} );
					e.preventDefault();
					return false;
				} else {
					// Кнопка мыши не зажата, отменяем
					menuIsResizing = false;
				}
			}
		} );
		
		// Обработчик нажатий горячих клавиш
		var currentKeydownKeyCode = false;
		$( 'body' ).on( "keydown", function( e ) {
			if ( GZE.areHotKeysEnabled() ) {
				GZE.hotKeyHandler( e.keyCode, 'down', currentKeydownKeyCode != e.keyCode, e );
				currentKeydownKeyCode = e.keyCode;
			}
		} );
		$( 'body' ).on( "keyup", function( e ) {
			if ( GZE.areHotKeysEnabled() ) {
				GZE.hotKeyHandler( e.which, 'up', true, e );
				currentKeydownKeyCode = false;
			}
		} );
		
		// Прокрутка карты правой кнопкой мыши
		var rightClickMoving = false;
		var rightClickMoveStart = [0,0];
		var rightClickMoveStartMapPos = { x:0, y:0 };
		$( '#gze-map' ).bind( 'mousedown', function( e ) {
			if ( e.which == 3 ) {
				e.preventDefault();
				rightClickMoving = true;
				rightClickMoveStart = [ e.clientX, e.clientY ];
				rightClickMoveStartMapPos = GZE.getPosAtScreenCenter();
				$( 'body' ).addClass( 'gze-right-mouse-grabbing' );
				return false;
			}
		} );
		$( document ).bind( 'mousemove', function( e ) {
			if ( rightClickMoving ) {
				var deltaX = e.clientX - rightClickMoveStart[0];
				var deltaY = e.clientY - rightClickMoveStart[1];
				
				GZE.centerMapAt( rightClickMoveStartMapPos.x - deltaX / GZE.zoom, rightClickMoveStartMapPos.y + deltaY / GZE.zoom );
			}
		} );
		$( document ).bind( 'mouseup', function( e ) {
			rightClickMoving = false;
			$( 'body' ).removeClass( 'gze-right-mouse-grabbing' );
		} );
		$( '#gze-map' ).bind( 'contextmenu', function( e ) {
			// Отмена ПКМ на карте
			e.preventDefault();
			return false;
		} );
		
		GZE._mapContainer[0].addEventListener( 'wheel', function( e )
		{
			if ( !e.ctrlKey )
			{
				return;
			}
			e.preventDefault();
			GZE.setZoom( GZE.zoom * Math.exp( -e.deltaY * ( e.deltaMode == 1 ? 0.05 : 0.0015 ) ), e.pageX, e.pageY );
		}, { passive : false } );
		
		$.each( { 187 : 1, 107 : 1, 61 : 1, 189 : -1, 109 : -1, 173 : -1, 48 : 0, 96 : 0 }, function( keyCode, direction )
		{
			GZE.bindHotKey( keyCode, function( keyState, isPressed, event )
			{
				event.preventDefault();
				if ( keyState == 'down' )
				{
					if ( direction == 0 )
					{
						GZE.setZoom( 1 );
					}
					else
					{
						GZE.stepZoom( direction );
					}
				}
				return false;
			} );
		} );
		
		// Позиция мышки
		$(document).on( "mousemove", function( e ) {
			GZE.mousePos.x = e.pageX;
			GZE.mousePos.y = e.pageY;
		} );
		
		// Сортировка списка зон
		$( '#gze-zone-list' ).sortable( {
			axis: "y",
			connectWith: ".gze-zone-list-unit",
			distance: 3
		} );
		
		// Отмена выбора зоны (клик по пустому месту)
		$( '#gze-map' ).bind( 'click', function( e ) {
			if ( $( e.target ).is( '.gze-gz' ) ) {
				return;
			}
			
			var hasParentGZ = false;
			$.each( $( e.target ).parents(), function( k, v ) {
				if ( $( v ).is( '.gze-gz' ) ) {
					hasParentGZ = true;
					return false;
				}
			} );
			
			if ( !hasParentGZ ) {
				GZE.setActiveGangzone( false );
			}
		} );
		
		// Бинд - фокусирование на текущей зоне
		GZE.bindHotKey( 70, function( keyState, isPressed ) {	// f
			if ( keyState == 'down' && isPressed ) {
				if ( GZE.activeGangzone ) {
					GZE.focusOnGangzone( GZE.activeGangzone.id );
				}
			}
		} );
		
		// Бинд - удаление выделенной зоны
		GZE.bindHotKey( 46, function( keyState, isPressed ) {	// delete
			if ( keyState == 'down' && isPressed ) {
				if ( GZE.activeGangzone ) {
					GZE.activeGangzone.remove();
				}
			}
		} );
		
		// Бинд - дублирование выделенной зоны
		GZE.bindHotKey( 68, function( keyState, isPressed ) {	// d
			if ( keyState == 'down' && isPressed ) {
				if ( GZE.activeGangzone ) {
					GZE.duplicateActiveGangzone();
				}
			}
		} );
		
		// Бинд - сохранение карты
		GZE.bindHotKey( 83, function( keyState, isPressed ) {	// s
			if ( keyState == 'down' && isPressed ) {
				GZE.saveMap();
			}
		} );
		
		// Бинд - создание зоны под курсором мыши
		GZE.bindHotKey( 65, function( keyState, isPressed, event ) {	// a
			if ( keyState == 'down' && isPressed ) {
				GZE.createGangzoneUnderMouse();
			}
		} );
		
		// Бинд - стрелки (перемещение активной зоны)
		GZE.bindHotKey( 38, function( keyState, isPressed, event ) {	// Вверх
			event.preventDefault();
			if ( keyState == 'down' ) {
				if ( event.ctrlKey ) {
					GZE.resizeActiveGangzone( 'up', event.shiftKey ? 10 : 1 );
				} else {
					GZE.moveActiveGangzone( 'up', event.shiftKey ? 10 : 1 );
				}
				return false;
			}
		} );
		GZE.bindHotKey( 40, function( keyState, isPressed, event ) {	// Вниз
			event.preventDefault();
			if ( keyState == 'down' ) {
				if ( event.ctrlKey ) {
					GZE.resizeActiveGangzone( 'down', event.shiftKey ? 10 : 1 );
				} else {
					GZE.moveActiveGangzone( 'down', event.shiftKey ? 10 : 1 );
				}
				return false;
			}
		} );
		GZE.bindHotKey( 39, function( keyState, isPressed, event ) {	// Вправо
			event.preventDefault();
			if ( keyState == 'down' ) {
				if ( event.ctrlKey ) {
					GZE.resizeActiveGangzone( 'right', event.shiftKey ? 10 : 1 );
				} else {
					GZE.moveActiveGangzone( 'right', event.shiftKey ? 10 : 1 );
				}
				return false;
			}
		} );
		GZE.bindHotKey( 37, function( keyState, isPressed, event ) {	// Влево
			event.preventDefault();
			if ( keyState == 'down' ) {
				if ( event.ctrlKey ) {
					GZE.resizeActiveGangzone( 'left', event.shiftKey ? 10 : 1 );
				} else {
					GZE.moveActiveGangzone( 'left', event.shiftKey ? 10 : 1 );
				}
				return false;
			}
		} );
		
		// Координаты карты под курсором мыши
		$(document).on( "mousemove", function( e ) {
			var pos = GZE.getPosUnderMouse();
			if ( pos ) {
				$( '#gze-mouse-position-helper' ).css( {
					top : e.clientY,
					left : e.clientX
				} ).text( pos.x + ' : ' + pos.y ).show();
			} else {
				$( '#gze-mouse-position-helper' ).hide();
			}
		} );
		
		// Инспектор - при нажатии на Enter / при onBlur на полях инспектора, применение значений
		var handleInspectorFieldChange = function( parameter, value ) {
			if ( GZE.activeGangzone ) {
				if ( parameter == 'name' ) {
					GZE.activeGangzone.setName( value );
				} else {
					value = parseInt( value );
					if ( parameter == 'top' ) {
						GZE.activeGangzone.setSize( GZE.activeGangzone.width, GZE.activeGangzone.height + ( value - GZE.activeGangzone.posY ) );
						GZE.activeGangzone.setPos( GZE.activeGangzone.posX, value );
					} else if ( parameter == 'bottom' ) {
						GZE.activeGangzone.setSize( GZE.activeGangzone.width, GZE.activeGangzone.posY - value );
					} else if ( parameter == 'right' ) {
						GZE.activeGangzone.setSize( value - GZE.activeGangzone.posX, GZE.activeGangzone.height );
					} else if ( parameter == 'left' ) {
						GZE.activeGangzone.setSize( GZE.activeGangzone.width + ( GZE.activeGangzone.posX - value ), GZE.activeGangzone.height );
						GZE.activeGangzone.setPos( value, GZE.activeGangzone.posY );
					} else if ( parameter == 'width' ) {
						GZE.activeGangzone.setSize( value, GZE.activeGangzone.height );
					} else if ( parameter == 'height' ) {
						GZE.activeGangzone.setSize( GZE.activeGangzone.width, value );
					}
				}
				
				GZE.updateInspector();
			}
		};
		$.each( $( '#gze-zone-inspector' ).find( 'input' ), function( k, v ) {
			$( v ).on( 'blur', function() {
				handleInspectorFieldChange( $( v ).attr( 'data-inspectorParameter' ), $( v ).val() );
			} );
			$( v ).on( 'keydown', function( e ) {
				if ( e.which == 13 ) {	// Enter
					handleInspectorFieldChange( $( v ).attr( 'data-inspectorParameter' ), $( v ).val() );
					$( v ).blur();
				}
			} );
		} );
		
		// Автосохранение карты
		$( window ).bind( 'beforeunload', function() {
			// Пользователь закрыл вкладку, сохраняем карту в localStorage
			GZE.autosaveMap();
		} );
		setInterval( function() {
			GZE.autosaveMap();
		}, 30000 );
		
		// Загрузка карты из localStorage
		var autosave = localStorage.getItem( '_gze_vc_autosave' );
		if ( autosave ) {
			// Загрузка зон
			autosave = JSON.parse( autosave );
			GZE.setZoom( autosave.zoom || 1 );
			$.each( autosave.map, function( k, v ) {
				GZE_gangzone.create( v.posX, v.posY, v.width, v.height, v.color.r, v.color.g, v.color.b, v.name );
			} );
			
			// Прокрутка карты
			GZE.centerMapAt( autosave.screenPos.x, autosave.screenPos.y );
		} else {
			GZE.setZoom( 1 );
			GZE.centerMapAt( GZE.mapOrigin.x + ( GZE.mapSize.x / 2 ), GZE.mapOrigin.y - ( GZE.mapSize.y / 2 ) );
		}
	},
	
	// Автоматическое сохранение карты в localStorage
	autosaveMap : function() {
		console.time( 'autosaveMap' );
		
		var data = Object.create( null );
		$.each( GZE.gangzones, function( k, v ) {
			data[ k ] = {
				name : v.name,
				posX : v.posX,
				posY : v.posY,
				width : v.width,
				height : v.height,
				color : v.color
			};
		} );
		localStorage.setItem( '_gze_vc_autosave', JSON.stringify( {
			map: data, 
			screenPos : GZE.getPosAtScreenCenter(),
			zoom : GZE.zoom
		} ) );
		
		console.timeEnd( 'autosaveMap' );
	},
	
	// Создать новую карту и удалить все, что было создано
	startNewMap : function() {
		$.each( GZE.gangzones, function( k, v ) {
			v.remove();
		} );
	},
	
	// Преобразование css top и css left в координату карты
	toMapPos : function( top, left ) {
		return {
			x : Math.round( left / GZE.zoom ) + GZE.mapOrigin.x,
			y : GZE.mapOrigin.y - Math.round( top / GZE.zoom )
		};
	},
	
	// Позиция на карте в css top и left
	fromMapPos : function( x, y ) {
		return {
			left : ( x - GZE.mapOrigin.x ) * GZE.zoom,
			top : ( GZE.mapOrigin.y - y ) * GZE.zoom
		};
	},
	
	// Обновить данные в инспекторе
	updateInspector : function() {
		if ( GZE.activeGangzone ) {
			$( '#gze-zone-inspector' ).removeClass( 'unactive' );
			$( '#gze-inspector-name' ).val( GZE.activeGangzone.name );
			$( '#gze-inspector-border-left' ).val( GZE.activeGangzone.posX );
			$( '#gze-inspector-border-top' ).val( GZE.activeGangzone.posY );
			$( '#gze-inspector-border-bottom' ).val( GZE.activeGangzone.posY - GZE.activeGangzone.height );
			$( '#gze-inspector-border-right' ).val( GZE.activeGangzone.posX + GZE.activeGangzone.width );
			$( '#gze-inspector-width' ).val( GZE.activeGangzone.width );
			$( '#gze-inspector-height' ).val( GZE.activeGangzone.height );
			
			$( '.gze-inspector-color.active' ).removeClass( 'active' );
			$( '#gze-inspector-color-' + GZE.activeGangzone.color.r + '_' + GZE.activeGangzone.color.g + '_' + GZE.activeGangzone.color.b ).addClass( 'active' );
			
			// Обновим цвет в списке зон
			GZE.activeGangzone._gzeListDomElement.children( '.color' ).css( 'background-color', 'rgb(' + GZE.activeGangzone.color.r + ',' + GZE.activeGangzone.color.g + ',' + GZE.activeGangzone.color.b + ')' );
			// Обновим имя в списке зон
			GZE.activeGangzone._gzeListDomElement.children( '.name' ).text( GZE.activeGangzone.name );
		} else {
			$( '#gze-zone-inspector' ).addClass( 'unactive' );
			$( '#gze-inspector-name' ).val( '' );
			$( '#gze-inspector-border-left' ).val( '' );
			$( '#gze-inspector-border-top' ).val( '' );
			$( '#gze-inspector-border-bottom' ).val( '' );
			$( '#gze-inspector-border-right' ).val( '' );
			$( '#gze-inspector-width' ).val( '' );
			$( '#gze-inspector-height' ).val( '' );
		}
	},
	
	// Добавить ганг-зону в массив и список, возвратить ID
	addGangzone : function( gzInstance ) {
		var id = GZE.gangzonesAutoIncrement;
		GZE.gangzones[ id ] = gzInstance;
		
		var listElement = $( '<div />' ).addClass( 'gze-zone-list-unit' ).append(
			$( '<span />' ).addClass( 'name' ).text( gzInstance.name ),
			$( '<span />' ).addClass( 'color' ).css( 'background-color', 'rgb(' + gzInstance.color.r + ',' + gzInstance.color.g + ',' + gzInstance.color.b + ')' )
		);
		gzInstance._gzeListDomElement = listElement;
		listElement.prependTo( '#gze-zone-list' );
		
		$( listElement ).on( 'click', function( e ) {
			GZE.onGangZoneClicked( e, gzInstance.id );
		} );
		
		$( listElement ).on( 'dblclick', function( e ) {
			GZE.focusOnGangzone( gzInstance.id );
		} );
		
		GZE.setActiveGangzone( id );
		
		GZE.gangzonesAutoIncrement++;
		
		return id;
	},
	
	// Создать дубликат выделенной зоны
	duplicateActiveGangzone : function( doNotFocus ) {
		if ( GZE.activeGangzone ) {
			var gz = GZE_gangzone.create( GZE.activeGangzone.posX, GZE.activeGangzone.posY, GZE.activeGangzone.width, GZE.activeGangzone.height, GZE.activeGangzone.color.r, GZE.activeGangzone.color.g, GZE.activeGangzone.color.b, GZE.activeGangzone.name );
			
			if ( doNotFocus !== true ) {
				GZE.setActiveGangzone( gz.id );
			}
		}
	},
	
	// Сдвинуть активную зону (используется биндом на стрелки)
	moveActiveGangzone : function( direction, distance ) {
		if ( typeof( distance ) == 'undefined' ) distance = 1;
		
		if ( GZE.activeGangzone ) {
			if ( direction == 'left' ) {
				GZE.activeGangzone.setPos( GZE.activeGangzone.posX - distance, GZE.activeGangzone.posY );
			} else if ( direction == 'right' ) {
				GZE.activeGangzone.setPos( GZE.activeGangzone.posX + distance, GZE.activeGangzone.posY );
			} else if ( direction == 'down' ) {
				GZE.activeGangzone.setPos( GZE.activeGangzone.posX, GZE.activeGangzone.posY - distance );
			} else {
				GZE.activeGangzone.setPos( GZE.activeGangzone.posX, GZE.activeGangzone.posY + distance );
			}
			// TODO - прокрутка карты, если зона перемещена за область просмотра
		}
	},
	
	// Изменить размер активной зоны
	resizeActiveGangzone : function( direction, distance ) {
		if ( typeof( distance ) == 'undefined' ) distance = 1;
		
		if ( GZE.activeGangzone ) {
			if ( direction == 'left' ) {
				GZE.activeGangzone.setSize( GZE.activeGangzone.width - distance, GZE.activeGangzone.height );
			} else if ( direction == 'right' ) {
				GZE.activeGangzone.setSize( GZE.activeGangzone.width + distance, GZE.activeGangzone.height );
			} else if ( direction == 'down' ) {
				GZE.activeGangzone.setSize( GZE.activeGangzone.width, GZE.activeGangzone.height + distance );
			} else {
				GZE.activeGangzone.setSize( GZE.activeGangzone.width, GZE.activeGangzone.height - distance );
			}
			// TODO - прокрутка карты, если зона перемещена за область просмотра
		}
	},
	
	onGangZoneClicked : function( clickEvent, gzID ) {
		GZE.setActiveGangzone( gzID );
	},
	
	// Убрать ганг-зону из списка и массива
	// Не выывать для удаления! Вместо этого вызывать метод delete() зоны
	removeGangzone : function( gzID ) {
		if ( GZE.activeGangzone && GZE.activeGangzone.id == gzID ) {
			GZE.setActiveGangzone( false );
		}
		
		$( GZE.gangzones[ gzID ]._gzeListDomElement ).remove();
		delete GZE.gangzones[ gzID ];
	},
	
	// Установить активную зону (gzID = false, чтобы не выбирать ни одной)
	setActiveGangzone : function( gzID ) {
		if ( GZE.activeGangzone != null ) {
			GZE.activeGangzone.highlight( false );
			GZE.activeGangzone._gzeListDomElement.removeClass( 'active' );
		}
		
		if ( gzID !== false && gzID !== null ) {
			GZE.gangzones[ gzID ]._gzeListDomElement.addClass( 'active' );
			GZE.gangzones[ gzID ].highlight( true );
			GZE.activeGangzone = GZE.gangzones[ gzID ];
			GZE.lastActiveGangzoneInfo = {
				name : GZE.activeGangzone.name,
				color : { r : GZE.activeGangzone.color.r, g : GZE.activeGangzone.color.g, b : GZE.activeGangzone.color.b }
			};
		} else {
			GZE.activeGangzone = null;
		}
		
		GZE.updateInspector();
	},
	
	// Переместить фокус на зону (поместить в центр карты)
	focusOnGangzone : function( gzID ) {
		GZE.centerMapAt( GZE.gangzones[ gzID ].posX + ( GZE.gangzones[ gzID ].width / 2 ), GZE.gangzones[ gzID ].posY - ( GZE.gangzones[ gzID ].height / 2 ) );
	},
	
	hotKeyHandler : function( keyCode, type, isPressed, event ) {
		if ( typeof( GZE._hotKeyBindings[ keyCode ] ) != 'undefined' ) {
			return GZE._hotKeyBindings[ keyCode ]( type, isPressed, event );
		}
	},
	
	areHotKeysEnabled : function() {
		var disabledOnFocus = { input : 1, textarea : 1 };
		return disabledOnFocus[ document.activeElement.tagName.toLowerCase() ] != 1;
	},
	
	// Вызывается многократно! Обработчик принимает 2 параметра - up/down и isPressed (при первом мызове зажатой кнопки)
	bindHotKey : function( keyCode, handlerFunction ) {
		if ( typeof( GZE._hotKeyBindings[ keyCode ] ) != 'undefined' ) {
			console.error( 'GZE: Hot key ' + keyCode + ' is already binded' );
			return false;
		} else {
			GZE._hotKeyBindings[ keyCode ] = handlerFunction;
		}
	},
	
	// Отцентровать карту (сделать x, y по центру карты)
	centerMapAt : function( x, y ) {
		var scrollLeft = ( x - GZE.mapOrigin.x ) * GZE.zoom - ( GZE._mapContainer.width() / 2 );
		var scrollTop = ( GZE.mapOrigin.y - y ) * GZE.zoom - ( GZE._mapContainer.height() / 2 );
		GZE._mapContainer[0].scrollLeft = scrollLeft;
		GZE._mapContainer[0].scrollTop = scrollTop;
	},
	
	setZoom : function( zoom, screenX, screenY )
	{
		zoom = Math.min( GZE.zoomMax, Math.max( GZE.zoomMin, zoom ) );
		
		var container = GZE._mapContainer;
		var offset = container.offset();
		if ( typeof( screenX ) == 'undefined' )
		{
			screenX = offset.left + ( container.width() / 2 );
			screenY = offset.top + ( container.height() / 2 );
		}
		var localX = screenX - offset.left;
		var localY = screenY - offset.top;
		var anchorX = ( container[0].scrollLeft + localX ) / GZE.zoom;
		var anchorY = ( container[0].scrollTop + localY ) / GZE.zoom;
		
		GZE.zoom = zoom;
		$( '#gze-map' ).css( {
			width : GZE.mapSize.x * zoom,
			height : GZE.mapSize.y * zoom,
			backgroundSize : ( GZE.mapSize.x * zoom ) + 'px ' + ( GZE.mapSize.y * zoom ) + 'px'
		} );
		$.each( GZE.gangzones, function( k, v )
		{
			v.renderDomElement();
		} );
		
		container[0].scrollLeft = ( anchorX * zoom ) - localX;
		container[0].scrollTop = ( anchorY * zoom ) - localY;
		
		$( '#gze-zoom-level' ).text( Math.round( zoom * 100 ) + '%' );
	},
	
	stepZoom : function( direction )
	{
		var steps = GZE.zoomSteps;
		var next = direction > 0 ? GZE.zoomMax : GZE.zoomMin;
		for ( var i = 0; i < steps.length; i++ )
		{
			var step = direction > 0 ? steps[ i ] : steps[ steps.length - 1 - i ];
			if ( direction > 0 ? step > GZE.zoom * 1.01 : step < GZE.zoom * 0.99 )
			{
				next = step;
				break;
			}
		}
		GZE.setZoom( next );
	},
	
	// Получить текущие координаты, что находятся в центре экрана
	getPosAtScreenCenter : function() {
		return {
			x : ( GZE._mapContainer[0].scrollLeft + ( GZE._mapContainer.width() / 2 ) ) / GZE.zoom + GZE.mapOrigin.x,
			y : GZE.mapOrigin.y - ( GZE._mapContainer[0].scrollTop + ( GZE._mapContainer.height() / 2 ) ) / GZE.zoom
		};
	},
	
	// Получить координаты под курсором мыши, или false, если мышь не на карте
	getPosUnderMouse : function() {
		var mapContainerOffset = GZE._mapContainer.offset();
		if ( 
			GZE.mousePos.x < mapContainerOffset.left || GZE.mousePos.y < mapContainerOffset.top 
			|| GZE.mousePos.x > mapContainerOffset.left + GZE._mapContainer.width() || GZE.mousePos.y > mapContainerOffset.top + GZE._mapContainer.height() 
		) {
			return false;
		} else {
			return {
				x : Math.round( ( GZE._mapContainer[0].scrollLeft + ( GZE.mousePos.x - mapContainerOffset.left ) ) / GZE.zoom ) + GZE.mapOrigin.x,
				y : GZE.mapOrigin.y - Math.round( ( GZE._mapContainer[0].scrollTop + ( GZE.mousePos.y - mapContainerOffset.top ) ) / GZE.zoom )
			};
		}
	},
	
	// Создать зону в центре экрана
	createGangzoneInScreenCenter : function( doNotFocus ) {
		var pos = GZE.getPosAtScreenCenter();
		var gz = GZE_gangzone.create( Math.round( pos.x ) - 50, Math.round( pos.y ) + 50, 100, 100, 255, 0, 0, "Zone" );
		
		if ( doNotFocus !== true ) {
			GZE.setActiveGangzone( gz.id );
		}
		
		gz.setName( "Zone " + gz.id );
	},
	
	// Создать зону под курсором мышки
	createGangzoneUnderMouse : function( doNotFocus ) {
		var name = GZE.lastActiveGangzoneInfo ? GZE.lastActiveGangzoneInfo.name : "Zone";
		var color = GZE.lastActiveGangzoneInfo ? GZE.lastActiveGangzoneInfo.color : { r: 255, g: 0, b: 0 };
		
		var pos = GZE.getPosUnderMouse();
		var gz = GZE_gangzone.create( pos.x - 50, pos.y + 50, 100, 100, color.r, color.g, color.b, name );
		
		if ( doNotFocus !== true ) {
			GZE.setActiveGangzone( gz.id );
		}
	},
	
	// Получить самое подходящее разрешение карты GTA SA, которое перекроет блок шириной width
	getBestMapResolution : function( width ) {
		var last = 0;
		for ( var i=0; i<GZE._availableMapSize.length; i++ ) {
			if ( GZE._availableMapSize[ i ] > width ) {
				return GZE._availableMapSize[ i ];
			}
			last = GZE._availableMapSize[ i ];
		}
		
		return last;
	}
};