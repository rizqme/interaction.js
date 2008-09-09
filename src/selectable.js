(function($){

$.Interaction.add('selectable', {
	defaults:
	{
		multiple: false,
		required: false,
		selected: null,
		handle: null,
		selectClass: 'selected',
		nested: false,
		drag: false
	},
	
	init: function(setting)
	{
		this.base();
		$.extend(this.setting, setting);
		
		this.selected = this.setting.selected ? $(this.setting.selected) : $().eq(-1);
		
		var self = this;
		this.element.items('collection', 'selected', function(){
			return self.getSelected().filter(':visible');
		});
		
		this.element.items('collection', 'selected-all', function(){
			return self.getSelected();
		});
		
		this.extractListener('select', 'unselect', 'change');
		this.callListener('init');
	},
	
	builder: function(item)
	{
		var handle, self = this;
		
		if(this.setting.handle)
			handle = item.find('> '+this.setting.handle+', *:not(.chain-element) '+this.setting.handle).eq(0);
		
		if(!handle)
			handle = item;
		
		item
			.bind('mousedown.selectable-item', function(event){
				if(self.isEnabled
					&& $(event.target).parents().add(event.target).filter(function(){return handle[0] == this;}).length)
					return self.mouseDown(event, item);
			})
			.bind('click.selectable-item', function(event){
				if(self.isEnabled
					&& $(event.target).parents().add(event.target).filter(function(){return handle[0] == this;}).length)
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
	
	getParent: function()
	{
		return this.setting.nested ? this.element.parents('.interaction-selectable')
			.eq(0) : $().eq(-1);
	},
	
	getAncestor: function()
	{
		var parent = this.getParent();
		
		if(parent.length)
			return parent.data('interaction-selectable').getAncestor();
		else
			return this.element;
	},
	
	getNested: function(recursive)
	{
		var selectable = this.element
			.find('.interaction-selectable')
			.not(this.element.find('.interaction-selectable .interaction-selectable'))
			.filter(function(){
				var sel = $(this).data('interaction-selectable');
				return sel ? sel.setting.nested : false;
			});
		
		if(!recursive)
			return selectable;
		
		var res = [];
		selectable.each(function(){
			res.push(this);
			$(this).data('interaction-selectable').getNested(true).each(function(){
				res.push(this)
			});
		});
		
		return $(res);
	},
	
	getSelected: function()
	{
		var anchor = this.element.chain('anchor')
		var selected = this.selected.filter(function(){
			return ($(this).parent()[0] == anchor[0]);
		});
		this.getNested().each(function(){
			var selectable = $(this).data('interaction-selectable');
			selected = selected.add(selectable.getSelected());
		});
		
		return selected;
	},
	
	select: function()
	{
		var args = Array.prototype.slice.call(arguments);
		var self = this;
		
		var selected = this.selected;
		
		this.getAncestor().data('interaction-selectable').clear();
		
		$.each(args, function(){
			if(this && typeof this != 'boolean')
				selected = selected.add(self.element.items(this));
		});
		
		if(!this.setting.multiple)
			selected = selected.eq(selected.length - 1);
		
		selected.addClass(this.setting.selectClass);
		
		this.selected = selected;
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
		
		this.getNested().each(function(){
			$(this).data('interaction-selectable').clear();
		});
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
			return this.getSelected();
		else if(arguments.length && typeof item != 'boolean' && item !== null)
			return this.selected.index(this.element.items(item)) > -1;
		else
			return this.getSelected().filter(':visible');
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