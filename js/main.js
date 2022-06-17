import BoltGame, {EVENT_BOLT_ACTIVATED, EVENT_ALL_BOLTS_COMPLETED, EVENT_GAME_COMPLETED} from './BoltGame.js'

let connected = false
let score = 0
let automaticSelectionInterval = -1
let timeStarted = -1
let timeOutInterval = -1
let automaticallyShowFirstBolt = true

const TIME_BETWEEN_BOLTS = 800

let userChoiceInterval = -1
let controller = new AbortController()
const game = new BoltGame()

const $play = $(".play")
const $next01 = $(".next01")
const $next02 = $(".next02")
const $next03 = $(".next03")
const $start = $(".start")

// FIXME: Not very performant way of handling this...
const showResults = () => document.querySelectorAll(".result").forEach( bolt => bolt.removeAttribute("hidden"))
const hideResults = () => document.querySelectorAll(".result").forEach( bolt => bolt.setAttribute("hidden", true))

const hideHomePage = () =>{ 
  console.log("Hiding Welcome Screen")
  $('.home').attr("hidden",true)
  $play.fadeOut()
  $play.unbind("click")
  // $(".start").unbind("click")
}

const showHomePage = ( useClick=true ) =>{ 
  console.log("Showing Welcome Screen")
    
  $('.home').removeAttr("hidden")


  $play.delay(1000).fadeIn()
  if (useClick)
  {
    $play.on("click", function () {

      console.log("Play has been pressed by the user on screen")

      $(".htp01").removeAttr("hidden").fadeIn()
      $(".game-base").removeAttr("hidden").fadeIn()

      //startGame()

      // $(".start").on("click", function () {
      //   // start the game!
      //   console.log("Start has been pressed by the user on screen")
      // }).delay(2000).fadeIn()
    })
  }
}

$next01.on("click", function () {
  $(".htp02").removeAttr("hidden").fadeIn()
  console.log("first how to play page")
})

/**
 * Reset the game and all the variables so that
 * a clean game can be started
 * @returns {Boolean}
 */
const resetGame = async (quick=false) => {
  
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
    console.log("Resetting Game")

  }else{
    console.log("Creating Game")

  }
 
  return true
}


/**
 * Wait for a user to press either Faulty or Normal
 */
const waitForUserChoice = async( signal, timeAllowance=( 1 * 60 * 1000 )) => new Promise( (resolve,reject)=>{
  
  if (signal.aborted) {
		reject(new DOMException('Aborted', 'AbortError'))
	}

  console.log("Waiting for user to select faulty or normal")
  
  userChoiceInterval = setTimeout(()=>{
    console.log("User may have left!")
    reject("Timed out - user probably left")
  }, timeAllowance )

  const end = (isFaulty) => {
    $(".btn-normal").unbind("click")
    $(".btn-faulty").unbind("click")
    clearInterval(userChoiceInterval)
    console.log("User selected faulty:"+isFaulty)
    resolve(isFaulty)
  }

  $(".btn-normal").on("click", function () {
    end(false)
  })
  
  $(".btn-faulty").on("click", function () {
    end(true)
  })

  signal.addEventListener('abort', () => {
    reject(new DOMException('Aborted', 'AbortError'))
  })
})
 

let waiting = false
const activateBolt = async ( boltIndex ) => {

  // kill any previous promises!
  controller.abort()

  // create new signal
  controller = new AbortController()

  if (!game.playing){
    console.warn("Bolt Changed even though Game has not started and is locked")
    return
  }

  if (waiting){
    // hmm we are trying to activate a bolt while one is still activating...
    console.log("A different Bolt was selected by the user before a decision was made")
  }

  waiting = true

  // show activity
  clearInterval(userChoiceInterval)

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

    // this needs to be cancellable
    const userThinksItIsFaulty = await waitForUserChoice( controller.signal )
    
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

    if (error.name && error.name === "AbortError")
    {
      // ignore this event - just means the previous promise was cancelled
      // and we don't want to use the status of it anywhere as we consider it
      // out of date
    }else{
      // timeout
      endGame()
    }
  }
  waiting = false
}


// End the game (after timeout)
const endGame = async () => {
  console.log("Ending game prematureely")
  await resetGame()
}

const pickRandomBolt = async () => {
  // automaticallyShowFirstBolt
  return await activateBolt( Math.round(Math.random() * 8) )
}

const startGame = async () => {

  if (connected)
  {
    console.log("Start game")
  
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
    console.log("Attempting to connect to Arduino...")
    console.log("Accept the prompt if requested please!")
  
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
    activateBolt( parseInt(event.key) - 1 )
  }
})

// Game Begins
// This is used to allow the Serial Controller
document.documentElement.addEventListener( "click", startGame, { once: true } )

resetGame( true )
showHomePage( false )

// Game Begins
// resetGame( true )