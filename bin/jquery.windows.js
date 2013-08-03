/*!
 * windows: a handy, loosely-coupled jQuery plugin for full-screen scrolling windows.
 * Version: 0.0.2
 * Current author: erdomke
 * Original author: @nick-jonas
 * Website: http://www.workofjonas.com
 * Licensed under the MIT license
 */

;(function ( $, window, document, undefined ) {


var that = this,
        pluginName = 'windows',
        defaults = {
            snapping: true,
            snapSpeed: 500,
            snapInterval: 1100,
            onScroll: function(){},
            onSnapComplete: function(){},
            onWindowEnter: function(){}
        },
        options = {},
        $w = $(window),
        s = 0, // scroll amount
        t = null, // timeout
        $windows = [];

    /**
     * Constructor
     * @param {jQuery Object} element       main jQuery object
     * @param {Object} customOptions        options to override defaults
     */
    function windows( element, customOptions ) {

        this.element = element;
        options = options = $.extend( {}, defaults, customOptions) ;
        this._defaults = defaults;
        this._name = pluginName;
        $windows.push(element);
        var isOnScreen = $(element).isOnScreen();
        $(element).data('onScreen', isOnScreen);
        if(isOnScreen) options.onWindowEnter($(element));

    }

    /**
     * Get ratio of element's visibility on screen
     * @return {Number} ratio 0-1
     */
    $.fn.ratioVisible = function(){
        if(!this.isOnScreen()) return 0;
        var curTop = this.offset().top - $w.scrollTop();
        var curBot = curTop + this.height();
        var screenHeight = $w.height();
        
        // If the entire element is on the screen return 1 (yes, I know it is not really one)
        if (curTop >= 0 && curBot < screenHeight) return 1;
      
        // Calculate the real ratio
        var dispHeight = (curTop >= 0) ? screenHeight - curTop : screenHeight;
        if (curBot < screenHeight) dispHeight -= screenHeight - curBot;
        return dispHeight / screenHeight;
    };

    /**
     * Is section currently on screen?
     * @return {Boolean}
     */
    $.fn.isOnScreen = function(){
        if (!this.is(":visible")) return false;
        var screenHeight = $w.height(),
            curTop = this.offset().top - $w.scrollTop(),
            curBot = curTop + this.height();
        return (curTop < screenHeight && curBot >= 0) ? true : false;
    };

    /**
     * Get section that is mostly visible on screen
     * @return {jQuery el}
     */
    var _getCurrentWindow = $.fn.getCurrentWindow = function(){
        var maxPerc = 0,
            maxElem = $windows[0];
        $.each($windows, function(i){
            var perc = $(this).ratioVisible();
            if(Math.abs(perc) > Math.abs(maxPerc)){
                maxElem = $(this);
                maxPerc = perc;
            }
        });
        return $(maxElem);
    };


    // PRIVATE API ----------------------------------------------------------

    /**
     * Window scroll event handler
     * @return null
     */
    var _onScroll = function(){
        s = $w.scrollTop();

        _snapWindow();

        options.onScroll(s);

        // notify on new window entering
        $.each($windows, function(i){
            var $this = $(this),
                isOnScreen = $this.isOnScreen();
            if(isOnScreen){
                if(!$this.data('onScreen')) options.onWindowEnter($this);
            }
            $this.data('onScreen', isOnScreen);
        });
    };

    var _onResize = function(){
        _snapWindow();
    };
  
    var _onKeydown = function(e) {
      var win;
      
      switch(e.which) {
        case 34:  // page down
          win = _nextWindow();
          break;
        case 33:  // page up
          win = _prevWindow();
          break;
        case 32:  // space bar
          if (e.shiftKey === true) {
            win = _prevWindow();
          } else {
            win = _nextWindow();
          }
          break;
      }
      
      if (win) {
        $('html:not(:animated),body:not(:animated)').animate({scrollTop: win.offset().top }, options.snapSpeed);
        e.preventDefault();
      }
    };
  
    var _prevWindow = function() {
      var maxOffset = -1;
      var maxElem = null;
      var currOffset = _getCurrentWindow().offset().top;
      var testOffset;
      $.each($windows, function(i){
        testOffset = $(this).offset().top;
        if (testOffset < currOffset && testOffset > maxOffset) {
          maxOffset = testOffset;
          maxElem = $(this);
        }
      });
      return (maxElem ? $(maxElem) : null);
    }
  
    var _nextWindow = function() {
      var minOffset = 999999;
      var minElem = null;
      var currOffset = _getCurrentWindow().offset().top;
      var testOffset;
      $.each($windows, function(i){
        testOffset = $(this).offset().top;
        if (testOffset > currOffset && testOffset < minOffset) {
          minOffset = testOffset;
          minElem = $(this);
        }
      });
      return (minElem ? $(minElem) : null);
    }

    var _snapWindow = function(){
        // clear timeout if exists
        if(t){clearTimeout(t);}
        // check for when user has stopped scrolling, & do stuff
        if(options.snapping){
            var $visibleWindow = _getCurrentWindow(), // visible window
                curTop = $visibleWindow.offset().top,
                curBot = curTop + $visibleWindow.height(),
                scrollTo = 0;
            
            if (curTop > $w.scrollTop()) {
              scrollTo = curTop;
            } else if (curBot < ($w.scrollTop() + $w.height())) {
              scrollTo = curBot - $w.height();
            } else {
              return;
            }
                
            t = setTimeout(function(){
                var completeCalled = false;
                // animate to top of visible window
                $('html:not(:animated),body:not(:animated)').animate({scrollTop: scrollTo }, options.snapSpeed, function(){
                    if(!completeCalled){
                        if(t){clearTimeout(t);}
                        t = null;
                        completeCalled = true;
                        options.onSnapComplete($visibleWindow);
                    }
                });
            }, options.snapInterval);
        }
    };


    /**
     * A really lightweight plugin wrapper around the constructor,
        preventing against multiple instantiations
     * @param  {Object} options
     * @return {jQuery Object}
     */
    $.fn[pluginName] = function ( options ) {

        $w.scroll(_onScroll);
        $w.resize(_onResize);
        $w.keydown(_onKeydown);

        return this.each(function(i) {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new windows( this, options ));
            }
        });
    };

})( jQuery, window, document );