GZE_gangzone_prototype = {
	id : null,
	posX : 0,
	posY : 0,
	width : 10,
	height : 10,
	color : { r : 255, g : 255, b : 255 },
	name : 'gz',
	domElement : null,
	
	setPos : function( x, y, doNotRender ) {
		if ( typeof( x ) == 'number' ) {
			this.posX = x;
		} else {
			console.log( 'GZE_gangzone.setPos - x is not a number' );
		}
		if ( typeof( y ) == 'number' ) {
			this.posY = y;
		} else {
			console.log( 'GZE_gangzone.setPos - y is not a number' );
		}
		
		if ( doNotRender !== true ) {
			this.renderDomElement();
		}
		
		if ( GZE.activeGangzone == this ) {
			// Если это - активная зона, обновим инспектор
			GZE.updateInspector();
		}
	},
	
	setSize : function( width, height, doNotRender ) {
		if ( typeof( width ) == 'number' && width > 0 ) {
			this.width = width;
		} else {
			console.log( 'GZE_gangzone.setSize - width is not a number or less than 0' );
		}
		if ( typeof( height ) == 'number' && height > 0 ) {
			this.height = height;
		} else {
			console.log( 'GZE_gangzone.setSize - height is not a number or less than 0' );
		}
		
		if ( doNotRender !== true ) {
			this.renderDomElement();
		}
		
		if ( GZE.activeGangzone == this ) {
			// Если это - активная зона, обновим инспектор
			GZE.updateInspector();
		}
	},
	
	setPosAndSize : function( x, y, width, height, doNotRender ) {
		this.setSize( 1, 1, true );
		this.setPos( x, y, true );
		this.setSize( width, height, true );
		
		if ( doNotRender !== true ) {
			this.renderDomElement();
		}
	},
	
	setColor : function( r, g, b, doNotRender ) {
		if ( typeof( r ) == 'number' && typeof( g ) == 'number' && typeof( b ) == 'number' ) {
			if ( r < 0 ) { r = 0; } else if ( r > 255 ) { r = 255; }
			if ( g < 0 ) { g = 0; } else if ( g > 255 ) { g = 255; }
			if ( b < 0 ) { b = 0; } else if ( b > 255 ) { b = 255; }
			
			this.color = { r : r, g : g, b : b };
			
			if ( doNotRender !== true ) {
				this.renderDomElement();
			}
		
			if ( GZE.activeGangzone == this ) {
				// Если это - активная зона, обновим инспектор
				GZE.updateInspector();
			}
		}
	},
	
	setName : function( name ) {
		if ( typeof( name ) == 'string' || typeof( name ) == 'number' ) {
			this.name = name;
			
			if ( this.domElement == null ) {
				this.renderDomElement();
			} else {
				$( this.domElement ).children( '.name' ).text( name );
			}
			
			if ( GZE.activeGangzone == this ) {
				// Если это - активная зона, обновим инспектор
				GZE.updateInspector();
			}
		}
	},
	
	renderDomElement : function() {
		var instance = this;
		
		if ( this.domElement == null ) {
			this.domElement = $( '<div />' ).addClass( 'gze-gz' ).append( $( '<span class="name" />' ).text( this.name ) ).appendTo( $( '#gze-map-layer-gangzones' ) );
			
			$( this.domElement ).draggable( {
				containment: "parent",
				distance: 5,
				scroll: false,
				snap: '.gze-gz',
				snapTolerance: 5,
				start: function( event, ui ) {
					GZE.setActiveGangzone( instance.id );
				},
				drag: function( event, ui ) {
					var pos = GZE.toMapPos( ui.position.top, ui.position.left );
					instance.setPos( pos.x, pos.y, true );
					
				},
				stop: function( event, ui )
				{
					instance.renderDomElement();
				}
			} ).resizable( {
				// TODO - сделать по-своему (JQUI вечно убирает 2px там, где оно вообще ничего трогать не должно было)
				containment: "parent",
				handles: "s,e,se",
				resize: function( event, ui ) {
					instance.setSize( Math.max( 1, Math.round( ui.size.width / GZE.zoom ) ), Math.max( 1, Math.round( ui.size.height / GZE.zoom ) ), true );
				},
				stop: function( event, ui )
				{
					instance.renderDomElement();
				}
			} );
			
			$( this.domElement ).on( 'click', function( e ) {
				GZE.onGangZoneClicked( e, instance.id );
			} );
		}

		var pos = GZE.fromMapPos( instance.posX, instance.posY );
		$( this.domElement ).css({
			top: pos.top,
			left: pos.left,
			width: instance.width * GZE.zoom,
			height: instance.height * GZE.zoom,
			backgroundColor: 'rgba( ' + instance.color.r + ', ' + instance.color.g + ', ' + instance.color.b + ', ' + GZE.gangzonesAlpha + ' )'
		});
		
		this.domElement.attr( 'id', 'gze-gz-' + instance.id );
	},
	
	highlight : function( highlight ) {
		if ( this.domElement == null ) this.renderDomElement();
		
		if ( highlight ) {
			this.domElement.addClass( 'highlighted' );
		} else {
			this.domElement.removeClass( 'highlighted' );
		}
	},
	
	remove : function() {
		GZE.removeGangzone( this.id );
		
		if ( this.domElement != null ) {
			$( this.domElement ).remove();
		}
	}
}

GZE_gangzone = {
	create : function( x, y, width, height, r, g, b, name ) {
		var instance = Object.create( GZE_gangzone_prototype );
		//instance.__proto__ = GZE_gangzone_prototype;
		
		instance.setColor( r, g, b, true );
		instance.setPosAndSize( x, y, width, height, true );
		instance.setName( name );	// renders
		
		instance.id = GZE.addGangzone( instance );
		
		return instance;
	}
};