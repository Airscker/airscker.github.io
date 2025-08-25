/******************************************
    Version: 3.0 - Minimal and Error-Free
/****************************************** */

jQuery(document).ready(function($) {
  "use strict";

  // Smooth scrolling
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').on('click', function (e) {
    e.preventDefault();
    var target = $(this.getAttribute('href'));
    if (target.length) {
      $('html, body').animate({
        scrollTop: target.offset().top - 54
      }, 1000);
    }
  });

  // Close responsive menu when scroll trigger is clicked
  $('.js-scroll-trigger').on('click', function () {
    $('.navbar-collapse').collapse('hide');
  });

  // Navbar collapse on scroll
  function navbarCollapse() {
    if ($("#mainNav").offset().top > 100) {
      $("#mainNav").addClass("navbar-shrink");
    } else {
      $("#mainNav").removeClass("navbar-shrink");
    }
  }
  
  navbarCollapse();
  $(window).on('scroll', navbarCollapse);

  // Scroll to top
  if ($('#scroll-to-top').length) {
    $(window).on('scroll', function () {
      if ($(window).scrollTop() > 100) {
        $('#scroll-to-top').addClass('show');
      } else {
        $('#scroll-to-top').removeClass('show');
      }
    });
    
    $('#scroll-to-top').on('click', function (e) {
      e.preventDefault();
      $('html, body').animate({
        scrollTop: 0
      }, 700);
    });
  }

  // Banner height
  if ($('.heading').length) {
    $('.heading').height($(window).height());
  }

  // Hide preloader
  if ($("#preloader").length) {
    $("#preloader").fadeOut(500);
  }

  // Animated counters
  $(".stat_count, .stat_count_download").each(function () {
    var $this = $(this);
    var countTo = parseInt($this.text(), 10);
    $this.text('0');
    
    function countUp() {
      var current = parseInt($this.text(), 10);
      if (current < countTo) {
        $this.text(current + 1);
        setTimeout(countUp, 30);
      } else {
        $this.text(countTo);
      }
    }
    
    countUp();
  });

});