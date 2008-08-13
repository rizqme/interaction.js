(function($){

$.Interaction.add('selectable', {
	defaults:
	{
		multiple: false,
		required: false,
		selected: null,
		selectClass: 'selected',
		drag: false
	},
	
	init: function(setting)
	{
		this.base();
		$.extend(this.setting, setting);
		
		this.selected = this.setting.selected ? $(this.setting.selected) : $().eq(-1);
		
		this.extractListener('select', 'unselect', 'change');
		this.callListener('init');
	},
	
	builder: function(item)
	{
		var self = this;
		item
			.bind('mousedown.selectable-item', function(event){
				if(self.isEnabled)
					self.mouseDown(event, item);
			})
			.bind('click.selectable-item', function(event){
				if(self.isEnabled)
					return self.mouseClick(event, item);
			});
		
		if(this.setting.required && !this.selected.length && item.parent().children(':visible').index(item) == 0)
			this.select(item);
		else if(this.selected.index(item) > -1)
			this.select(item);
	},
	
	mouseDown: function(event, item)
	{
		this.mouseDownEvent = event;
		var draggable = this.element.draggable('service');
		if(draggable && this.$selected(item) && this.setting.drag)
		{
			draggable.mouseUp(draggable.mouseDownEvent);
			draggable.item = this.selected.filter(':visible');
			draggable.mouseDown(event);
		}
	},
	
	mouseClick: function(event, item)
	{
		if($.browser.msie && this.mouseDownEvent);
			event = this.mouseDownEvent;
		
		if(event.which != 1)
			alert(event.which);
		
		if(event.metaKey)
		{
			if(this.$selected(item) && (!this.setting.required || this.selected.length > 1))
				this.$unselect(item);
			else
				this.$select(item);	
		}
		else if(event.shiftKey)
		{
			var selected = this.selected.eq(0);
			
			if(selected.length && !$.Chain.jidentic(item, selected))
			{
				var items = selected.parent().children(':visible');
				var dir = items.index(selected) < items.index(item) ? 'next' : 'prev';
				var next = selected[dir]();
				while(next.length)
				{
					selected = selected.add(next);
					if($.Chain.jidentic(next, item))
						break;
					next = next[dir]();
				}
			}
			
			this.clear();
			this.$select(selected.length ? selected : item);
		}
		else
		{
			this.clear();
			this.$select(item);
		}
	},
	
	select: function()
	{
		var args = Array.prototype.slice.call(arguments);
		var self = this;
		
		this.selected.removeClass(this.setting.selectClass);
		
		$.each(args, function(){
			if(this && typeof this != 'boolean')
				self.selected = self.selected.add(self.element.items(this));
		});
		
		this.selected = this.selected.filter(function(){
			var root = $(this).item('root');
			return this && root && root[0] == self.element[0];
		});
		
		if(!this.setting.multiple)
			this.selected = this.selected.eq(this.selected.length - 1);
		
		this.selected.addClass(this.setting.selectClass);
	},
	
	unselect: function()
	{
		var args = Array.prototype.slice.call(arguments);
		var self = this;
		
		this.selected.removeClass(this.setting.selectClass);
		
		$.each(args, function(){
			if(this && typeof this != 'boolean')
				self.selected = self.selected.not(self.element.items(this));
		});
		
		this.selected.addClass(this.setting.selectClass);
	},
	
	clear: function()
	{
		this.selected.removeClass(this.setting.selectClass);
		this.selected = $().eq(1);
	},
	
	$select: function()
	{
		if(!this.isEnabled) return this.element;
		
		this.select.apply(this, Array.prototype.slice.call(arguments));
		
		this.callListener('select');
		this.callListener('change');
		
		return this.element;
	},
	
	$unselect: function()
	{
		if(!this.isEnabled) return this.element;
		
		this.unselect.apply(this, Array.prototype.slice.call(arguments));
		
		this.callListener('unselect');
		this.callListener('change');
		
		return this.element;
	},
	
	$clear: function()
	{
		if(!this.isEnabled) return this.element;
		
		this.clear();
		
		this.callListener('unselect');
		this.callListener('change');
		
		return this.element;
	},
	
	$selected: function(item)
	{
		if(!this.isEnabled) return $().eq(-1);
		
		if(item === true)
			return this.selected;
		else if(arguments.length && typeof item != 'boolean' && item !== null)
			return this.selected.index(this.element.items(item)) > -1;
		else
			return this.selected.filter(':visible');
	}
});

// Update element on selection change
$.Interaction.listen('selectable',{
	change: function()
	{
		this.element.update();
	}
});

})(jQuery);