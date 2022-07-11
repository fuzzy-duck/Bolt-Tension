import {isElectron} from './platform.js'
import * as Settings from './settings.js'
import BoltGame, {
  EVENT_BOLT_ACTIVATED, EVENT_ALL_BOLTS_COMPLETED, EVENT_GAME_COMPLETED, EVENT_BOLT_EVALUATED
} from './BoltGame.js'

import BoltManager, {
  EVENT_BOLT_SELECTED,
  LED_STATE_UNKNOWN,
  LED_STATE_FLASHING,
  LED_STATE_WHITE,
  LED_STATE_GREEN,
  LED_STATE_RED,
} from './BoltManager.js'

import {
  getWorkingVideo, 
  getFaultyVideo
} from './videos.js'

const EVENT_ABORT_WAITING = "abort-waiting"

// determine what this is running on and work out the
// port from URL if specified otherwise use default
const PORT = new URLSearchParams(window.location.search).get("port") || (isElectron() ? 1337 : 5555)

const isSlave = new URLSearchParams(window.location.search).has("slave") || false

let connected = false
let score = 0
let automaticSelectionInterval = -1
let timeStarted = -1
let automaticallyShowFirstBolt = true
let waiting = false
let userChoiceInterval = -1
let controller = new AbortController()

const game = new BoltGame( PORT, isSlave )

const $home = $(".home")
const $play = $(".play")
const $start = $(".start")
const $wellDone = $(".well-done")

const nextButtons = [ $(".next01"), $(".next02"), $(".next03"), $start ]
const startScreens = [ $(".htp01"), $(".htp02"), $(".htp03"), $(".htp04") ]
const video = document.querySelector("video.bolt-fault-check-video")
const source = video.querySelector("source")

// FIXME: This is janky
const fadeOut = (element) => {
  element.classList.toggle('fade-out', true)
}

const isNumber = value => !isNaN( parseInt(value) )
	
const connectToExternalData = async () => {

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
    console.log("Attempting to connect to", isSlave ? "WebSockets" : "Arduino..." )
    if (!isSlave) {console.warn("Accept the prompt if requested please!")}
    connected = await game.initialise()
    return connected
  }
}



const hideHelpScreens = () => startScreens.forEach( $screen => $screen.fadeOut(0) )

// FIXME: Not very performant way of handling this...
const showResults = () => document.querySelectorAll(".result").forEach( bolt => bolt.removeAttribute("hidden"))
const hideResults = () => document.querySelectorAll(".result").forEach( bolt => bolt.setAttribute("hidden", true))

const showWellDoneScreen = () => {
  $wellDone.fadeIn()
  $wellDone.on("click", function(){
    $wellDone.unbind()
    $wellDone.fadeOut()
    resetGame()
  })
}

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

      connectToExternalData()
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
  
  // stop waiting for bolts
  // game.stopMonitoringBolts()

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
    video.pause()
  
  }else{
    console.log("Creating Game")
  }
  video.setAttribute("hidden", true)
  return true
}

/**
 * set the onscreen video to either faulty or not
 * @param {*} isFaulty 
 */
const setVideo = ( isFaulty=false ) => {
 // find video element and change source
  const videoSource = isFaulty ?  getFaultyVideo() : getWorkingVideo()
  source.setAttribute( "src", "videos/" + videoSource)
  //source.setAttribute( "data-faulty", isFaulty)
  try{

  //   video.addEventListener('loadeddata', function() {
  //    
  //  }, false)
    video.onloadeddata = () => {
      video.play()
    }
    video.load()
    video.removeAttribute("hidden")
    

  }catch(error){

    console.warn("Video playback was interupted by load", error)
  }
 
  return videoSource
}

/**
 * Wait for a user to press either Faulty or Normal (or cancel - reject)
 */
