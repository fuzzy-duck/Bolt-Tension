import BoltGame, {EVENT_BOLT_ACTIVATED, EVENT_ALL_BOLTS_COMPLETED, EVENT_GAME_COMPLETED} from './BoltGame.js'

let connected = false
let score = 0
let automaticSelectionInterval = -1
let timeStarted = -1
let timeOutInterval = -1
let automaticallyShowFirstBolt = true
const TIME_BETWEEN_BOLTS = 800

const game = new BoltGame()

// FIXME: Not very performant way of handling this...
const showResults = () => document.querySelectorAll(".result").forEach( bolt => bolt.removeAttribute("hidden"))
const hideResults = () => document.querySelectorAll(".result").forEach( bolt => bolt.setAttribute("hidden", true))

const hideHomePage = () =>{ 
  console.log("Hiding Welcome Screen")
  $('.home').attr("hidden",true)
  $(".play").fadeOut()
  $(".play").unbind("click")
  $(".start").unbind("click")
}

const showHomePage = ( useClick=true ) =>{ 
  console.log("Showing Welcome Screen")
    
  $('.home').removeAttr("hidden")
  $(".play").delay(1000).fadeIn()
  if (useClick)
  {
    $(".play").on("click", function () {

      console.log("Play has been pressed by the user on screen")
      $(".howtoplay").fadeIn()

      $(".start").on("click", function () {
        console.log("Start has been pressed by the user on screen")
        $(".game-base").fadeIn()
      })

      $(".start").delay(2000).fadeIn()

      // start the game!
      start()
    })
  }
}

/**
 * Reset the game and all the variables so that
 * a clean game can be started
 * @returns {Boolean}
 */
const resetGame = async (quick=false) => {
  console.log("Resetting Game")

  await game.showAttractMode()

  score = 0

  // we clear interval in case one was queued up before
  clearInterval(automaticSelectionInterval)
  clearInterval(timeOutInterval)

  if (!quick)
  {
    // reset gui too
    document.querySelectorAll(".bolt").forEach( bolt =>{ 
      bolt.classList.remove("active", "faulty", "normal") 
    })

    document.querySelectorAll(".result").forEach( bolt =>{ 
      bolt.setAttribute("hidden", true)
      bolt.classList.remove("tick", "cross") 
    })
    showHomePage()
    
    game.resetGame()
  }
 
  return true
}

/**
 * Wait for a user to press either Faulty or Normal
 */
const waitForUserChoice = async( timeAllowance=12000 ) => new Promise( (resolve,reject)=>{
  
  console.log("Waiting for user to select faulty or normal")
  
  const timeout = setTimeout(()=>{
    console.log("User may have left!")
    reject("Timed out - user probably left")
  }, timeAllowance )

  const end = (isFaulty) => {
    $(".btn-normal").unbind("click")
    $(".btn-faulty").unbind("click")
    clearInterval(timeout)
    console.log("User selected faulty:"+isFaulty)
    
    resolve(isFaulty)
  }

  $(".btn-normal").on("click", function () {
    end(false)
  })
  
  $(".btn-faulty").on("click", function () {
    end(true)
  })
})
 
const activateBolt = async ( boltIndex ) => {

  if (!game.playing){
    console.warn("Bolt Changed even though Game has not started and is locked")
    return
  }
  // show activity
  restartTimeout()

 // FIXME: Presumably once the user returns the handheld device to a bolt their answer is reset on the front-end?
  
  // FIXME: However, once a bolt has been activated the user can return to it
  // and reactivate it using the handheld device and change their answer....
  // if it's incorrect (by pressing faulty or normal)

  if (isNaN(boltIndex)){
    throw Error("This is not a boltIndex! : "+boltIndex)
  }

  // we clear interval in case one was queued up before
  clearInterval(automaticSelectionInterval)
 
  const boltNumber = boltIndex + 1
  const boltClassName = ".bolt0" + boltNumber
  const $bolt = $(boltClassName)
  const $result = $(".result", $(boltClassName))

  // remove all other active classes
  document.querySelectorAll(".bolt.active").forEach( bolt =>{ 
    bolt.classList.remove("active") 
  })

  // now add to the newly active one
  $bolt.removeClass("normal faulty").addClass("active")

  // console.log("Added active class to $("+boltClassName + ")" )

  // play video on the front end (possible 4 faulty videos 8 normal video)
  console.log("Now playing video file for user to guess if Bolt "+boltClassName+" is faulty or not")
  
  // Pause
  // await new Promise(resolve => setTimeout(resolve, 200 ))
  
  // TODO: The user decides if it is faulty or normal by pressing the front end buttons
  // The user now decides if it is faulty or normal by pressing the front end buttons
  // wait for faulty or none faulty buttons

  // This correct or incorrect score (x or tick) is registered but only 
  // revealed by pressing the check button
  try{

    const userThinksItIsFaulty = await waitForUserChoice()
    
    // now check the answer is correct
    const wasUserCorrect = await game.setUserAnswer(boltIndex, userThinksItIsFaulty)
    console.log("User answered correctly? :", wasUserCorrect )
   
    if (wasUserCorrect)
    {
      score++
    }

    const choiceClass = wasUserCorrect ? "tick" : "cross"
    $result.removeClass("tick cross").addClass(choiceClass)

    const resultClass = userThinksItIsFaulty ? "faulty" :  "normal"
    $bolt.removeClass("faulty normal").addClass(resultClass)

    if ( !game.haveAllBoltsBeenTested() )
    {
      // After pressing faulty or normal another bolt is randomised and the process continues 
      automaticSelectionInterval = setTimeout( ()=>{ 
        const nextUnplayedBolt = game.getRandomBoltIndexWithNoSelection()
        activateBolt( nextUnplayedBolt )
      }, TIME_BETWEEN_BOLTS )

    }else{
      
      console.log("Game complete?", game )

    }

  }catch(error){

    console.error(error)
    // timeout!
    endGame()
  }
}


