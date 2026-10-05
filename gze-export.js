GZE_export = {
	init : function() {
		$( '#gze-export' ).draggable({
			distance: 5,
			handle: "#gze-export-tabs-header",
			stack: ".gze-window"
		});
	},
	
	open : function( page ) {
		GZE_export.show();
		
		$( '.gze-export-tab-content' ).removeClass( 'active' );
		$( '.gze-export-tab-title' ).removeClass( 'active' );
		
		$( '#gze-export-title-' + page ).addClass( 'active' );
		$( '#gze-export-tab-' + page ).addClass( 'active' );
	},
	
	show : function() {
		$( '#gze-export' ).fadeIn();
	},
	
	hide : function() {
		$( '#gze-export' ).fadeOut();
	},
	
	runExport : function() {
		var template = $( '#gze-export-custom-pattern' ).val();
		var exported = 'Template:' + "\n";
		exported += template;
		exported += "\n---\n";
		
		$.each( GZE.gangzones, function( k, v ) {
			var zoneStr = template;
			zoneStr = zoneStr.replace( '[name]', v.name );
			zoneStr = zoneStr.replace( '[minx]', v.posX );
			zoneStr = zoneStr.replace( '[maxy]', v.posY );
			zoneStr = zoneStr.replace( '[width]', v.width );
			zoneStr = zoneStr.replace( '[height]', v.height );
			zoneStr = zoneStr.replace( '[maxx]', v.posX + v.width );
			zoneStr = zoneStr.replace( '[miny]', v.posY - v.height );
			zoneStr = zoneStr.replace( '[color-hex]', ( ("0" + v.color.r.toString(16)).slice(-2) + ("0" + v.color.g.toString(16)).slice(-2) + ("0" + v.color.b.toString(16)).slice(-2) ).toUpperCase() );
			zoneStr = zoneStr.replace( '[color-rgb]', v.color.r + ',' + v.color.g + ',' + v.color.b );
			exported += zoneStr;
		} );
		
		/*
		var element = document.createElement( 'a' );
		element.setAttribute( 'href', 'data:text/plain;charset=utf-8,' + encodeURIComponent( exported ) );
		//element.setAttribute( 'download', 'GZE-export.txt' );
		element.setAttribute( 'target', '_blank' );

		element.style.display = 'none';
		document.body.appendChild( element );

		element.click();
		document.body.removeChild( element );
		*/
		$('body').append(
			$('<div id="gze-export-field-underlay" />').on('click', function(){
				$('#gze-export-field-underlay').remove();
				$('#gze-export-field').remove();
			}),
			$('<div id="gze-export-field" />').attr('contenteditable', 'true').text(exported)
		);
	},
	
	loadImportFile : function( input )
	{
		if ( !input.files || !input.files[0] )
		{
			return;
		}
		var reader = new FileReader();
		reader.onload = function()
		{
			$( '#gze-import-text' ).val( reader.result );
		};
		reader.readAsText( input.files[0] );
		input.value = '';
	},
	
	parseZones : function( text )
	{
		if ( /^\s*Template:/.test( text ) )
		{
			var separator = text.match( /^---[ \t]*$/m );
			if ( separator )
			{
				text = text.slice( separator.index + separator[0].length );
			}
		}
		
		var zones = [];
		$.each( text.split( /\r?\n/ ), function( k, line )
		{
			var name = 'gz';
			var color = { r : 255, g : 255, b : 255 };
			
			var nameMatch = line.match( /"((?:[^"\\]|\\.)*)"/ );
			if ( nameMatch )
			{
				name = nameMatch[1].replace( /\\(.)/g, '$1' );
				line = line.replace( nameMatch[0], ' ' );
			}
			
			var colorMatch = line.match( /0x([0-9a-f]{6})(?:[0-9a-f]{2})?(?![0-9a-z])/i );
			if ( colorMatch )
			{
				var hex = parseInt( colorMatch[1], 16 );
				color = { r : ( hex >> 16 ) & 255, g : ( hex >> 8 ) & 255, b : hex & 255 };
				line = line.replace( colorMatch[0], ' ' );
			}
			
			var nums = [];
			var numRegex = /(?:^|[^\w.])(-?\d+(?:\.\d+)?)(?![\w.])/g;
			var m;
			while ( ( m = numRegex.exec( line ) ) !== null && nums.length < 4 )
			{
				nums.push( parseFloat( m[1] ) );
			}
			if ( nums.length < 4 )
			{
				return;
			}
			
			var minX = Math.min( nums[0], nums[2] );
			var maxX = Math.max( nums[0], nums[2] );
			var minY = Math.min( nums[1], nums[3] );
			var maxY = Math.max( nums[1], nums[3] );
			if ( maxX - minX <= 0 || maxY - minY <= 0 )
			{
				return;
			}
			
			zones.push( { name : name, color : color, posX : minX, posY : maxY, width : maxX - minX, height : maxY - minY } );
		} );
		return zones;
	},
	
	runImport : function()
	{
		var zones = GZE_export.parseZones( $( '#gze-import-text' ).val() );
		if ( zones.length == 0 )
		{
			window.alert( 'No zones found. Each line needs minx, miny, maxx, maxy.' );
			return;
		}
		
		if ( $( '#gze-import-replace' ).is( ':checked' ) )
		{
			if ( !$.isEmptyObject( GZE.gangzones ) && !window.confirm( 'Replace all existing zones with ' + zones.length + ' imported zone(s)?' ) )
			{
				return;
			}
			GZE.startNewMap();
		}
		
		var first = null;
		$.each( zones, function( k, v )
		{
			var gz = GZE_gangzone.create( v.posX, v.posY, v.width, v.height, v.color.r, v.color.g, v.color.b, v.name );
			if ( first == null )
			{
				first = gz;
			}
		} );
		
		GZE.autosaveMap();
		GZE.focusOnGangzone( first.id );
		$( '#gze-import-text' ).val( '' );
		GZE_export.hide();
	}
};
