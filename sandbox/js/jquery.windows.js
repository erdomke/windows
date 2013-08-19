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
      var win,
          result = this.each(function(i) {
            win = $(this);
            $windows.push(win);
            win.find(opts.affix).each(function() {
              var $this = $(this);
              $this.data({'affix-top': $this.offset().top - parseFloat($this.css('marginTop').replace(/auto/,0)) - win.offset().top,
                            'orig-top': parseFloat($this.css('top').replace(/auto/,0))});
            });
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
      scrollSpeed: 250,
      scrollDelay: 500,
      enableKeys: true,
      easing: 'swing',
      fade: false,
      curtain: false,
      affix: '.affix',
      zIndex: 1000,
      onViewChangeStart: function () {},
      onViewChangeEnd: function () {}
    }
  
    function screenOffset(win, view) {
      return (win.height() < view.height() ? (view.height() - win.height()) / 2 : 0);
    }
  
    var handlerDefaults = { prevView: null, currView: null, window: null };
    function forEachView(scrollTop, handlers) {
      handlers = $.extend( {}, handlerDefaults, handlers) ;
      var s = {
            start : 0,
            end : baseOffset,
            i : 0,
            isPercent : false,
            viewHeight : $w.height(),
          },
          relPos = -1;
      
      while (s.i < $windows.length) {
        s.start = s.end;
        s.isPercent = !s.isPercent && $windows[s.i].height() > s.viewHeight;
        s.end += Math.round(s.isPercent ? 
                  $windows[s.i].height() - s.viewHeight :
                  ($windows[s.i].height() > s.viewHeight ? 
                    s.viewHeight : 
                    $windows[s.i].height() + screenOffset($windows[s.i], $w) - (s.i+1 < $windows.length ? screenOffset($windows[s.i+1], $w) : 0))) ;
        
        if (scrollTop > s.start && scrollTop <= s.end && handlers.prevView) handlers.prevView(s);
        if (scrollTop >= s.start && scrollTop < s.end && handlers.currView) {
          handlers.currView(s);
          relPos = 0;
          if (!handlers.window) break;
        }
        
        if (!s.isPercent) {
          if (handlers.window) handlers.window($windows[s.i], relPos, s.i);
          if (relPos >= 0) relPos++;
          s.i++;
        }
      }
    }
  
    function closestSnap(scrollTop, handlers) {
      handlers = $.extend( {}, handlerDefaults, handlers) ;
      var origCurr = handlers.currView, 
          result;
      handlers.currView = function(s) {
        var posPercent = (scrollTop - s.start) / (s.end - s.start);
        result = s.isPercent ?
                  { win : $windows[s.i], snap : scrollTop, percent : posPercent, pos : s.i } : 
                  (posPercent >= 0.5 ?
                    { win : $windows[s.i+1], snap : s.end, percent : 0, pos : s.i+1 } :
                    { win : $windows[s.i], snap : s.start, percent : 0, pos : s.i });
        if (origCurr) origCurr(s);
      }
      forEachView(scrollTop, handlers);
      return result;
    }
  
    function getNextView() {
      var result;
      forEachView(view.scrollTop(), { currView : function(s) {
        if (s.isPercent) {
          var posPercent = Math.min((view.scrollTop() + s.viewHeight - s.start) / (s.end - s.start), 1);
          result = { win : $windows[s.i], snap : posPercent * ($windows[s.i].height() - s.viewHeight) + s.start, percent : posPercent, pos : s.i };
        } else {
          result = ( s.i >= $windows.length - 1 ? null : { win : $windows[s.i+1], snap : s.end, percent : 0, pos : s.i+1 });
        }
      }});
      return result;
    }
  
    function goToNextView() {
      var result = getNextView();
      if(result) view.scrollToPosition(result.snap, result.win);
      return true;
    }
  
    function getPrevView() {
      var result;
      forEachView(view.scrollTop(), { prevView : function(s) {
        if (s.isPercent) {
          var posPercent = Math.max((view.scrollTop() - s.viewHeight - s.start) / (s.end - s.start), 0);
          result = { win : $windows[s.i], snap : posPercent * ($windows[s.i].height() - s.viewHeight) + s.start, percent : posPercent, pos : s.i };
        } else {
          result = { win : $windows[s.i], snap : s.start, percent : 0, pos : s.i };
        }
      }});
      return result;
    }
  
    function goToPrevView() {
      var result = getPrevView();
      performAnim(Math.max($w.scrollTop() - 5, 0));
      if(result) view.scrollToPosition(result.snap, result.win);
      return true;
    }
  
    function performAnim(scrollTop) {
      var fixedHeight = 0;
      if ('undefined' === typeof scrollTop) scrollTop = $w.scrollTop();
      
      var result = closestSnap(scrollTop, 
      { 
        currView: function(s) {
          var excess = $windows[s.i].height() - s.viewHeight;
          if (s.i !== $windows.length) {
            if (!s.isPercent && (opts.fade && !opts.curtain || opts.curtain && s.i === $windows.length - 1 )) {
              fixedHeight += $windows[s.i].css({'position' : 'fixed', 
                                                'top' : (excess > 0 ? s.viewHeight - $windows[s.i].height() : screenOffset($windows[s.i], $w)),
                                                'opacity' : 1 - (scrollTop - s.start) / (s.end - s.start)}).height();
            } else {
              $windows[s.i].css({'position' : 'relative', 
                                 'top' : 0,
                                 'opacity' : 1 - (opts.fade && !s.isPercent ? (scrollTop - s.start) / (s.end - s.start) : 0)});
            }
          }
          if (excess > 0) {
            $windows[s.i].find(opts.affix).each(function() {
              $(this).css(s.isPercent ? 
                            {'position': 'fixed', 'top': $(this).data('affix-top') } : 
                            {'position': 'relative', 'top': $(this).data('orig-top') + excess }); 
            });
          }
        }, 
        window: function(win, rel, i) {
          if (rel === 1 && (opts.fade || opts.curtain)) {
            fixedHeight += win.css({'position' : 'fixed', 
                                    'top' : screenOffset(win, $w),
                                    'opacity' : 1}).height();
          } else if (rel !== 0) {
            win.css({'position' : 'relative', 
                     'top' : 0,
                     'opacity' : 1});
          }
          if (rel !== 0) {
            win.find(opts.affix).each(function() {
              if ($(this).css('position') === 'fixed') {
                $(this).css(win.css('position') === 'fixed' ? 
                            {'position': 'fixed', 'top': $(this).data('affix-top') } : 
                            {'position': 'relative', 'top': $(this).data('orig-top') }); 
              }
            });
          }
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
      var self = this;
      var timeout = null;
      
      this.height = function () {
        return view.height();
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