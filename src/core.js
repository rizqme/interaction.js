(function($){

$.Interaction = 
{
	services: {},
	
	add: function(name, proto)
	{
		var services = $.Interaction.services;
		
		services[name] = $.extend({}, this.base, proto);
		
		$.fn[name] = function(options)
		{
			var service = this.data('interaction-'+name);
		
			if(typeof options != 'string')
			{
				if(service)
					service.$destroy();
			
				this.data('interaction-'+name, $.extend({element:this, name:name}, services[name]));
				service = this.data('interaction-'+name);
				service.init(options);
				
				return this;
			}
		
			else
			{
				var command = options;
				options = Array.prototype.slice.call(arguments, 1);
				
				if(command == '?')
					return !!service;
				else if(service && typeof service['$'+command] == 'function')
					return service['$'+command].apply(service, options);
				else
					return services[name]['$'+command].apply({isEnabled:false, dummy:true}, options);
			}
		}
	},
	
	extend: function(name, proto)
	{
		if(this.services[name])
			this.services[name] = $.extend(this.services[name], proto);
	},
	
	listeners: {},
	
	listen: function(service, name, fn)
	{
		if(!this.listeners[service])
			this.listeners[service] = {};
		
		var obj = {};
		
		if(typeof name == 'string')
			obj[name] = fn;
		else if(typeof name == 'object')
			obj = name;
		
		for(var n in obj)
		{
			if(!this.listeners[service][n])
				this.listeners[service][n] = [];
			
			this.listeners[service][n].push(obj[n]);
		}
	},
	
	defaults: function(service, defaults)
	{
		if(this.services[service])
			$.extend(this.services[service].defaults, defaults);
	}
};

$.Interaction.base =
{
	init: function()
	{
		this.base();
	},

	base: function()
	{
		this.setting = $.extend({}, (typeof this.defaults == 'function') ? this.defaults() : this.defaults || {});
		this.functionWrappers = [];
		this.temp = {};
		this.isEnabled = true;
		
		this.listeners = {};
		var listeners = $.Interaction.listeners[this.name] || {};
		for(var i in listeners)
			this.listeners[i] = [].concat(listeners[i]);
	
		this.element.addClass('interaction-'+this.name);
		var self = this;
		this.element.chain('plugin', this.name, function(){
			self.builder($(this));
		});
	},

	wrap: function(fn)
	{
		var self = this;
		var args = Array.prototype.slice.call(arguments, 1);
		var array = this.functionWrappers;
		var wrap;
	
		if(typeof fn == 'string')
			fn = self[fn];
	
		for(var i=0; i<array.length; i++)
		{	
			if(array[i].src == fn)
			{
				wrap = array[i];
				break;
			}
		}
	
		if(!wrap)
		{
			wrap = {src:fn, fn:function(){
				return fn.apply(self, Array.prototype.slice.call(arguments).concat(args));
			}};
			array.push(wrap);
		}
	
		return wrap.fn;
	},

	builder: function(item)
	{
	
	},
	
	addListener: function(name, fn)
	{
		if(!this.listeners[name])
			this.listeners[name] = [];
		
		this.listeners[name].push(fn);
	},
	
	removeListener: function(name, fn)
	{
		if(!this.listeners[name])
			this.listeners[name] = [];
		
		if(fn)
		{
			var res = [];
			for(var i=0; i<this.listeners[name].length; i++)
				if(this.listeners[name][i] != fn)
					res.push(this.listeners[name][i]);
			this.listeners[name] = res;
		}
		else
		{
			this.listeners[name] = [];
		}
	},
	
	extractListener: function()
	{
		for(var i=0; i<arguments.length; i++)
		{
			if(this.setting[arguments[i]])
				this.addListener('$'+arguments[i], this.setting[arguments[i]]);
		}
	},
	
	callListener: function(name)
	{
		if(!this.listeners[name])
			this.listeners[name] = [];
			
		if(!this.listeners['$'+name])
			this.listeners['$'+name] = [];
		
		var args = Array.prototype.slice.call(arguments, 1);
		
		for(var i=0; i<this.listeners[name].length; i++)
			this.listeners[name][i].apply(this, args);
			
		for(var i=0; i<this.listeners['$'+name].length; i++)
			this.listeners['$'+name][i].apply(this.element, [this].concat(args));
	},

	destroy: function()
	{
		this.element.unbind('.'+this.name);
		this.element.removeData('interaction-'+this.name);
		this.element.removeClass('interaction-'+this.name);
	
		this.element.chain('plugin', this.name, null);
	
		this.element.getItemEl().each(function(){
			$(this).unbind('.'+this.name+'-item');
		});
		
		this.callListener('destroy');
	},
	
	$listen: function(name, fn)
	{
		if(this.dummy) return this.element;
		
		var obj = {};
		
		if(typeof name == 'string')
			obj[name] = fn;
		else if(typeof name == 'object')
			obj = name;
		
		for(var n in obj)
			this.addListener('$'+n, obj[n]);
		
		return this.element;
	},
	
	$unlisten: function(name, fn)
	{
		if(this.dummy) return this.element;
		
		this.removeListener('$'+name, fn);
		
		return this.element;
	},
	
	$service: function()
	{
		return this.dummy ? null : this;
	},

	$destroy: function()
	{
		if(!this.dummy)
			this.destroy();
		
		return this.element;
	},
	
	
	$enable: function()
	{
		if(this.dummy) return this.element;
		
		this.isEnabled = true;
		this.callListener('enable');
		
		return this.element;
	},
	
	$disable: function()
	{
		if(this.dummy) return this.element;
		
		if(this.mouseUp)
			this.mouseUp(this.mouseDownEvent);
		this.isEnabled = false;
		this.callListener('disable');
		
		return this.element;
	}
};

// Adaptation of ui.mouse (c) Paul Bakaus
$.Interaction.mouse =
{
	mouseDown: function(event)
	{
		var self = this;
		if(this.isMouseStarted)
			this.mouseUp(event);
	
		this.mouseDownEvent = event;
		
		var cancel = (typeof this.setting.cancel == 'string'
			&& $(event.target).parents().add(event.target).filter(this.setting.cancel).length);
	
		if(event.which != 1 || this.mouseCapture(event) || cancel)
			return false;
	
		this.isMouseDelayMet = false;
		setTimeout(function(){self.isMouseDelayMet = true;}, this.setting.delay);
	
		if(event.preventDefault)
			event.preventDefault();
		else if($.browser.msie)
			document.onselectstart = function(){return false};
	
		$(document)
			.bind('mousemove.'+this.name, this.wrap('mouseMove'))
			.bind('mouseup.'+this.name, this.wrap('mouseUp'));
	
		return true;
	},

	mouseMove: function(event)
	{
		// IE mouseup check - mouseup happened when mouse was out of window
		if ($.browser.msie && !event.button)
		{
			this.mouseUp(event);
			return false;
		}
		
		this.mouseMoveEvent = event;
	
		if(this.isMouseStarted)
		{
			this.mouseDrag(event);
		}
		else if(this.mouseDistanceMet(event) && this.mouseDelayMet(event))
		{
			this.isMouseStarted = this.mouseStart(event);
			if(this.isMouseStarted)
				this.mouseDrag(event);
			else
				this.mouseUp(event);
		}
	
		return this.isMouseStarted;
	},

	mouseUp: function(event)
	{
		$(document)
			.unbind('mousemove.'+this.name, this.wrap('mouseMove'))
			.unbind('mouseup.'+this.name, this.wrap('mouseUp'));
	
		document.onselectstart = function(){return true;};
	
		if(this.isMouseStarted)
		{
			this.isMouseStarted = false;
			this.mouseStop(event);
		}
	},

	mouseDistanceMet: function(e) {
		return (Math.max(
				Math.abs(this.mouseDownEvent.pageX - e.pageX),
				Math.abs(this.mouseDownEvent.pageY - e.pageY)
			) >= this.setting.distance
		);
	},

	mouseDelayMet: function(e) {
		return this.isMouseDelayMet;
	},

	// These are placeholder methods, to be overriden by extending plugin
	mouseStart: function() {return false;},
	mouseDrag: function() {return false;},
	mouseStop: function() {return false;},
	mouseCapture: function() {return false;}
};

})(jQuery);