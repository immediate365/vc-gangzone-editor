GZE_help = {
	init : function() {
		$( '#gze-help' ).draggable({
			distance: 5,
			handle: "#gze-help-tabs-header",
			stack: ".gze-window"
		});
	},
	
	open : function( helpPage ) {
		GZE_help.show();
		
		$( '.gze-help-tab-content' ).removeClass( 'active' );
		$( '.gze-help-tab-title' ).removeClass( 'active' );
		
		$( '#gze-help-title-' + helpPage ).addClass( 'active' );
		$( '#gze-help-tab-' + helpPage ).addClass( 'active' );
	},
	
	show : function() {
		$( '#gze-help' ).fadeIn();
	},
	
	hide : function() {
		$( '#gze-help' ).fadeOut();
	}
};