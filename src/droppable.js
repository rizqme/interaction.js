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
		nested: false
	},
	
	init: function(setting)
	{
		this.base();
		this.setting = $.extend(this.setting, setting);
		this.draggable = null
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
		
		var parent = this.element.parents('.interaction-droppable');
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
		if(!this.isEnabled) return;
		
		this.updateParent();
		
		this.draggable = ddmanager.draggable;
		
		if(this.draggable.element != this.element && this.setting.accept(this.draggable.element, this.draggable.item))
		{
			this.isActive = true;
			this.dragActive();
		}
		
		$.each(this.droppables, function(){
			this.mouseStart();
		});
	},
	
	mouseDrag: function()
	{
		var intersect = false;
		
		if(this.isEnabled && this.isActive)
		{
			intersect = this.intersect(this.draggable);
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
		}
		
		$.each(this.droppables, function(){
			if(!this.setting.nested || (this.setting.nested && intersect))
				this.mouseDrag();
		});
	},
	
	mouseStop: function()
	{
		var intersect = this.intersect(this.draggable);
		if(this.isActive && intersect && !this.childOver)
			this.dragDrop();
		
		this.dragDeactive();
		
		this.draggable = null;
		this.isActive = false;
		this.isOver = false;
		this.childOver = false;
		
		$.each(this.droppables, function(){
			this.mouseStop();
		});
	},
	
	dragActive: function()
	{
		this.callListener('active', this.draggable.item);
	},
	
	dragDeactive: function()
	{
		this.callListener('deactive', this.draggable.item);
	},
	
	dragOver: function()
	{
		this.callListener('over', this.draggable.item);
	},
	
	dragOut: function()
	{
		this.callListener('out', this.draggable.item);
	},
	
	dragDrop: function()
	{
		this.callListener('drop', this.draggable.item);
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
			this.container.removeClass(this.setting.classPrefix+this.lastDragStatus);
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