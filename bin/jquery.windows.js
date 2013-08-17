/*!
 * windows: a handy, loosely-coupled jQuery plugin for full-screen scrolling windows.
 * Version: 0.0.2
 * Current author: erdomke
 * Original author: @nick-jonas
 * Website: http://www.workofjonas.com
 * Licensed under the MIT license
 */

// TODO: Deal with hash changes

;(function ( $, window, document, undefined ) {

    var that = this,
        pluginName = 'windows',
        winIdName = 'win-id',
        options = {},
        $w = $(window),
        s = 0, // scroll amount
        $windows = [],
        $winHash = {};

    /**
     * Constructor
     * @param {jQuery Object} element       main jQuery object
     * @param {Object} customOptions        options to override defaults
     */
    function windows( element, customOptions ) {
      this.element = $(element);
      options = options = $.extend( {}, $.fn[pluginName].defaults, customOptions) ;
      this._defaults = $.fn[pluginName].defaults;
      this._name = pluginName;
      $windows.push(element);
      
      var anchor = this.element.children().first().filter('a');
      if (anchor.length === 1 && anchor.attr('id')) {
        this.element.data(winIdName, anchor.attr('id'));
        anchor.remove();
      } else if (this.element.attr('id')) {
        this.element.data(winIdName, this.element.attr('id'));
      } else {
        this.element.data(winIdName, winIdName + '-' + $windows.length);
      }
      $winHash[this.element.data(winIdName)] = this.element;
    }
  
    // PRIVATE API ----------------------------------------------------------

    /**
     * Get section that would need to move the least to be at its snap position.
     * @return {jQuery el}
     */
    var _getCurrentWindow = function(){
      var minScroll = 99999,
          minElem = $windows[0],
          stats = null,
          scrollAmt = 0;
      $.each($windows, function(i){
        stats = new WinStats($(this), viewport);
        if (stats.isOnScreen()) {
          scrollAmt = Math.abs(stats.snapPosition() - viewport.scrollTop());
          if (scrollAmt < minScroll) {
            minScroll = scrollAmt;
            minElem = $(this);
          }
        }
      });
      
      return $(minElem);
    };

  
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
      this.snapPosition = function() {
        var scrollTo = 0;
        if (window.height() < viewHeight) {
          scrollTo = relTop - (viewHeight - window.height()) / 2;
          if (Math.abs(scrollTo) < 2) scrollTo = 0;
        } else if (relTop > 0) {
          scrollTo = relTop;
        } else if (relBot <= viewHeight) {
          scrollTo = relBot - viewHeight;
        } 
        
        scrollTo += viewport.scrollTop();
        if ((scrollTo + viewHeight) > viewport.docHeight()) scrollTo = viewport.docHeight() - viewHeight;
        if (scrollTo < 0) scrollTo = 0;  
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
      _snapWindow();
    };

    var _onResize = function(){
      _snapWindow();
    };
  
    var _onKeydown = function(e) {
      if (options.enableKeys) {
        var scrollInfo = null;
      
        switch(e.which) {
          case 40:  // down arrow
          case 34:  // page down
            scrollInfo = _nextScroll();
            break;
          case 38:  // up arrow
          case 33:  // page up
            scrollInfo = _prevScroll();
            break;
          case 32:  // space bar
            if (e.altKey === true || e.controlKey === true) return;
            if (e.shiftKey === true) {
              scrollInfo = _prevScroll();
            } else {
              scrollInfo = _nextScroll();
            }
            break;
        }
        
        if (scrollInfo !== null) {
          viewport.scrollToPosition(scrollInfo.pos, scrollInfo.win);
          e.preventDefault();
        }
      }
    };
  
    var _prevScroll = function() {
      var stats = new WinStats(_getCurrentWindow(), viewport);
      var result = { pos: stats.prevInternalFrame(), win: stats.window() }
      
      if (result.pos === null) {
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
          stats = new WinStats($(maxElem), viewport);
          result.pos = stats.snapPosition();
          result.win = stats.window();
        }
      }
      return result;
    }
  
    var _nextScroll = function() {
      var stats = new WinStats(_getCurrentWindow(), viewport);
      var result = { pos: stats.nextInternalFrame(), win: stats.window() }
      
      if (result.pos === null) {
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
          stats = new WinStats($(minElem), viewport);
          result.pos = stats.snapPosition();
          result.win = stats.window();
        }
      }
      return result;
    }
    
    var _getView = function (win, scrollTop) {
      var excess = win.height() - viewport.height();
      if (excess > 0) {
        var stats = new WinStats(win, viewport);
        var perc = Math.round((scrollTop - win.offset().top) * 100 / excess);
        return win.data(winIdName) + (perc > 0 ? '%' + perc : '');
      } else {
        return win.data(winIdName)
      }
    }
    var _setView = function (view) {
      var parts = view.split('%');
      var win = $winHash[parts[0]];
      var scrollTo = win.offset().top;
      var excess = win.height() - viewport.height();
      if (parts.length > 1 && excess > 0) {
        scrollTo += parseInt(parts[1]) * excess / 100;
      }
      viewport.scrollToPosition(scrollTo, win);
    }
    
    var viewport = new (function (view) {
      var isAnimating = false;
      var newScrollTop;
      var lastWin = null;
      var self = this;
      var timeout = null;
      
      this.docHeight = function () {
        return $(document).height();
      }
      this.height = function () {
        return view.height();
      }
      this.lastWindow = function () {
        return lastWin;
      }
      this.scrollTop = function () {
        return (isAnimating ? newScrollTop : view.scrollTop());
      }
      this.scrollToPosition = function(scrollTo, win) {
        if (scrollTo === null || (!isAnimating && view.scrollTop() === scrollTo)) return;
        
        if (!isAnimating || scrollTo !== newScrollTop) {
          if (timeout) clearTimeout(timeout);
          // Keep trying recursively until it works.  (Normally only one extra time should suffice)
          isAnimating = true;
          newScrollTop = scrollTo;
          lastWin= win;
                    
          var completeCalled = !_onViewChangeStart(win, newScrollTop, true);
          $('html:not(:animated),body:not(:animated)').stop(true).animate({scrollTop: newScrollTop }, options.scrollSpeed, options.easing, function () { 
            isAnimating = false;
            if (!completeCalled) {
              completeCalled = true;
              options.onViewChangeEnd(win, _getView(win, newScrollTop));
            }
          });
        }
      }
      this.scrollToPositionDelay = function (scrollTo, win) {
        if (scrollTo === null || scrollTo === self.scrollTop()) return;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(function() {
          self.scrollToPosition(scrollTo, win);
        }, options.scrollDelay);
      }
    })($w);
  
    var _snapWindow = function(){
      // check for when user has stopped scrolling, & do stuff
      if(options.snapping){
        var stats = new WinStats(_getCurrentWindow(), viewport); 
        var win = stats.window();
        var scrollTo = stats.snapPosition();
        if (scrollTo === viewport.scrollTop()) {
          if(_onViewChangeStart(win, scrollTo, true)) options.onViewChangeEnd(win, _getView(win, scrollTo));
        } else {
          viewport.scrollToPositionDelay(scrollTo, win);
        }
      }
    };
  
    var _onViewChangeStart = function (win, scrollTo) {
      var view = _getView(win, scrollTo);
      if (view === _onViewChangeStart.lastView) {
        return false;
      } else {
        _onViewChangeStart.lastView = view;
        options.onViewChangeStart(win, view);
        return true;
      }
    }
    


    /**
     * A really lightweight plugin wrapper around the constructor,
        preventing against multiple instantiations
     * @param  {Object} options
     * @return {jQuery Object}
     */
    $.fn[pluginName] = function ( options, arg ) {
      if ('string' === typeof options) {
        var result = [];
        switch (options) {
          case 'getCurrentWindow':
            return _getCurrentWindow();
          case 'getId':
            this.each(function(i) {
              result.push($(this).data(winIdName));
            });
            break;
          case 'getView':
            return _getView(_getCurrentWindow(), viewport.scrollTop());
          case 'setView':
            _setView(arg);
            return this;
          case 'isOnScreen':
            this.each(function(i) {
              result.push(new WinStats($(this), viewport).isOnScreen());
            });
            break;
          case 'nextView':
            var scrollInfo = _nextScroll();
            viewport.scrollToPosition(scrollInfo.pos, scrollInfo.win);
            return this;
          case 'prevView':
            var scrollInfo = _prevScroll();
            viewport.scrollToPosition(scrollInfo.pos, scrollInfo.win);
            return this;
          case 'snapPosition':
            this.each(function(i) {
              result.push(new WinStats($(this), viewport).snapPosition());
            });
            break;
        }
        
        switch (result.length) {
          case 0:
            return null;
          case 1:
            return result[0];
          default:
            return result;
        }
      }
      
      return this.each(function(i) {
        if (!$.data(this, 'plugin_' + pluginName)) {
          $.data(this, 'plugin_' + pluginName,
          new windows( this, options ));
        }
      });
    };
  
    $.fn[pluginName].defaults = defaults = {
      snapping: true,
      scrollSpeed: 500,
      scrollDelay: 1100,
      enableKeys: true,
      easing: 'swing',
      onViewChangeStart: function () {},
      onViewChangeEnd: function () {}
    }
    
    $w.scroll(_onScroll);
    $w.resize(_onResize);
    $w.keydown(_onKeydown);

})( jQuery, window, document );