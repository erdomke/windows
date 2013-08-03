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
    $.fn.ratioVisible = function() {
      return new WinStats(this, $w).ratioVisible();
    };

    /**
     * Is section currently on screen?
     * @return {Boolean}
     */
    $.fn.isOnScreen = function(){
      return new WinStats(this, $w).isOnScreen();
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

    function WinStats(window, viewport) {
      var relTop = Math.round(window.offset().top - viewport.scrollTop());
      var relBot = Math.round(relTop + window.height());
      var viewHeight = Math.round(viewport.height());
      var winHeight = Math.round(window.height());
      var self = this;
      
      this.isOnScreen = function() {
        return (window.is(":visible") && relTop < viewHeight && relBot > 0) ? true : false;
      }
      this.prevInternalFrame = function() {
        var scrollTo = null;
        if (winHeight > viewHeight && relTop < 0) {
          if (relTop < -1 * viewHeight) {
            scrollTo = -1 * viewHeight;
          } else {
            scrollTo = relTop;
          }
          scrollTo += viewport.scrollTop();
        }
        return scrollTo;
      }
      this.nextInternalFrame = function() {
        var scrollTo = null;
        if (winHeight > viewHeight && relBot > viewHeight) {
          if (relBot > 2 * viewHeight) {
            scrollTo = viewHeight;
          } else {
            scrollTo = relBot - viewHeight;
          }
          scrollTo += viewport.scrollTop();
        }
        return scrollTo;
      }
      this.ratioVisible = function() {
        if(!self.isOnScreen()) return 0;
        
        // If the entire element is on the screen return 1 (yes, I know it is not really one)
        if (relTop >= 0 && relBot <= viewHeight) return 1;
        
        // Calculate the real ratio
        var dispHeight = (relTop >= 0) ? viewHeight - relTop : viewHeight;
        if (relBot < viewHeight) dispHeight -= viewHeight - relBot;
        return dispHeight / viewHeight;
      }
      this.snapPosition = function() {
        var scrollTo = null;
        if (window.height() < viewHeight) {
          scrollTo = relTop - (viewHeight - window.height()) / 2;
          if (Math.abs(scrollTo) < 2) scrollTo = null;
        } else if (relTop > 0) {
          scrollTo = relTop;
        } else if (relBot <= viewHeight) {
          scrollTo = relBot - viewHeight;
        } 
        if (scrollTo !== null) scrollTo += viewport.scrollTop();
        return scrollTo;
      }
      this.window = function() {
        return window;
      }
    }
  
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
      var scrollTo = null;
      
      switch(e.which) {
        case 34:  // page down
          scrollTo = _nextScroll();
          console.log('Down ' + scrollTo);
          break;
        case 33:  // page up
          scrollTo = _prevScroll();
          console.log('Up ' + scrollTo);
          break;
        case 32:  // space bar
          if (e.shiftKey === true) {
            scrollTo = _prevScroll();
          } else {
            scrollTo = _nextScroll();
          }
          break;
      }
      
      if (scrollTo !== null) {
        // Keep trying recursively until it works.  (Normally only one extra time should suffice)
        var animationComplete = false;
        var attempts = 0;
        
        function TryAnimation() {
          if (!animationComplete && attempts < 10) {
            attempts++;
            $('html:not(:animated),body:not(:animated)').stop(true).animate({scrollTop: scrollTo }, options.snapSpeed, function () { animationComplete = true; });
            setTimeout(TryAnimation, options.snapSpeed+10);
          }
        }
        TryAnimation();

        e.preventDefault();
      }
    };
  
    var _prevScroll = function() {
      var stats = new WinStats(_getCurrentWindow(), $w);
      var scrollTo = stats.prevInternalFrame();
      
      if (scrollTo === null) {
        var maxOffset = -1;
        var maxElem = null;
        var currOffset = stats.window().offset().top;
        var testOffset;
        $.each($windows, function(i){
          testOffset = $(this).offset().top;
          if (testOffset < currOffset && testOffset > maxOffset && $(this).is(':visible')) {
            maxOffset = testOffset;
            maxElem = $(this);
          }
        });
        
        if (maxElem) {
          stats = new WinStats($(maxElem), $w);
          scrollTo = stats.snapPosition();
        }
      }
      return scrollTo;
    }
  
    var _nextScroll = function() {
      var stats = new WinStats(_getCurrentWindow(), $w);
      var scrollTo = stats.nextInternalFrame();
      
      if (scrollTo === null) {
        var minOffset = 999999;
        var minElem = null;
        var currOffset = _getCurrentWindow().offset().top;
        var testOffset;
        $.each($windows, function(i){
          testOffset = $(this).offset().top;
          if (testOffset > currOffset && testOffset < minOffset && $(this).is(':visible')) {
            minOffset = testOffset;
            minElem = $(this);
          }
        });
        
        if (minElem) {
          stats = new WinStats($(minElem), $w);
          scrollTo = stats.snapPosition();
        }
      }
      return scrollTo;
    }

    var _snapWindow = function(){
      // clear timeout if exists
      if(t){clearTimeout(t);}
      // check for when user has stopped scrolling, & do stuff
      if(options.snapping){
        var stats = new WinStats(_getCurrentWindow(), $w); 
        var scrollTo = stats.snapPosition();
        if (scrollTo === null) return;
            
        t = setTimeout(function(){
          var completeCalled = false;
          // animate to top of visible window
          $('html:not(:animated),body:not(:animated)').animate({scrollTop: scrollTo }, options.snapSpeed, function(){
            if(!completeCalled){
              if(t){clearTimeout(t);}
              t = null;
              completeCalled = true;
              options.onSnapComplete(stats.window());
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