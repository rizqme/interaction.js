(function($){

$.Interaction.ddmanager = ddmanager =
{
	droppables: [],
	draggable: null,
	status: '',
	
	getAllDroppables: function()
	{
		return $('.interaction-droppable').map(function(){return this.data('interaction-droppable')}).get();
	}
};

$.Interaction.add('droppable', {
	defaults:
	{
		accept: function(){return true;},
		classPrefix: 'drop-',
		activeClass: 'active',
		hoverClass: 'hover',
		dynamic: true,
		nested: false
	},
	
	init: function(setting)
	{
		this.base();
		this.setting = $.extend(this.setting, setting);
		this.droppables = [];
		this.isOver = false;
		this.childOver = false;
		
		if(typeof this.setting.accept == 'string')
		{
			var className = this.setting.accept;
			this.setting.accept = function(element){return element.hasClass(className)};
		}
		
		this.extractListener('over', 'out', 'active', 'deactive', 'drop');
		this.updateParent();
		this.refreshOffset();
		this.callListener('init');
	},
	
	refreshOffset: function()
	{
		var element = this.element.get(0);
		var offset = this.element.offset();
		
		this.offset =
		{
			width: element.offsetWidth,
			height: element.offsetHeight,
			top: offset.top,
			left: offset.left
		};
	},
	
	intersect: function(draggable)
	{
		if(this.setting.dynamic)
			this.refreshOffset();
		
		return draggable.position.x >= this.offset.left
			&& draggable.position.y >= this.offset.top
			&& draggable.position.x <= this.offset.left + this.offset.width
			&& draggable.position.y <= this.offset.top + this.offset.height;
	},
	
	updateParent: function()
	{
		var oldparent = this.parent || ddmanager;
		
		var parent = this.element.parents('.interaction-droppable').eq(0);
		this.parent = parent.length ? parent.data('interaction-droppable') : false;
		
		if(this.parent != oldparent)
		{
			var droppables = [];
			for(var i=0; i<oldparent.droppables.length; i++)
				if(oldparent.droppables[i] != this)
					droppables.push(oldparent.droppables[i]);
			
			oldparent.droppables = droppables;
			
			(this.parent || ddmanager).droppables.push(this);
		}
	},
	
	setStatus: function(stat)
	{
		ddmanager.status = stat;
	},
	
	mouseStart: function()
	{
		$.each(this.droppables, function(){
			this.mouseStart();
		});
		
		if(!this.isEnabled) return;
		
		this.updateParent();
		
		if(this.setting.accept(ddmanager.draggable.element, ddmanager.draggable.item))
		{
			this.isActive = true;
			this.dragActive();
		}
	},
	
	mouseDrag: function()
	{
		$.each(this.droppables, function(){
			if(!this.setting.nested)
				this.mouseDrag();
		});
		
		var intersect = false;
		
		if(this.isEnabled && this.isActive)
		{
			intersect = this.intersect(ddmanager.draggable);
			
			if(intersect)
				$.each(this.droppables, function(){
					if(this.setting.nested)
						this.mouseDrag();
				});
			
			if((!intersect || (intersect && this.childOver)) && this.isOver)
			{
				this.dragOut();
				this.isOver = false;
				if(this.parent && this.setting.nested && !this.childOver)
					this.parent.childOver = false;
			}
			else if(!this.isOver && intersect && !this.childOver)
			{
				this.dragOver();
				this.isOver = true;
				if(this.parent && this.setting.nested)
					this.parent.childOver = true;
			}
			else if(this.childOver && this.parent && this.setting.nested)
				this.parent.childOver = true;
		}
		
	},
	
	mouseStop: function()
	{
		$.each(this.droppables, function(){
			this.mouseStop();
		});
		
		var intersect = this.intersect(ddmanager.draggable);
		if(this.isActive && intersect && !this.childOver)
			this.dragDrop();
		
		this.dragDeactive();
		
		this.isActive = false;
		this.isOver = false;
		this.childOver = false;
	},
	
	dragActive: function()
	{
		this.callListener('active', ddmanager.draggable.item);
	},
	
	dragDeactive: function()
	{
		
		this.callListener('deactive', ddmanager.draggable.item);
	},
	
	dragOver: function()
	{
		this.callListener('over', ddmanager.draggable.item);
	},
	
	dragOut: function()
	{
		this.callListener('out', ddmanager.draggable.item);
	},
	
	dragDrop: function()
	{
		this.callListener('drop', ddmanager.draggable.item);
	},
	
	$destroy: function()
	{
		if(!this.dummy)
		{
			var droppables = [];
			var parent = this.parent || ddmanager;
			for(var i=0; i<parent.droppables.length; i++)
				if(parent.droppables[i] != this)
					droppables.push(parent.droppables[i]);
			
			parent.droppables = droppables;
			this.destroy();
		}
		
		return this.element;
	}
});

// Track Draggable
$.Interaction.listen('draggable', {
	start: function()
	{
		ddmanager.draggable = this;
		$.each(ddmanager.droppables, function(){
			this.mouseStart();
		})
	},
	
	drag: function()
	{
		if(ddmanager.status != this.lastDragStatus)
		{
			if(this.lastDragStatus)
				this.container.removeClass(this.setting.classPrefix+this.lastDragStatus);
			if(ddmanager.status)
				this.container.addClass(this.setting.classPrefix+ddmanager.status);
			this.lastDragStatus = ddmanager.status;
		}
		
		$.each(ddmanager.droppables, function(){
			this.mouseDrag();
		})
	},
	
	stop: function()
	{
		$.each(ddmanager.droppables, function()
		{
			this.mouseStop();
		});
		
		ddmanager.draggable = null;
		ddmanager.status = '';
	}
});

// Class Tracker
$.Interaction.listen('droppable', {
	active: function()
	{
		this.element.addClass(this.setting.classPrefix+this.setting.activeClass);
	},
	
	deactive: function()
	{
		this.element.removeClass(this.setting.classPrefix+this.setting.activeClass);
		this.element.removeClass(this.setting.classPrefix+this.setting.hoverClass);
	},
	
	over: function()
	{
		this.element.addClass(this.setting.classPrefix+this.setting.hoverClass);
	},
	
	out: function()
	{
		this.element.removeClass(this.setting.classPrefix+this.setting.hoverClass);
	}
});

})(jQuery);