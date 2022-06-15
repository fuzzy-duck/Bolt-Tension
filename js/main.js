import BoltGame, {EVENT_BOLT_ACTIVATED} from './BoltGame.js'

let score = 0
let interval = -1
const game = new BoltGame()



const resetGame = () => {
  console.log("Restarting Game")
  score = 0
  // reset gui too
  document.querySelectorAll(".bolt").forEach( bolt =>{ 
    bolt.classList.remove("active", "faulty", "normal") 
  })

  game.restartGame()
}


const waitForUserChoice = async() => new Promise( (resolve,reject)=>{
  console.log("Waiting for user to select faulty or normal")
  const nowWaitForCheckButton = (isFaulty) => {
    $(".btn-normal").unbind()
    $(".btn-faulty").unbind()
    console.log("Waiting for user to click check")
    $(".btn-check").on("click", function () {
      $(".btn-check").unbind()
      resolve(isFaulty)
    })
  }

  $(".btn-normal").on("click", function () {
    nowWaitForCheckButton(false)
  })
  
  $(".btn-faulty").on("click", function () {
    nowWaitForCheckButton(true)
  })
})
 

const activateBolt = async ( boltIndex ) => {

 // FIXME: Presumably once the user returns the handheld device to a bolt their answer is reset on the front-end?
  
  // FIXME: However, once a bolt has been activated the user can return to it
  // and reactivate it using the handheld device and change their answer....
  // if it's incorrect (by pressing faulty or normal)
 

  if (isNaN(boltIndex)){
    throw Error("This is not a boltIndex! : "+boltIndex)
  }

  const boltNumber = boltIndex + 1
  const boltClassName = ".bolt0" + boltNumber
  const $bolt = $(boltClassName)
  const $result = $(".result", $(boltClassName))

  // remove all other active classes
  document.querySelectorAll(".bolt.active").forEach( bolt =>{ 
    bolt.classList.remove("active") 
  })
  // now add to the newly active one
  $bolt.addClass("active")

  // console.log("Added active class to $("+boltClassName + ")" )

  // play video on the front end (possible 4 faulty videos 8 normal video)
  console.log("Now playing video file for user to guess if Bolt "+boltClassName+" is faulty or not")
  
  // Pause
  await new Promise(resolve => setTimeout(resolve, 500 ))
  
  // TODO: The user decides if it is faulty or normal by pressing the front end buttons
  // The user now decides if it is faulty or normal by pressing the front end buttons
  // wait for faulty or none faulty buttons

  // This correct or incorrect score (x or tick) is registered but only 
  // revealed by pressing the check button
  const userThinksItIsFaulty = await waitForUserChoice()
  console.log("User has clicked userThinksItIsFaulty:", userThinksItIsFaulty )

  // now check the answer
  const wasUserCorrect = game.setUserAnswer(boltIndex, userThinksItIsFaulty)
  if (wasUserCorrect){
    // score++
  }else{

  }

  const choiceClass = wasUserCorrect ? "tick" : "cross"
  $result.addClass(choiceClass)

  const resultClass = userThinksItIsFaulty ? "faulty" :  "normal"
  $bolt.addClass(resultClass)
  
  if ( !game.hasGameCompleted() )
  {
    // FAKE! After pressing faulty or normal another bolt is randomised and the process continues
    clearInterval(interval)
    
    interval = setTimeout( ()=>{ 
      const nextUnplayedBolt = game.getRandomBoltIndexWithNoSelection()
      activateBolt( nextUnplayedBolt )
    }, 800 )

  }else{
    
    console.log("Game complete", game )

    // show congratulations screen
    let $wellDone = $(".well-done")
    $wellDone.fadeIn()
    $wellDone.on("click", function(){
      $wellDone.unbind()
      $wellDone.fadeOut()
      $wellDone = null
      resetGame()
    })

    // Once all answers are correct a signal is sent via websockets to the reward screen which marks it as complete
    console.log("All Bolts have been tested by the user")
    // TODO:
    // Once all is complete a ten minute timer starts, giving the user enough time to complete the Moving parts exhibit and then resets (see below)
  }
}

// Watch for the user bringing the wand to a select a bolt
game.on( EVENT_BOLT_ACTIVATED, (boltIndex) => {

  // The user used the handheld device to select a bolt 
  console.log("Bolt activated by user", boltIndex)
  activateBolt(boltIndex)
})


const start = async () => {

  console.log("Attempting to connect to Arduino...")
  console.log("Accept the prompt if requested please!")

  // we only need this once!
  document.documentElement.removeEventListener( "click", start )

  const connected = await game.initialise()
  console.log( connected ? "Connected to Arduino..." : "Arduino refused connection")

  // game play :
  if (connected)
  {
    // start the game with randomised settings
    game.startGame()
    console.log( connected ? "Connected to Arduino..." : "Arduino refused connection")
  
    // will return the number -1 -> 6
    // game.getBoltStatus( 0 )
    // game.isBoltFaulty( 0 )
    // game.isBoltFunctional( 0 )

    // attach for next time
    // startButton.addEventListener( "click", (event) => game.startGame() )

    // game.showAttractMode()
    // game.restart()
    // game.showEndScreen()

    // TODO: If there is no user interaction through the AV for 5 minutes the exhibit resets

  }else{
    console.error("Couldn't connect to Arduino : faking transmissions")
    // go into fake mode...
    activateBolt(0)
  }
}

document.documentElement.addEventListener( "click", start )

//set initial screens
$(".play").delay(1000).fadeIn()

$(".play").on("click", function () {
  $(".howtoplay").fadeIn()
  $(".start").delay(2000).fadeIn()
})

$(".start").on("click", function () {
  $(".game-base").fadeIn()
})


/*

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
  
  */