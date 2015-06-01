var distance = $('[data-magellan-destination]').offset().top,
    $window = $(window);

$(window).scroll(function() {
    if($(window).scrollTop() >= distance) {  
        $('.floating-nav').fadeIn('fast');
    }else{
        $('.floating-nav').fadeOut('fast');
    }
});

// Foundation JavaScript
// Documentation can be found at: http://foundation.zurb.com/docs
$(document).foundation();