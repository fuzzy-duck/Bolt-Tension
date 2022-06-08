

var bolt01 = false;
var bolt02 = false;
var bolt03 = false;
var bolt04 = false;
var bolt05 = false;
var bolt06 = false;
var bolt07 = false;
var bolt08 = false;

var normal = false;
var faulty = false;

//used to determine end of game
var counter = 0;

//used for correct score
var correct = 0;

//set initial screens
$(".play").delay(1000).fadeIn();

$(".play").on("click", function () {
    $(".howtoplay").fadeIn();
    $(".start").delay(2000).fadeIn();
  });

  $(".start").on("click", function () {
    $(".game-base").fadeIn();
  });

  //set functions so Arduino and buttons can be used
  function activateBolt01(){
    $(".bolt01").addClass("active");
    bolt01 = true;
  }
  function activateBolt02(){
    $(".bolt02").addClass("active");
    bolt02 = true;
  }
  function activateBolt03(){
    $(".bolt03").addClass("active");
    bolt03 = true;
  }
  function activateBolt04(){
    $(".bolt04").addClass("active");
    bolt04 = true;
  }
  function activateBolt05(){
    $(".bolt05").addClass("active");
    bolt05 = true;
  }
  function activateBolt06(){
    $(".bolt06").addClass("active");
    bolt06 = true;
  }
  function activateBolt07(){
    $(".bolt07").addClass("active");
    bolt07 = true;
  }
  function activateBolt08(){
    $(".bolt08").addClass("active");
    bolt08 = true;
  }

  //For the purpose of the demo we'll say 3 are faulty / 5 normal on click
  //...but in reality the randomness will be controlled by the Arduino

  $("#activateIcon01").on("click", function () {
    $(this).addClass("disabled");
    activateBolt01();
    faulty = true;
  });
  $("#activateIcon02").on("click", function () {
    $(this).addClass("disabled");
    activateBolt02();
    normal = true;
  });
  $("#activateIcon03").on("click", function () {
    $(this).addClass("disabled");
    activateBolt03();
    normal = true;
  });
  $("#activateIcon04").on("click", function () {
    $(this).addClass("disabled");
    activateBolt04();
    normal = true;
  });
  $("#activateIcon05").on("click", function () {
    $(this).addClass("disabled");
    activateBolt05();
    faulty = true;
  });
  $("#activateIcon06").on("click", function () {
    $(this).addClass("disabled");
    activateBolt06();
    faulty = true;
  });
  $("#activateIcon07").on("click", function () {
    $(this).addClass("disabled");
    activateBolt07();
    normal = true;
  });
  $("#activateIcon08").on("click", function () {
    $(this).addClass("disabled");
    activateBolt08();
    normal = true;
  });

  //this will need to be changed to a touch press / release function
  $(".btn-check").on("click", function () {
    $(".result").fadeIn();
    $(".result").delay(2000).fadeOut();
  });

  $(".btn-normal").on("click", function () {
    if(bolt01 == true && faulty == true){
      $(".bolt01").addClass("normal");
      $(".bolt01 .result").addClass("cross");
      counter +=1
      console.log("incorrect - counter: " +counter);
      console.log("score: : " +correct);
      bolt01 = false;
    }
    if(bolt02 == true && normal == true){
      $(".bolt02").addClass("normal");
      $(".bolt02 .result").addClass("tick");
      counter +=1;
      correct +=1;
      console.log("correct - counter: " +counter);
      console.log("score: : " +correct);
      bolt02 = false;
    }
    if(bolt03 == true && normal == true){
      $(".bolt03").addClass("normal");
      $(".bolt03 .result").addClass("tick");
      counter +=1;
      correct +=1;
      console.log("correct - counter: " +counter);
      console.log("score: : " +correct);
      bolt03 = false;
    }
    if(bolt04 == true && normal == true){
      $(".bolt04").addClass("normal");
      $(".bolt04 .result").addClass("tick");
      counter +=1;
      correct +=1;
      console.log("correct - counter: " +counter);
      console.log("score: : " +correct);
      bolt04 = false;
    }
    if(bolt05 == true && faulty == true){
      $(".bolt05").addClass("normal");
      $(".bolt05 .result").addClass("cross");
      counter +=1;
      console.log("incorrect - counter: " +counter);
      console.log("score: : " +correct);
      bolt05 = false;
    }
    if(bolt06 == true && faulty == true){
      $(".bolt06").addClass("normal");
      $(".bolt06 .result").addClass("cross");
      counter +=1;
      console.log("incorrect - counter: " +counter);
      console.log("score: : " +correct);
      bolt06 = false;
    }
    if(bolt07 == true && normal == true){
      $(".bolt07").addClass("normal");
      $(".bolt07 .result").addClass("tick");
      counter +=1;
      correct +=1;
      console.log("correct - counter: " +counter);
      console.log("score: : " +correct);
      bolt07 = false;
    }
    if(bolt08 == true && normal == true){
      $(".bolt08").addClass("normal");
      $(".bolt08 .result").addClass("tick");
      counter +=1;
      correct +=1;
      console.log("correct - counter: " +counter);
      console.log("score: : " +correct);
      bolt08 = false;
    }

    if(correct == 8){
      console.log("completed");
      $(".well-done").fadeIn();
    }

    //reset values
    normal = false;
    faulty = false;
  });

  $(".btn-faulty").on("click", function () {
    if(bolt01 == true && faulty == true){
      $(".bolt01").addClass("faulty");
      $(".bolt01 .result").addClass("tick");
      counter +=1;
      correct +=1;
      console.log("correct - counter: " +counter);
      console.log("score: : " +correct);
      bolt01 = false;
    }
    if(bolt02 == true && normal == true){
      $(".bolt02").addClass("faulty");
      $(".bolt02 .result").addClass("cross");
      counter +=1;
      console.log("incorrect - counter: " +counter);
      console.log("score: : " +correct);
      bolt02 = false;
    }
    if(bolt03 == true && normal == true){
      $(".bolt03").addClass("faulty");
      $(".bolt03 .result").addClass("cross");
      counter +=1;
      console.log("incorrect - counter: " +counter);
      console.log("score: : " +correct);
      bolt03 = false;
    }
    if(bolt04 == true && normal == true){
      $(".bolt04").addClass("faulty");
      $(".bolt04 .result").addClass("cross");
      counter +=1;
      console.log("incorrect - counter: " +counter);
      console.log("score: : " +correct);
      bolt04 = false;
    }
    if(bolt05 == true && faulty == true){
      $(".bolt05").addClass("faulty");
      $(".bolt05 .result").addClass("tick");
      counter +=1;
      correct +=1;
      console.log("correct - counter: " +counter);
      console.log("score: : " +correct);
      bolt05 = false;
    }
    if(bolt06 == true && faulty == true){
      $(".bolt06").addClass("faulty");
      $(".bolt06 .result").addClass("tick");
      counter +=1;
      correct +=1;
      console.log("correct - counter: " +counter);
      console.log("score: : " +correct);
      bolt06 = false;
    }
    if(bolt07 == true && normal == true){
      $(".bolt07").addClass("faulty");
      $(".bolt07 .result").addClass("cross");
      counter +=1;
      console.log("incorrect - counter: " +counter);
      console.log("score: : " +correct);
      bolt07 = false;
    }
    if(bolt08 == true && normal == true){
      $(".bolt08").addClass("normal");
      $(".bolt08 .result").addClass("cross");
      counter +=1;
      console.log("incorrect - counter: " +counter);
      console.log("score: : " +correct);
      bolt08 = false;
    }

    if(correct == 8){
      console.log("completed");
      $(".well-done").fadeIn();
    }

    //reset values
    normal = false;
    faulty = false;
  });