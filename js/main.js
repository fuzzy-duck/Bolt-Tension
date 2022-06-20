import {isElectron} from './platform.js'
import BoltGame, {EVENT_BOLT_ACTIVATED, EVENT_ALL_BOLTS_COMPLETED, EVENT_GAME_COMPLETED} from './BoltGame.js'

// Settings!
const TIME_BETWEEN_BOLTS = 600


// determine what this is running on and work out the
// port from URL if specified otherwise use default
const PORT = new URLSearchParams(window.location.search).get("port") || isElectron() ? 1337 : 5555

const EVENT_ABORT_WAITING = "abort-waiting"

let connected = false
let score = 0
let automaticSelectionInterval = -1
let timeStarted = -1
let automaticallyShowFirstBolt = true
let waiting = false
let userChoiceInterval = -1
let controller = new AbortController()

const game = new BoltGame( PORT )
const $home = $(".home")
const $play = $(".play")
const $start = $(".start")
const nextButtons = [ $(".next01"), $(".next02"), $(".next03"), $start ]
const startScreens = [ $(".htp01"), $(".htp02"), $(".htp03"), $(".htp04") ]

const fadeOut = (element) => {
  element.classList.toggle('fade-out', true)
}

const isNumber = value => !isNaN( parseInt(value) )
	
const connectToHardware = async () => {

  if (connected)
  {   
    // game.getBoltStatus( 0 ) // will return the number -1 -> 6
    // game.isBoltFaulty( 0 )
    // game.isBoltFunctional( 0 )
    // game.showAttractMode()
    // game.restart()
    // game.showEndScreen()
    return true

  }else{
    console.log("Attempting to connect to Arduino...")
    console.warn("Accept the prompt if requested please!")
    connected = await game.initialise()
    return connected
  }
}



const hideHelpScreens = () => startScreens.forEach( $screen => $screen.hide() )

// FIXME: Not very performant way of handling this...
const showResults = () => document.querySelectorAll(".result").forEach( bolt => bolt.removeAttribute("hidden"))
const hideResults = () => document.querySelectorAll(".result").forEach( bolt => bolt.setAttribute("hidden", true))


const hideHomePage = () =>{ 
  console.log("Hiding Welcome Screen")
  $home.attr("hidden",true)
  $play.unbind("click").attr("hidden",true)
}

// This will show only one page at a time...
const showHelpPage = (pageIndex=0) => {

  const screen = startScreens[pageIndex]
  const $nextButton = nextButtons[pageIndex]

  console.log("Showing Help Page #"+(pageIndex+1) + '/' + startScreens.length )

  // reveal screen then hide homepage if there
  screen.fadeIn("fast","linear",complete=>{
    if (pageIndex === 0){
      hideHomePage()
    }
  })

  $nextButton.delay(450).fadeIn("slow")

  //
  if ($nextButton !== $start)
  {
    $nextButton.on("click", function (event) {
      showHelpPage( pageIndex+1 )
      $nextButton.unbind("click")
    })

  }else{

    // bring game in???
    $start.on("click", function (event) {

      $start.unbind("click")

      // and remove this screen
      screen.fadeOut('fast' )

      console.log("Get Ready!")
      // at some point we start the game
      startGame()
    })
  }
}

/**
 * Show the very first page
 * @param {Boolean} tryToConnectArduino - use the button to start it
 */
const showHomePage = ( tryToConnectArduino=true ) =>{ 
  console.log("Showing Welcome Screen")
  $home.removeAttr("hidden")
  $play.delay(1000).fadeIn()

  if (tryToConnectArduino)
  {
    $play.on("click", function () {

      console.log("Play has been pressed by the user on screen")

      showHelpPage()
      
      // $(".start").on("click", function () {
      //   // start the game!
      //   console.log("Start has been pressed by the user on screen")
      // }).delay(2000).fadeIn()
    })
  }else{
        
    // This is used to allow the Serial Controller to act in place of the Play button
    document.documentElement.addEventListener( "click", e => {

      connectToHardware()
      showHelpPage()
    
    }, { once: true } )

  }
}

/**
 * Reset the game and all the variables so that
 * a clean game can be started
 * @returns {Boolean}
 */
const resetGame = async (quick=false) => {
  
  // put arduino into Attract Mode
  await game.showAttractMode()

  score = 0

  // we clear interval in case one was queued up before
  clearInterval(automaticSelectionInterval)

  if (!quick)
  {
   // reset gui too
    $(".bolt").removeClass("active normal faulty").unbind("click") 
    $(".result").attr("hidden", true).removeClass("tick cross") 
  
    game.resetGame()
    console.log("Resetting Game")
    showHomePage()

  }else{
    console.log("Creating Game")
  }
  return true
}

/**
 * Wait for a user to press either Faulty or Normal (or cancel - reject)
 */
const waitForUserChoice = async( signal, timeAllowance=( 1 * 60 * 1000 )) => new Promise( (resolve,reject)=>{

  const cleanUp = () => {
    $(".btn-normal").unbind("click")
    $(".btn-faulty").unbind("click")
    clearInterval(userChoiceInterval)
  }

  const cancel = (reason) => {
    cleanUp()
    reject(reason)
  }

  if (signal.aborted) 
  {
		cancel(new DOMException('Aborted', EVENT_ABORT_WAITING))
	}

  console.log("Waiting for user to select faulty or normal")
  
  userChoiceInterval = setTimeout(()=>{
    cancel("Timed out - user probably left")
  }, timeAllowance )

  const userSelected = (isFaulty) => {
    console.log("User selected "+(isFaulty ? "Faulty" : "Normal"))
    cleanUp()
    resolve(isFaulty)
  }

  $(".btn-normal").on("click", e => userSelected(false) )
  $(".btn-faulty").on("click", e => userSelected(true) )

  signal.addEventListener('abort', () => {
    // This wait was interupted by the user selecting another bolt
    // before making a decision about the previous bolt
    cancel(new DOMException('User Selected a different bolt before chossing faulty or normal',EVENT_ABORT_WAITING))
  })
})
 