const waitForUserChoice = async( signal, timeAllowance=60000) => new Promise( (resolve,reject)=>{

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
 

const pauseUntilBoltSelectedOrTimeout = async ( timeOut=Settings.TIME_BETWEEN_BOLTS ) => {
  
  // we could await this but want is async
  // const arduinoState = this.arduino.waitForUserToSelectBolt()
 

  await game.monitorForBolts()
}

const activateBolt = async ( boltIndex ) => {

  // kill any previous promises!
  controller.abort()

  if (isNaN(boltIndex)){
    throw Error("This is not a boltIndex! : "+boltIndex)
  }

  if (!game.playing)
  {
    console.warn("Bolt Changed even though Game has not started and is locked")
    return
  }

  // create new signal
  controller = new AbortController()

  if (waiting)
  {
    // hmm we are trying to activate a bolt while one is still activating...
    console.log("A different Bolt was selected by the user before a decision was made")
  }

  waiting = true

  // we clear the automatic bolt selection interval in case one was queued up before
  clearInterval(automaticSelectionInterval)

  // we also synchronously await for user to select a bolt
  // NB. this will get interupted when we send out data
 // const arduinoState = game.waitForUserToSelectBolt()
 
  const boltNumber = boltIndex + 1
  const boltClassName = ".bolt0" + boltNumber
  const $bolt = $(boltClassName)
  const $result = $(".result", $bolt)
  const currentState = $bolt.attr("class") || ''
  const currentResult = $result.attr("class") || ''
   
  // Once a bolt has been activated the user can return to it
  // and reactivate it using the handheld device and change their answer....
  // if it's incorrect (by pressing faulty or normal)
  const currentMode = (currentState.match(/(faulty|normal)/)||[])[0]
  const currentChoice = (currentResult.match(/(tick|cross)/)||[])[0]

  // remove all other active classes
  $(".bolt.active").removeClass("active") 
 
  // now add to the newly active one
  $bolt.removeClass("normal faulty").addClass("active")

  // play video on the front end (possible 4 faulty videos 8 normal video)
  // console.log("Bolt previously had ["+currentState+"] -> "+currentMode)
  const video = setVideo( game.isBoltFaulty(boltIndex) )
  console.log("Playing video file for user to guess if Bolt "+boltClassName+" is faulty or not", video )
  
  // Pause if we would like one :)
  // await new Promise(resolve => setTimeout(resolve, 200 ))

  // activate the LED so that it indicates which bolt is active
  // by setting it to flashing mode
  try{
    // illuminate it in whichever style we want it
    await game.illuminateLED( boltIndex, LED_STATE_FLASHING )
  }catch(error){
      console.warn("ISSUE: Couldn't connect to Arduino to illuminate light "+boltIndex+" to " + convertLEDStatus(LEDStatus) )
  }

  // The user decides if it is faulty or normal by pressing the front end buttons
  // The user now decides if it is faulty or normal by pressing the front end buttons
  // wait for faulty or none faulty buttons
  try{

    // wait for user to select an answer
    const userThinksItIsFaulty = await waitForUserChoice( controller.signal, Settings.TIME_DURATION_BEFORE_WE_CONSIDER_USER_LEFT )
    
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
      // After pressing faulty or normal another bolt
      // is randomised and the process continues that is 
      // UNLESS the user hasn't interacted with the arduino
      // await pauseUntilBoltSelectedOrTimeout()

      if (Settings.AUTOMATICALLY_SELECT_NEXT_BOLT)
      {
        automaticSelectionInterval = setTimeout( ()=>{ 
          const nextUnplayedBolt = game.getRandomBoltIndexWithNoSelection()
          activateBolt( nextUnplayedBolt )
        }, Settings.TIME_BETWEEN_BOLTS )
      }
     
    }else{
      // WHAT TO DO HERE! 
      console.log("Answers collected!", game.areAllAnswersCorrect() ? " - all bolts correctly labelled!" : "some bolts are wrong!\nUse the check button to see which ones" )
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
        console.log("Reverting to previous known state ", {currentMode, currentChoice} )
        $bolt.addClass(currentMode)
        $result.addClass(currentChoice)
        await game.illuminateLED( boltIndex, currentMode === "faulty" ? LED_STATE_RED : LED_STATE_GREEN )

      }else{

        // turn "off" the light (turn it back to white)
        console.log("Turning off the light as deselected without result", {currentMode, currentChoice} )
        // NB. Reset state is white!
        // await game.illuminateLED( boltIndex, LED_STATE_OFF )
        await game.illuminateLED( boltIndex, LED_STATE_WHITE )
        console.log(error.message)
      }
      
    }else{

      // timeout ?
      console.log("Fatal error causing me to endgame : ", error )
      endGame()
    }
  }
  waiting = false
}


