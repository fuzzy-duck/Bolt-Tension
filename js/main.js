import BoltGame, {EVENT_BOLT_ACTIVATED, EVENT_ALL_BOLTS_COMPLETED, EVENT_GAME_COMPLETED} from './BoltGame.js'

let score = 0
let interval = -1
let timeOutInterval = -1
let timeStarted = -1
const game = new BoltGame()

// FIXME: Not very performant way of handling this...
const showResults = () => {
  document.querySelectorAll(".result").forEach( bolt => bolt.removeAttribute("hidden"))
}

const hideResults = () => {
  document.querySelectorAll(".result").forEach( bolt => bolt.setAttribute("hidden", true))
}


const resetGame = async () => {
  console.log("Restarting Game")
  score = 0
  // reset gui too
  document.querySelectorAll(".bolt").forEach( bolt =>{ 
    bolt.classList.remove("active", "faulty", "normal") 
  })

  document.querySelectorAll(".result").forEach( bolt =>{ 
    bolt.setAttribute("hidden", true)
    bolt.classList.remove("tick", "cross") 
  })

  game.restartGame()
  await activateBolt( Math.round(Math.random() * 8) )
  return true
}


const waitForUserChoice = async() => new Promise( (resolve,reject)=>{
  console.log("Waiting for user to select faulty or normal")
  const end = (isFaulty) => {
    $(".btn-normal").unbind()
    $(".btn-faulty").unbind()
    resolve(isFaulty)
  }

  $(".btn-normal").on("click", function () {
    end(false)
  })
  
  $(".btn-faulty").on("click", function () {
    end(true)
  })
})
 
$(".btn-check").on("mousedown", showResults )
$(".btn-check").on("mouseup", hideResults )



const activateBolt = async ( boltIndex ) => {

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
  clearInterval(interval)
 
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
  // await new Promise(resolve => setTimeout(resolve, 200 ))
  
  // TODO: The user decides if it is faulty or normal by pressing the front end buttons
  // The user now decides if it is faulty or normal by pressing the front end buttons
  // wait for faulty or none faulty buttons

  // This correct or incorrect score (x or tick) is registered but only 
  // revealed by pressing the check button
  const userThinksItIsFaulty = await waitForUserChoice()
  console.log("User answered is Faulty :", userThinksItIsFaulty )

  // now check the answer
  const wasUserCorrect = await game.setUserAnswer(boltIndex, userThinksItIsFaulty)
  if (wasUserCorrect){
    // score++
  }else{

  }

  const choiceClass = wasUserCorrect ? "tick" : "cross"
  $result.removeClass("tick cross").addClass(choiceClass)

  const resultClass = userThinksItIsFaulty ? "faulty" :  "normal"
  $bolt.removeClass("faulty normal").addClass(resultClass)

  if ( !game.hasGameCompleted() )
  {
    // After pressing faulty or normal another bolt is randomised and the process continues 
    interval = setTimeout( ()=>{ 
      const nextUnplayedBolt = game.getRandomBoltIndexWithNoSelection()
      activateBolt( nextUnplayedBolt )
    }, 800 )

  }else{
    
    console.log("Game complete?", game )

  }
}


// Watch for the user bringing the wand to a select a bolt
game.on( EVENT_BOLT_ACTIVATED, async (boltIndex) => {
  // The user used the handheld device to select a bolt 
  console.log("Bolt activated by user", boltIndex)
  await activateBolt(boltIndex)
  
})

game.on( EVENT_ALL_BOLTS_COMPLETED, () => {
  console.log("Not all of your answers wre correct!")
})

game.on( EVENT_GAME_COMPLETED, () => {
  const timeElapsed = Date.now() - timeStarted
  console.log("Game Over!", timeElapsed)
  
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

const onTimeOut = async () => {
  console.log("Ten minute timeout of inactivity - resettting...")
  await resetGame()
}

const restartTimeout = () => {
  clearInterval(timeOutInterval)
  timeOutInterval = setTimeout( onTimeOut, 1000 * 60 * 2 )
}

const start = async () => {

  console.log("Attempting to connect to Arduino...")
  console.log("Accept the prompt if requested please!")

  timeStarted = Date.now()
  restartTimeout()

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
    game.startGame()
    await activateBolt( Math.round(Math.random() * 8) )
  }
}

document.documentElement.addEventListener( "click", start )

window.addEventListener('keydown', event => {
  const isNumber = !isNaN( parseInt(event.key) )
	if (isNumber){
    activateBolt( parseInt(event.key) )
  }
})

//set initial screens
$(".play").delay(1000).fadeIn()

$(".play").on("click", function () {
  $(".howtoplay").fadeIn()
  $(".start").delay(2000).fadeIn()
})

$(".start").on("click", function () {
  $(".game-base").fadeIn()
})

$(".bolt").on("click", function (event) {
  const boltIndex =  parseInt( event.target.className.match(/(-\d+|\d+)(,\d+)*(\.\d+)*/g)  ) - 1
  activateBolt(boltIndex)
})