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
        opts = {},
        $windows = [],
        $winHash = {},
        $scrollFix = null,
        baseOffset = 0,
        hashRegistered = false;
  
    /**
     * A really lightweight plugin wrapper around the constructor,
        preventing against multiple instantiations
     * @param  {Object} options
     * @return {jQuery Object}
     */
    $.fn[pluginName] = function ( options, arg ) {
      if ('string' === typeof options) {
        switch (options) {
          case 'getView':
            return getCurrViewName(view.scrollTop());
          case 'setView':
            setCurrView(arg);
            return this;
          case 'nextView':
            goToNextView();
            return this;
          case 'prevView':
            goToPrevView();
            return this;
        }
      }
      
      opts = $.extend( {}, $.fn[pluginName].defaults, options) ;
      opts.manageHash = opts.manageHash && jQuery.fn.hashchange;
      var win,
          result = this.each(function(i) {
            win = $(this);
            $windows.push(win);
            
            var anchor = win.children().first().filter('a[id]:not([href])');
            if (win.attr('id')) {
              win.data(winIdName, win.attr('id'));
            } else if (opts.manageHash && anchor.length === 1) {
              win.data(winIdName, anchor.attr('id'));
              anchor.attr('id', '__' + anchor.attr('id'));
            } else {
              win.data(winIdName, winIdName + '-' + $windows.length);
            }
            $winHash[win.data(winIdName)] = win;
            
            win.find(opts.affix).each(function() {
              var $this = $(this);
              $this.data({'affix-top': $this.offset().top - parseFloat($this.css('marginTop').replace(/auto/,0)) - win.offset().top,
                          'orig-top': parseFloat($this.css('top').replace(/auto/,0))});
            });
            
            if (opts.manageHash) {
              win.find('a[id]:not([href])').each(function() {
                var anchor = $(this);
                if (anchor.attr('id').substr(0,2) !== '__') anchor.attr('id', '__' + anchor.attr('id'));
                anchor.data('affix-top', anchor.offset().top - parseFloat(anchor.css('marginTop').replace(/auto/,0)) - win.offset().top);
              });
            }
          });
      
      $windows.sort(function (a, b) {
        return a.offset().top - b.offset().top;
      });
      var baseIndex = opts.zIndex;
      for (var i = 0; i < $windows.length; i++) {
        $windows[i].css('z-index', baseIndex--);
      }
      $scrollFix = $('<div style="position:relative;z-index:-1"></div>').appendTo('body');
      
      if (opts.manageHash && !hashRegistered) {
        hashRegistered = true;
        $w.hashchange(function() {
          if (!hashMgr.setting) setCurrView(hashMgr.hash());
        });
      }
      
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
      manageHash: false,
      onViewChangeStart: function () {},
      onViewChangeEnd: function () {}
    }
  
    function screenOffset(win, view) {
      return (win.height() < view.height() ? (view.height() - win.height()) / 2 : 0);
    }
  
    function forEachView(scrollTop, viewCallback, winCallback) {
      var s = {
            start : 0,
            end : baseOffset,
            i : 0,
            isPercent : false,
            viewHeight : $w.height(),
            isPrev : function() {
              return scrollTop > this.start && scrollTop <= this.end;
            },
            isCurr : function() {
              return scrollTop >= s.start && scrollTop < s.end;
            }
          },
          relPos = -1,
          winCanExit = !winCallback || 'undefined' === typeof winCallback,
          viewCanExit = !viewCallback || 'undefined' === typeof viewCallback;
      
      while (s.i < $windows.length) {
        s.start = s.end;
        s.isPercent = !s.isPercent && $windows[s.i].height() > s.viewHeight;
        s.end += Math.round(s.isPercent ? 
                  $windows[s.i].height() - s.viewHeight :
                  ($windows[s.i].height() > s.viewHeight ? 
                    s.viewHeight : 
                    $windows[s.i].height() + screenOffset($windows[s.i], $w) - (s.i+1 < $windows.length ? screenOffset($windows[s.i+1], $w) : 0))) ;
        
        viewCanExit = viewCanExit || viewCallback(s);
        if (s.isCurr()) relPos = 0;
        
        if (!s.isPercent) {
          winCanExit = winCanExit || winCallback($windows[s.i], relPos, s.i);
          if (relPos >= 0) relPos++;
          s.i++;
        }
        if (viewCanExit && winCanExit) break;
      }
    }
  
    function getCurrViewName(scrollTop) {
      var result = null,
          prevPercent = false; 
      forEachView(scrollTop, function (s) {
        if (s.isPrev()) {
          prevPercent = s.isPercent;
        }
        if (s.isCurr()) {
          result = $windows[s.i].data(winIdName) + (s.isPercent ? '%' + Math.round(100 * (scrollTop - s.start) / (s.end - s.start)) : (prevPercent ? '%100' : ''));
        }
        return !!result;
      });
      return result;
    }
  
    function setCurrView(name) {
      var parts = name.split('%'),
          elem = $winHash[parts[0]],
          elemIsWin = elem && 'undefined' !== typeof elem,
          foundElem = null,
          viewData = null,
          nextView = false;
      if (!elemIsWin) elem = $('a#__' + name);

      if (elem && 'undefined' !== typeof elem) {
        forEachView($w.scrollTop(), function(s) {
          if (nextView) {
            viewData = s;
            return true;
          } else if (elemIsWin) {
            if ($windows[s.i] === elem) {
              viewData = s;
              return true;
            }
          } else {
            foundElem = elem.closest($windows[s.i]);
            if (foundElem.length === 1) {
              if (s.isPercent && elem.data('affix-top') > (s.end - s.start)) {
                nextView = true;
              } else {
                parts[1] = Math.round(100 * elem.data('affix-top') / (s.end - s.start));
                viewData = s;
                return true;
              }
            }
          }
          return false;
        });

        if (viewData) {
          var perc = (viewData.isPercent && parts.length > 1 ? Math.min(Math.max(0, parseInt(parts[1])), 100) : 0);
          view.scrollToPosition(viewData.start + perc * (viewData.end - viewData.start) / 100, $windows[viewData.i]);
        }
      }
    }
  
    function closestSnap(scrollTop, viewCallback, winCallback) {
      var canExit = !viewCallback || 'undefined' === typeof viewCallback,
          result = null;
      forEachView(scrollTop, function(s) {
        if (s.isCurr()) {
          var posPercent = (scrollTop - s.start) / (s.end - s.start);
          result = s.isPercent ?
                  { win : $windows[s.i], snap : scrollTop, percent : posPercent, pos : s.i } : 
                  (posPercent >= 0.5 ?
                    { win : $windows[s.i+1], snap : s.end, percent : 0, pos : s.i+1 } :
                    { win : $windows[s.i], snap : s.start, percent : 0, pos : s.i });
        }
        canExit = canExit || viewCallback(s);
        return canExit && !!result; 
      }, winCallback);
      return result;
    }
  
    function getNextView() {
      var result;
      forEachView(view.scrollTop(), function(s) {
        if (s.isCurr()) {
          if (s.isPercent) {
            var posPercent = Math.min((view.scrollTop() + s.viewHeight - s.start) / (s.end - s.start), 1);
            result = { win : $windows[s.i], snap : posPercent * ($windows[s.i].height() - s.viewHeight) + s.start, percent : posPercent, pos : s.i };
          } else {
            result = ( s.i >= $windows.length - 1 ? null : { win : $windows[s.i+1], snap : s.end, percent : 0, pos : s.i+1 });
          }
        }
        return !!result;
      });
      return result;
    }
  
    function goToNextView() {
      var result = getNextView();
      if(result) view.scrollToPosition(result.snap, result.win);
      return true;
    }
  
    function getPrevView() {
      var result;
      forEachView(view.scrollTop(), function(s) {
        if (s.isPrev()) {
          if (s.isPercent) {
            var posPercent = Math.max((view.scrollTop() - s.viewHeight - s.start) / (s.end - s.start), 0);
            result = { win : $windows[s.i], snap : posPercent * ($windows[s.i].height() - s.viewHeight) + s.start, percent : posPercent, pos : s.i };
          } else {
            result = { win : $windows[s.i], snap : s.start, percent : 0, pos : s.i };
          }
        }
        return !!result;
      });
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
      
      var result = closestSnap(scrollTop, function(s) {
        if (s.isCurr()) {
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
        }
      }, function (win, rel, i) {
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
  
    var hashMgr = new (function() {
      this.setting = false;
      
      this.hash = function(value) {
        if ('undefined' === typeof value) {
          return window.location.hash.substr(1);
        } else {
          this.setting = true;
          window.location.hash = '#' + value;
          this.setting = false;
        }
      }
    })();
  
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
          hashMgr.hash(getCurrViewName(newScrollTop));
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