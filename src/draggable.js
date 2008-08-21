(function($){
	
$.Interaction.add('draggable', $.extend({}, $.Interaction.mouse, {
	defaults: 
	{
		helper: function(e){return $(e).clone();},
		handle: null,
		classPrefix: 'drag-',
		container: null,
		cancel: ':input',
		cursorAt: null,
		axis: 'xy',
		delay: 0,
		distance: 0
	},
	
	init: function(setting)
	{
		this.base();
		$.extend(this.setting, setting);
		if(!$('#interaction-draggable-container').length)
			$('<div>')
				.attr('id', 'interaction-draggable-container')
				.css('position', 'absolute')
				.hide()
				.appendTo(document.body);
		
		this.container = $(this.setting.container || '#interaction-draggable-container');
		
		this.cursor = null;
		this.position = {x:0, y:0};
		
		this.extractListener('start', 'drag', 'stop');
		
		this.callListener('init');
	},
	
	builder: function(item)
	{
		var self = this;
		
		this.getHandle(item).bind('mousedown.draggable-item', function(event){
			if(self.isEnabled)
			{
				self.item = item;
				self.mouseDown(event);
			}
		});
		
		this.callListener('build', item);
	},
	
	mouseStart: function(event)
	{
		if(!this.item || !this.item.length)
			return this.mouseUp(event);
		
		var offset = this.item.eq(0).offset();
		
		if(!this.cursor)
		{
			this.cursor = {};
			if(this.setting.cursorAt)
			{
				this.cursor.left = this.setting.cursorAt.left;
				this.cursor.top = this.setting.cursorAt.top;
			}
			else
			{
				this.cursor.left = event.pageX - offset.left;
				this.cursor.top = event.pageY - offset.top;
			}
		}
		
		if(this.setting.axis == 'y')
			this.container[0].style.left = offset.left + 'px';
		else if(this.setting.axis == 'x')
			this.container[0].style.top =  offset.top + 'px';
		
		this.mouseDrag(event);
		
		this.container
			.empty()
			.append(this.setting.helper(this.item))
			.show();
		
		this.callListener('start');
		
		return true;
	},
	
	mouseDrag: function(event)
	{
		this.position.x = event.pageX;
		this.position.y = event.pageY;
		
		if(this.setting.axis != 'y')
			this.container[0].style.left = (this.position.x - this.cursor.left) + 'px';
		if(this.setting.axis != 'x')
			this.container[0].style.top =  (this.position.y - this.cursor.top) + 'px';
		
		this.callListener('drag');
		
		return true;
	},
	
	mouseStop: function(event)
	{
		this.container.empty().hide();
		
		this.callListener('stop');
		this.cursor = null;
		
		return true;
	},
	
	getHandle: function(item)
	{
		return this.setting.handle ? item.find(this.setting.handle) : item;
	}
}));

// Cursor Listener
$.Interaction.listen('draggable',{
	start: function()
	{
		if(!this.setting.cursor)
			return;
		var body = $('body');
		this.temp.bodyCursor = body.css('cursor');
		body.css('cursor', this.setting.cursor);
		this.container.css('cursor', this.setting.cursor)
			.children().css('cursor', this.setting.cursor);
	},
	
	stop: function()
	{
		if(!this.setting.cursor)
			return;
		$('body').css('cursor', this.temp.bodyCursor);
	}
});

// Opacity Listener
$.Interaction.listen('draggable', {
	init: function()
	{
		if(this.setting.opacity)
			this.container.css('opacity', this.setting.opacity);
	}
})

// Scroll Defaults
$.Interaction.defaults('draggable', {
	scroll: true,
	scrollArea: 20,
	scrollSpeed: 20
});

// Scroll Listener
$.Interaction.listen('draggable', {
	start: function()
	{
		if(!this.setting.scroll)
			return;
		
		var self = this;
		this.scrollElement = this.element.chain('anchor');
		this.scrollOffset = this.scrollElement.offset();
		$.extend(this.scrollOffset, {
			scrollHeight:0, 
			scrollWidth:0, 
			height:this.scrollElement[0].offsetHeight,
			width:this.scrollElement[0].offsetWidth
		});
	
		this.scrollElement.children().each(function(){
			self.scrollOffset.scrollHeight += this.offsetHeight;
			self.scrollOffset.scrollWidth += this.offsetWidth;
		});
		
		this.temp.scrollInt = setInterval(function(){
			var el = self.scrollElement[0];
			var elOff = self.scrollOffset;
			var s = self.setting;
			var pos = self.position;
			var doc = $(document);
	
			if(elOff.scrollHeight > elOff.height && Math.abs(pos.y - elOff.top) < s.scrollArea)
				el.scrollTop -= s.scrollSpeed;
			if(elOff.scrollHeight > elOff.height && Math.abs(elOff.top + elOff.height - pos.y) < s.scrollArea)
				el.scrollTop += s.scrollSpeed;
	
			if(elOff.scrollWidth > elOff.width && Math.abs(pos.x - elOff.left) < s.scrollArea)
				el.scrollLeft -= s.scrollSpeed;
			if(elOff.scrollWidth > elOff.width && Math.abs(elOff.left + elOff.width - pos.x) < s.scrollArea)
				el.scrollLeft += s.scrollSpeed;
	
			if(pos.y - doc.scrollTop() < s.scrollArea)
				doc.scrollTop(doc.scrollTop() - s.scrollSpeed);
			if(window.innerHeight - (pos.y - doc.scrollTop()) < s.scrollArea)
				doc.scrollTop(doc.scrollTop() + s.scrollSpeed);
				
			if(pos.x - doc.scrollLeft() < s.scrollArea)
				doc.scrollLeft(doc.scrollLeft() - s.scrollSpeed);
			if(window.innerWidth - (pos.x - doc.scrollLeft()) < s.scrollArea)
				doc.scrollLeft(doc.scrollLeft() + s.scrollSpeed);
		}, 200);
	},
	
	stop: function()
	{
		if(!this.setting.scroll)
			return;
		
		clearInterval(this.temp.scrollInt);
	}
});

})(jQuery);