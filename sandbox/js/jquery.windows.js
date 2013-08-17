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
        opts = {},
        $windows = [],
        $scrollFix = null,
        baseOffset = 0;
  
    /**
     * A really lightweight plugin wrapper around the constructor,
        preventing against multiple instantiations
     * @param  {Object} options
     * @return {jQuery Object}
     */
    $.fn[pluginName] = function ( options, arg ) {
      if ('string' === typeof options) {
        
      }
      
      opts = $.extend( {}, $.fn[pluginName].defaults, options) ;
      var result = this.each(function(i) {
        $windows.push($(this));
      });
      
      $windows.sort(function (a, b) {
        return a.offset().top - b.offset().top;
      });
      var baseIndex = opts.zIndex;
      for (var i = 0; i < $windows.length; i++) {
        $windows[i].css('z-index', baseIndex--);
      }
      $scrollFix = $('<div style="position:relative;z-index:-1"></div>').appendTo('body');
      
      return result;
    };
  
    $.fn[pluginName].defaults = {
      snapping: true,
      scrollSpeed: 500,
      scrollDelay: 1100,
      enableKeys: true,
      easing: 'swing',
      transition: 'curtain',
      zIndex: 1000,
      onViewChangeStart: function () {},
      onViewChangeEnd: function () {}
    }
  
    function screenOffset(win, view) {
      return (win.height() < view.height() ? (view.height() - win.height()) / 2 : 0);
    }
  
    function getScrollTarget(scrollTop, callback) {
      var start = 0,
          end = baseOffset,
          i = 0
          isPercent = false,
          viewHeight = $w.height(),
          posPercent = 0,
          result = null,
          relPos = -1;
      
      while (i < $windows.length) {
        start = end;
        isPercent = !isPercent && $windows[i].height() > viewHeight;
        end += isPercent ? 
                  $windows[i].height() - viewHeight :
                  ($windows[i].height() > viewHeight ? 
                    viewHeight : 
                    $windows[i].height() + screenOffset($windows[i], $w) - (i+1 < $windows.length ? screenOffset($windows[i+1], $w) : 0)) ;
        posPercent = (scrollTop - start) / (end - start);
        if (posPercent >= 0 && posPercent < 1) {
          result = isPercent ?
                      { win : $windows[i], snap : scrollTop, percent : posPercent, pos : i } : 
                      (posPercent >= 0.5 ?
                        { win : $windows[i+1], snap : end, percent : 0, pos : i+1 } :
                        { win : $windows[i], snap : start, percent : 0, pos : i });
        }
        if (!isPercent) {
          if (result) relPos++;
          if (callback) callback.call($windows[i], $windows[i], relPos, i);
          i++;
        }
      }
      return result;
    }
  
    function offsetView(info, scrollTop, offset) {
      var dist = info.win.height() - view.height();
      var start = scrollTop - info.percent * dist;
      var percent = Math.min(Math.max((scrollTop + offset - start) / dist, 0), 1);
      return percent * dist + start;
    }
  
    function goToNextView() {
      var other;
      var result = getScrollTarget(view.scrollTop(), function(win, rel, i) {
        if (rel === 1) other = win;
      });
      if (result.win.height() > view.height() && result.percent < 1) {
        offsetView
      }
      console.log(result);
      //view.scrollToPosition(result.snap, result.win);
      return true;
    }
    function goToPrevView() {
      var result = getScrollTarget(view.scrollTop());
      console.log(result);
      //view.scrollToPosition(result.snap, result.win);
      return true;
    }
  
    function performAnim() {
      var fixedHeight = 0;
      var result = getScrollTarget($w.scrollTop(), function(win, rel, i) {
        if (rel === 1 || i === $windows.length - 1) {
          fixedHeight += win.css({'position' : 'fixed', 'top' : screenOffset(win, $w) }).height();
        } else {
          win.css({'position' : 'relative', 'top' : 0 });
        }
      });
      $scrollFix.height(fixedHeight);
      if (result.snap !== view.scrollTop()) {
        view.scrollToPositionDelay(result.snap, result.win);
      }
    }
    
    var _onScroll = function(){
      performAnim();
    };

    var _onResize = function(){
      performAnim();
    };
  
    var _onKeydown = function(e) {
      if (opts.enableKeys) {
        var change = false;
      
        switch(e.which) {
          case 40:  // down arrow
          case 34:  // page down
            change = goToNextView();
            break;
          case 38:  // up arrow
          case 33:  // page up
            change = goToPrevView();
            break;
          case 32:  // space bar
            if (e.altKey === true || e.controlKey === true) return;
            if (e.shiftKey === true) {
              change = goToPrevView();
            } else {
              change = goToNextView();
            }
            break;
        }
        
        if (change) e.preventDefault();
      }
    };
  
    var $w = $(window);
    var view = new (function (view) {
      var isAnimating = false;
      var newScrollTop;
      var lastWin = null;
      var self = this;
      var timeout = null;
      
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
                    
          //var completeCalled = !_onViewChangeStart(win, newScrollTop, true);
          $('html:not(:animated),body:not(:animated)').stop(true).animate({scrollTop: newScrollTop }, opts.scrollSpeed, opts.easing, function () { 
            isAnimating = false;
            /*if (!completeCalled) {
              completeCalled = true;
              options.onViewChangeEnd(win, _getView(win, newScrollTop));
            }*/
          });
        }
      }
      this.scrollToPositionDelay = function (scrollTo, win) {
        if (scrollTo === null || scrollTo === self.scrollTop() || isAnimating) return;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(function() {
          self.scrollToPosition(scrollTo, win);
        }, opts.scrollDelay);
      }
      
      view.scroll(_onScroll);
      view.resize(_onResize);
      view.keydown(_onKeydown);
    })($w);

})( jQuery, window, document );