// End the game (after timeout)
const endGame = async () => {
  console.log("Ending game prematureely")
  await resetGame()
}

const onTimeOut = async () => {
  console.log("Ten minute timeout of inactivity - resettting...")
  //endGame()
}

const restartTimeout = () => {
  if (game.playing)
  {
    // don't allow automation if game not playing
    clearInterval(timeOutInterval)
    timeOutInterval = setTimeout( onTimeOut, 1000 * 60 * 2 )
  }
}

const pickRandomBolt = async () => {
  // automaticallyShowFirstBolt
  return await activateBolt( Math.round(Math.random() * 8) )
}

const start = async () => {

  console.log("Attempting to connect to Arduino...")
  console.log("Accept the prompt if requested please!")

  // we only need this once - should be automatically removed
  // document.documentElement.removeEventListener( "click", start )

  // game play :
  if (connected)
  {
    // start the game with randomised settings
    game.startGame()
    
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
    
    connected = await game.initialise()
  }

  console.log( connected ? "Connected to Arduino..." : "Arduino refused connection")

  // aut0 mode
  if (!connected && automaticallyShowFirstBolt)
  {
    console.error("Couldn't connect to Arduino : faking transmissions")
    // go into fake mode...
    game.startGame()
    pickRandomBolt()
  }

  timeStarted = Date.now()
  console.log( connected ? "Arduino Game Started at" : "Test Game Started at",  new Date(timeStarted) )
  hideHomePage()
}


// Start here ----- 

// game play interactions
$(".bolt").on("click", function (event) {
  const boltIndex = parseInt( event.target.className.match(/(-\d+|\d+)(,\d+)*(\.\d+)*/g)  ) - 1
  activateBolt(boltIndex)
})

$(".btn-check").on("mousedown", showResults )
$(".btn-check").on("mouseup", hideResults )

// Watch for the user bringing the wand to a select a bolt
game.on( EVENT_BOLT_ACTIVATED, async (boltIndex) => {
  // The user used the handheld device to select a bolt 
  console.log("Bolt activated by user", boltIndex)
  await activateBolt(boltIndex)
})

// User has interacted with all bolts but there are still issues
game.on( EVENT_ALL_BOLTS_COMPLETED, () => {
  console.log("Not all of your answers wre correct!")
})

// User has got all bolts correct!
game.on( EVENT_GAME_COMPLETED, ({timeElapsed}) => {

   console.log("Game Over! Time taken to complete ", timeElapsed, "ms")
  
    // Once all answers are correct a signal is sent via websockets to the reward screen which marks it as complete
   
    // TODO:
    // Once all is complete a ten minute timer starts, giving the user enough time to complete the Moving parts exhibit and then resets (see below)

  // show congratulations screen
  let $wellDone = $(".well-done")
  $wellDone.fadeIn()
  $wellDone.on("click", function(){
    $wellDone.unbind()
    $wellDone.fadeOut()
    $wellDone = null
    resetGame()
  })
})

window.addEventListener('keydown', event => {
  const isNumber = !isNaN( parseInt(event.key) )
	if (isNumber){
    activateBolt( parseInt(event.key) )
  }
})

// Game Begins
// This is used to allow the Serial Controller
document.documentElement.addEventListener( "click", start, { once: true } )

resetGame( true )
showHomePage( false )

// Game Begins
// resetGame( true )