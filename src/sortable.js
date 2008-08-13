(function($){

$.Interaction.add('sortable', {
	defaults:
	{
		marker: 'transparent',
		boundary: 6,
		align: 'vertical',
		accept: false,
		transfer: 'move'
	},
	
	init: function(setting)
	{
		this.base();
		$.extend(this.setting, setting);
		
		this.parseMarker();
		
		if(!this.element.data('interaction-draggable'))
			this.element.draggable({
				start: this.wrap('mouseStart'),
				drag: this.wrap('mouseDrag'),
				stop: this.wrap('mouseStop')
			});
		else
			this.element.draggable('listen', {
				start: this.wrap('mouseStart'),
				drag: this.wrap('mouseDrag'),
				stop: this.wrap('mouseStop')
			});
		
		if(this.setting.accept)
		{
			if(typeof this.setting.accept == 'string')
			{
				var className = this.setting.accept;
				this.setting.accept = function(element){return element.hasClass(className)};
			}
			
			if(!this.element.data('interaction-droppable'))
				this.element.droppable({
					over: this.wrap('dragOver')
				});
			else
				this.element.droppable('listen', {
					over: this.wrap('dragOver')
				});
			
			this.element.data('interaction-droppable').setting.dynamic = true;
		}
		
		this.draggable = this.element.data('interaction-draggable');
		
		this.extractListener('reorder');
		
		this.currentIndex = -1;
		this.lastIndex = -1;
		this.isActive = false;
		
		this.callListener('init');
	},
	
	parseMarker: function()
	{
		if(typeof this.setting.marker == 'function')
			return;
		
		var marker = this.setting.marker;
		
		if(marker == 'transparent')
			marker = function(item){
				return item.eq(0).clone().css('visibility', 'hidden');
			};
		else if(marker == 'separator')
			marker = function(item, align){
				return $('<div></div>')
					.css('overflow', 'hidden')
					.addClass('interaction-sortable-separator')[(align == 'vertical' ? 'height' : 'width')](0);
			};
		else
			marker = function(item){
				return item.clone();
			}
		
		this.setting.marker = marker;
	},
	
	mouseStart: function()
	{
		this.isActive = true;
		this.item = this.draggable.item;
		this.marker = this.setting.marker(this.item, this.setting.align);
		this.marker.removeClass('chain-item').addClass('interaction-sortable-marker');
		this.item.eq(0).before(this.marker);
		this.item.hide();
		this.currentIndex = this.marker.parent().children(':visible').index(this.marker);
		this.lastIndex = this.currentIndex;
	},
	
	mouseDrag: function()
	{
		if(this.item)
		{	
			var pos = this.draggable.position;
			var setting = this.setting;
			var item = this.item;
			var marker = this.marker;
			var self = this;
			
			var offset = this.element.offset();
			offset.height = this.element[0].offsetHeight;
			offset.width = this.element[0].offsetWidth;
			
			if(pos.y < offset.top || pos.y > (offset.top + offset.height)
				|| pos.x < offset.left || pos.x > (offset.left + offset.width))
			{
				item.eq(0).before(marker);
				return;
			}
			
			var items = this.element.items();
			var markerIndex = marker.parent().children(':visible').index(marker);
			
			for(var i=0; i<items.length; i++)
			{
				var hover = $(items[i]);
				var offset = hover.offset();
				
				offset.height = hover[0].offsetHeight;
				offset.width = hover[0].offsetWidth;
				
				if(setting.align == 'vertical')
				{ var xy = 'y';var tl = 'top';var hw = 'height'; }
				else
				{ var xy = 'x';var tl = 'left';var hw = 'width'; }
				
				self.currentIndex = markerIndex;
				var moved = self.currentIndex != self.lastIndex;
			
				if(hover.prev()[0] != marker[marker.length-1]
					&& pos[xy] - offset[tl] > 0 && pos[xy] - offset[tl] < setting.boundary)
					hover.before(marker);
				else if(hover.next()[0] != marker[0]
					&& offset[tl] + offset[hw] - pos[xy] > 0 && offset[tl] + offset[hw] - pos[xy] < setting.boundary)
					hover.after(marker);
				
				if(moved)
				{
					self.callListener('reorder');
					self.lastIndex = self.currentIndex;
					break;
				}
			}
			this.element.items().each(function(){
				
			});
		}
	},
	
	mouseStop: function()
	{
		if(this.item && $.Chain.jidentic(this.item.item('root'), this.element))
		{
			this.marker.before(this.item);
			this.item.show();
		}
		this.marker.remove();
		
		
		this.isActive = false;
		this.item = null;
		this.marker = null;
		this.element.update();
	},
	
	dragOver: function(droppable, item)
	{
		if(item.item('root') == this.element)
			return;
		
		var sortable = item.item('root').data('interaction-sortable');
		
		if(this.setting.accept(sortable.element, item))
		{
			var cursor = sortable.draggable.cursor;
			
			var newItem = $().eq(-1);
			var data = item.map(function(){return $(this).item();}).get();
			this.element.items('merge', data);
			for(var i=0; i<data.length; i++)
				newItem = newItem.add(this.element.items(data[i]));
			
			if(sortable.setting.transfer == 'move')
				item.remove();
				
			sortable.draggable.mouseUp(sortable.draggable.mouseDownEvent);
			this.draggable.item = newItem;
			this.draggable.cursor = cursor;
			this.draggable.mouseDown(sortable.draggable.mouseMoveEvent);
		}
	},
	
	$destroy: function()
	{
		this.element.draggable('unlisten', 'start', this.wrap('mouseStart'));
		this.element.draggable('unlisten', 'drag', this.wrap('mouseDrag'));
		this.element.draggable('unlisten', 'stop', this.wrap('mouseStop'));
	}
});

})(jQuery);