// End the game (after timeout)
const endGame = async () => {
  console.warn("Ending game prematurely\n")
  await resetGame()
}

const pickRandomBolt = async (quantity=8) => {
  return await activateBolt( Math.floor(Math.random() * quantity) )
}

const startGame = async ( copyMode=false ) => {

  timeStarted = Date.now()
  
  console.log( copyMode ? "[SLAVE]:Jumping straight into game play" : "[MASTER] Game start")
      
  // Ensure we always start on the HomePage
  hideHelpScreens()

  if (Settings.ALLOW_ONSCREEN_BOLTS_TO_SELECT && !copyMode)
  {
    // game.monitorBolts()
    $(".bolt").on("click", function (event) {
      const boltIndex = parseInt( event.target.className.match(/(-\d+|\d+)(,\d+)*(\.\d+)*/g)  ) - 1
      activateBolt(boltIndex)
    })
  }

  game.startGame()

  // allow user to connect to the bolts via magnet
  await pauseUntilBoltSelectedOrTimeout()

  // auto mode
  if (!copyMode && automaticallyShowFirstBolt)
  {
    console.log("Picking random bolt selections due to setting automaticallyShowFirstBolt=true")
    // go into auto bolt selection mode
    await pickRandomBolt()
  }
  
  if (copyMode)
  {
    console.log( "Copycat mode",  new Date(timeStarted), `on port ${PORT}`)
  }else{
    console.log( connected ? "Arduino Game Started at" : "Test Game Started at",  new Date(timeStarted), `on port ${PORT}`)
  }
  
  $(".game-base").removeAttr("hidden").fadeIn()
}


// Start here ----- 

// game play interactions
// FIXME: Use dod 
$(".btn-check").on("mousedown", ()=>{

  showResults()
  const undoShowResults = () =>{
    hideResults()
    document.removeEventListener("mouseup", undoShowResults )
  }
  document.addEventListener("mouseup", undoShowResults, true )
 } )


// Watch for the user bringing the wand to a select a bolt
game.on( EVENT_BOLT_ACTIVATED, (boltIndex) => {
  // The user used the handheld device to select a bolt 
  console.log("Bolt activated by user", boltIndex)
  activateBolt(boltIndex)
})

// User has interacted with all bolts but there are still issues
game.on( EVENT_ALL_BOLTS_COMPLETED, () => {
  console.log("Not all of your answers wre correct!")
})

// User has clicked one of the buttons
game.on( EVENT_BOLT_EVALUATED, (result) => {
  console.log("User evaluated bolt", result)
})

// User has got all bolts correct!
game.on( EVENT_GAME_COMPLETED, ({timeElapsed}) => {

  console.log("Game Over! Time taken to complete ", timeElapsed, "ms")
  // Once all answers are correct a signal is sent via websockets to the reward screen which marks it as complete
  // show congratulations screen
  showWellDoneScreen()
})


// Ensure we always start on the HomePage
hideHelpScreens()

// Game Begins
resetGame( true )




// fake home page for first click only if not in Electron!
if (isSlave)
{
  // only connect to websockets
  connectToExternalData()
  // jump straight into gameplay
  startGame( true )
  // and force hide the help screens
  hideHelpScreens()
  hideHomePage()
  // now wait for websockets to guide the game...

}else{

  showHomePage( isElectron() ? true : false )
}



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
        alert("Arduino is *not* connected yet - please inititalise connection first" )
      }else{
        console.log("TEST Arduino Command",{command,args})
        await method.apply(game,args)
      }
      // await game.showAttractMode()
      // await game.turnOffAllLEDs()
      // await game.illuminateLED( boltIndex, LED_STATE_FLASHING )
    }
  ))
  tests.removeAttribute("hidden")
    
  // Allow the keyboard to select them
  window.addEventListener('keydown', event => {
    if (game.playing && isNumber(event.key))
    {
      activateBolt( parseInt(event.key) - 1 )
    }
  })
}
