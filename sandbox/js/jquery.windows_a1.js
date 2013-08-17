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
        options = {},
        $windows = [],
        $scrollFix = null,
        $w = $(window);
  
    function Win(window, viewport) {
      /*var relTop = Math.round(window.offset().top - viewport.scrollTop());
      var relBot = Math.round(relTop + window.height());*/
      
      var origTop = window.offset().top;
      var self = this;
      
      /*this.isOnScreen = function() {
        return (window.is(":visible") && relTop < viewHeight && relBot > 0) ? true : false;
      }*/
      
      this.origTop = function() {
        return origTop;
      }
      this.screenOffset = function() {
        if (window.height() < viewport.height()) {
          return (viewport.height() - window.height()) / 2;
        } else {
          return 0;
        }
      }
      this.window = function() {
        return window;
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
        
      }
      
      var result = this.each(function(i) {
        $windows.push(new Win($(this), $w));
      });
      
      $windows.sort(function (a, b) {
        return a.origTop() - b.origTop();
      });
      var baseIndex = 1000;
      for (var i = 0; i < $windows.length; i++) {
        $windows[i].window().css('z-index', baseIndex);
        baseIndex--;
      }
      $scrollFix = $('<div style="position:relative;z-index:-1"></div>').appendTo('body');
      
      return result;
    };
  
    function setCss() {
      var fixedHeight = 0;
      for (var i = 0; i < $windows.length; i++) {
        if (($w.scrollTop() >= ($windows[i].origTop() - $windows[i].screenOffset()) && i < ($windows.length - 1)) || fixedHeight > 0) {
          $windows[i].window().css('position', 'relative');
          $windows[i].window().css('top', 0);
        } else {
          $windows[i].window().css('position', 'fixed');
          $windows[i].window().css('top', $windows[i].screenOffset());
          fixedHeight = $windows[i].window().height();
        }
      }
      $scrollFix.height(fixedHeight);
    }
                        
    $.fn[pluginName].defaults = {};
    
    var _onScroll = function(){
      setCss();
    };

    var _onResize = function(){
      setCss();
    };
  
    var _onKeydown = function(e) {
      
    };
  
    $w.scroll(_onScroll);
    $w.resize(_onResize);
    $w.keydown(_onKeydown);

})( jQuery, window, document );