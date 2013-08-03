windows
=======

a handy, loosely-coupled jQuery plugin for scrolling windows

Demonstration
=============

[Demo](http://erdomke.github.io/windows)

Instructions
============

Use whatever markup you want:

    <section class="window">
      Some content
    </section>
    <section class="window">
      Some more content
    </section>
    
To initialize the plugin, use the appropriate selector to find your windows, and call the `windows()` method

    <script src="jquery.windows.js"></script>
    
    <script>
    // Defaults:
    $('.window').windows({
      snapping: true,     // [bool] turn on snapping
      scrollSpeed: 500,   // [int] how quickly to snap to a window (in millisecons)
      scrollDelay: 1100,  // [int] delay after scroll completes before snapping starts
      enableKeys: true,   // [bool] whether to allow keyboard shortcuts
      easing: 'swing',    // [string] easing animation
                          // (don't forget to add the easing plugin)
      onScroll: function(scrollPos){
        // after the window scrolls
        // scrollPos = [int] scrollTop value for the window
      },
      onSnapComplete: function($el){
        // after window ($el [jQuery element]) snaps into place
      },
      onWindowEnter: function($el){
        // when window ($el [jQuery element]) enters viewport
      }
    });
    </script>
    
Once initialized, the following API calls can be made:

    // [jQuery element] current window
    $.fn.windows('getCurrentWindow');
    
    // [bool] whether or not element is visible on screen
    $('.window:eq(0)').windows('isOnScreen');
    
      // [array of bool]
      $('.window').windows('isOnScreen');
    
    // [jQuery element from selector] navigates to the next view
    // equivalent to page down, space, or down arrow
    $('.window').windows('nextView');
    
    // [jQuery element from selector] navigates to the previous view
    // equivalent to page up, shift+space, or up arrow
    $('.window').windows('prevView');
    
    // [int] where the view would be scrolled to in order to show the window
    $('.window:eq(0)').windows('snapPosition');
    
      // [array of int]
      $('.window').windows('snapPosition');
      
Credits
=======

The original code and inspiration came from [@nick-jonas](http://nick-jonas.github.io/windows/)