const activateBolt = async ( boltIndex ) => {

  // kill any previous promises!
  controller.abort()

  // create new signal
  controller = new AbortController()

  if (isNaN(boltIndex)){
    throw Error("This is not a boltIndex! : "+boltIndex)
  }

  if (!game.playing)
  {
    console.warn("Bolt Changed even though Game has not started and is locked")
    return
  }

  if (waiting)
  {
    // hmm we are trying to activate a bolt while one is still activating...
    console.log("A different Bolt was selected by the user before a decision was made")
  }

  waiting = true

  // Once a bolt has been activated the user can return to it
  // and reactivate it using the handheld device and change their answer....
  // if it's incorrect (by pressing faulty or normal)

  // we clear the automatic bolt selection interval in case one was queued up before
  clearInterval(automaticSelectionInterval)
 
  const boltNumber = boltIndex + 1
  const boltClassName = ".bolt0" + boltNumber
  const $bolt = $(boltClassName)
  const $result = $(".result", $bolt)
  const currentState = $bolt.attr("class") || ''
  const currentResult = $result.attr("class") || ''
  const currentMode = (currentState.match(/(faulty|normal)/)||[])[0]
  const currentChoice = (currentResult.match(/(tick|cross)/)||[])[0]

  // remove all other active classes
  $(".bolt.active").removeClass("active") 
 
  // now add to the newly active one
  $bolt.removeClass("normal faulty").addClass("active")

  // TODO: Add video player here
  // play video on the front end (possible 4 faulty videos 8 normal video)
  // console.log("Bolt previously had ["+currentState+"] -> "+currentMode)
  console.log("Playing video file for user to guess if Bolt "+boltClassName+" is faulty or not")

  // Pause if we would like one :)
  // await new Promise(resolve => setTimeout(resolve, 200 ))
  
  // The user decides if it is faulty or normal by pressing the front end buttons
  // The user now decides if it is faulty or normal by pressing the front end buttons
  // wait for faulty or none faulty buttons
  try{

    const userThinksItIsFaulty = await waitForUserChoice( controller.signal )
    
    // now check the answer is correct
    const wasUserCorrect = await game.setUserAnswer(boltIndex, userThinksItIsFaulty)
    console.log("User answered correctly? :", wasUserCorrect )
   
    if (wasUserCorrect)
    {
      score++
    }

    // This correct or incorrect score (x or tick) is registered but only 
    // revealed by pressing the check button
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

    if ( error.name === EVENT_ABORT_WAITING)
    {
      // FIXME: If this bolt had a previous state, revert it...
      // ignore this event - just means the previous promise was cancelled
      // and we don't want to use the status of it anywhere as we consider it
      // out of date
      if (currentMode && currentChoice)
      {
        console.log("Reverting to previous known state ", currentMode, currentChoice )
        $bolt.addClass(currentMode)
        $result.addClass(currentChoice)
      }else{
        console.log(error.message)
      }
      
    }else{
      // timeout 
      endGame()
    }
  }
  waiting = false
}


// End the game (after timeout)
const endGame = async () => {
  console.log("Ending game prematureely\n")
  await resetGame()
}

const pickRandomBolt = async () => {
  // automaticallyShowFirstBolt
  return await activateBolt( Math.round(Math.random() * 8) )
}

const startGame = async () => {

  timeStarted = Date.now()
      
  // Ensure we always start on the HomePage
  hideHelpScreens()

  $(".bolt").on("click", function (event) {
    const boltIndex = parseInt( event.target.className.match(/(-\d+|\d+)(,\d+)*(\.\d+)*/g)  ) - 1
    activateBolt(boltIndex)
  })

  // auto mode
  if (automaticallyShowFirstBolt)
  {
    console.log("Couldn't connect to Arduino : faking bolt selections")
    // go into fake mode...
    game.startGame()
    console.log("Starting Game...")
    pickRandomBolt()
  }
  
  console.log( connected ? "Arduino Game Started at" : "Test Game Started at",  new Date(timeStarted), `on port ${PORT}`)
 
  $(".game-base").removeAttr("hidden").fadeIn()
}


// Start here ----- 

// game play interactions
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
  if (game.playing && isNumber(event.key))
  {
    activateBolt( parseInt(event.key) - 1 )
  }
})

// Ensure we always start on the HomePage
hideHelpScreens()

// Game Begins
resetGame( true )

// fake home page for first click only if not in Electron!
showHomePage( isElectron() ? true : false )


// DEBUGGING - THIS CAN BE REMOVED!
// ------------------------- >8 -----------------------

if ( new URLSearchParams(window.location.search).has("test") )
{
  const tests = document.getElementById("tests")
  const buttons = tests.querySelectorAll("button")

  // before any button ensure we are connected to arduino!
  
  buttons.forEach( button => 
    button.addEventListener("click", async (event) => {
    const command =  button.getAttribute("data-command")
    const args = (button.getAttribute("data-arguments") || '').split(", ").filter( a => a.length > 0 )
    const method = game[command]
    if ( !game.initialised || !game.isArduinoConnected() )
    {
      console.log("Arduino is *not* connected yet - please inititalise connection first" )
    }else{
        console.log("TEST Arduino Command",{command,args})
        await method.apply(game,args)
    }
    // await game.showAttractMode()
    // await game.turnOffAllLEDs()
    // await arduino.illuminateLED( boltIndex, LED_STATE_FLASHING )
  }))
  tests.removeAttribute("hidden")
}
