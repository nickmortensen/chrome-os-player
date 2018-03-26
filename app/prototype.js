  //SETUP
  $(document).ready(function () {
    console.log("jQuery loaded!");
    $(".prototype-show").hide();
    $(".prototype-show-on-ready").show();
  });

  //CYCLE
  $(document).on("click", ".prototype-next-state", function () {
    var target = $(this).closest(".wrapper");
    $(target).hide().siblings("div").hide();
    $(target).next("div").show();
  });

  //SELECT MODE
  $(document).on("click", ".panel", function () {
    $('.panel').removeClass('selected');
    var targetPanel = $(this);
    $(targetPanel).addClass('selected');
  });
