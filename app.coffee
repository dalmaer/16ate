{ hours, minutes } = require './lib/plural.coffee'

#
# Time related functionality
#

# The ideal consuming hours are the inverse of your fasting goal time
# If you stick to that amount, chances are it will be easier to stick to a rhythm
idealNumberOfEatingHoursPerDay = -> 24 - state.goal

# The number of hours that the user has been in the given state (fasting / consumption)
# e.g. the user started fasting at 8pm, and it is now 10am, this returns 14
# "If the moment is later than the moment you are passing to diff, the return value will be negative."
# e.g. $future.diff($past) = positive amount
#      $past.diff($future) = negative amount
hoursInThisState = -> now().diff state.time, "hours"


# Sneak a peak at state.now to see if in debug mode the notion of "now" is hijacked
now = ->
  # Defensive as this is called very early on
  if (state isnt null) and ("now" of state)
    state.now
  else
    moment()

# Given a time, find the nearest half an hour and return that time
# If the hour has more than 30 minutes, add 30 and then it is save to get
nearestHour = (time) ->
  # If no time has been passed in, use the current moment
  time = now() if typeof time isnt "object"
  time.add 31, "minutes" if time.minute() > 30
  time.clone().startOf "hour"

# Return the number of hours between the last fasting time and the given time
numberOfFastingHours = (time) ->
  time ?= now() # If no time has been passed in, use the current moment

  # $future.diff($past) = positive amount
  time.diff state.lastFastingTime, "hours"

# Given a human passed in time, get a real date time back
# 6pm y[esterday]: pm means "add 12 to the number"
# 4[am]
smartTime = (humanTime) ->
  # take out all of the cruft
  theHour = parseInt(humanTime, 10)
  return undefined if isNaN(theHour)
  theTime = moment().startOf "hour" # start with the top of the hour

  # add on 12 hours if "pm" is matched
  pmOffset = (if (humanTime.indexOf("pm") > 0) then 12 else 0)
  theTime.hours theHour + pmOffset

  # if yesterday, knock it back a day
  theTime.subtract 1, "day" if humanTime.indexOf("y") > 0
  theTime

#
# Rendering
#
render = ->
  $("#info").show()
  $("#welcome").hide()
  hideAddressBar() # ah the good ole iOS address bar hack

  if fasting()
    renderFastingState()
  else
    renderEatingState()

renderEatingState = ->
  # The time 8 (well, $IDEAL) hours from when eating started
  # e.g. if eating started at 6pm then ideal fast start time = 2am
  #      and then the number of hours until that time (if now==8pm) is 6
  idealFastTime = state.time.clone().add(idealNumberOfEatingHoursPerDay(), "hours")
  idealHours = idealFastTime.diff(now(), "hour")
  $("#mode").html "You are eating"
  $("#laststatus").html "your first meal was at <strong>" + state.time.format("ha") + "</strong>"
  $("#timemarker").html hours(idealHours)
  $("#eat").html "Start Fasting"

  # if the hours is negative it means you have been eating for awhile
  if idealHours < 0
    renderCurrentProgressIndicator "yellow"
    $("#timeleft").html "past your fasting start time at <strong>" + idealFastTime.format("ha") + "</strong>"

  # else you are still in a good eating time
  else
    # "until your ideal start time @$IDEALFROMNOW"
    $("#timeleft").html "until you should start fasting at <strong>" + idealFastTime.format("ha") + "</strong>"

renderFastingState = ->
  # The time that is $GOAL hours from when fasting began
  # e.g if the goal is 16 hours, and fasting began at 6pm,
  #     then the time will represent the next day at 10am.
  goalEndOfFastTime = state.time.clone().add(state.goal, "hours")

  # The number of hours from $NOW to the $GOAL time
  # e.g. if it is 9am the next day, the difference will be 1
  hoursUntilGoalEndOfFastTime = goalEndOfFastTime.diff(now(), "hour")
  hoursFasting = hoursInThisState()

  # If the user has been fasting for a bit, tell them by how much
  if hoursFasting > 0
    $("#mode").html hours(hoursFasting) + " fasting"
  else
    $("#mode").html "You are fasting"
  $("#laststatus").html "your last meal was at <strong>" + state.time.format("ha") + "</strong>"
  $("#timemarker").html hours(hoursUntilGoalEndOfFastTime)
  $("#eat").html "Start Eating"

  # if the hours is negative it means you are past your goal!
  if hoursUntilGoalEndOfFastTime < 0
    renderCurrentProgressIndicator "green"
    $("#timeleft").html "past your <em>" + state.goal + " hours</em> goal at <strong>" + goalEndOfFastTime.format("ha") + "</strong>"

  # if the hours difference are "0" then you are close and we need to customize things a bit
  else if hoursUntilGoalEndOfFastTime is 0

    # if the number of minutes are negative that means you are actually ahead of the goal
    # e.g. if the goal is 11am and it is 11:42, this will return -42
    minutesUntilGoalEndOfFastTime = goalEndOfFastTime.diff(now(), "minutes")
    $("#timemarker").html minutes(minutesUntilGoalEndOfFastTime)
    if minutesUntilGoalEndOfFastTime < 0
      renderCurrentProgressIndicator "green"
      $("#timeleft").html "past your <em>" + state.goal + " hours</em> goal at <strong>" + goalEndOfFastTime.format("ha") + "</strong>"
    else
      renderCurrentProgressIndicator "yellow"
      $("#timeleft").html "away from your <em>" + state.goal + " hours</em> goal at <strong>" + goalEndOfFastTime.format("ha") + "</strong>"

  # else there is time left to hit your goal
  else

    # "to hit your $GOAL goal @ $GOALTIME"
    $("#timeleft").html "to hit your <em>" + state.goal + " hours</em> goal at <strong>" + goalEndOfFastTime.format("ha") + "</strong>"

    # Yellow: you are within 8 hours of your goal
    if hoursUntilGoalEndOfFastTime < idealNumberOfEatingHoursPerDay()
      renderCurrentProgressIndicator "yellow"

    # Red: you are more than 8 hours out from the goal
    else
      renderCurrentProgressIndicator "red"

# How are things going today?
# When setting the vibe to green, yellow, or red, also make sure that
# the history bar has a sneak peak on today too
renderCurrentProgressIndicator = (color) ->
  clearClasses $("#timemarker"), ["green", "yellow", "red"]
  $("#timemarker").addClass color
  $("#history").css "background-color", hexBackgroundColorFor[color] or "#000000"

# If a fast was just completed, give some info to the user
showFastingResults = ->
  unless fasting()
    rightNow = now() # capture the time once
    fastingStarted = state.lastFastingTime.format("ha")
    fastingEnded = rightNow.format("ha") # assumption that this comes right after the state change
    fastingHours = numberOfFastingHours(rightNow)
    alertClass = undefined
    extraMessage = undefined

    if fastingHours > state.goal
      alertClass = "alert-success"
      extraMessage = "<strong>Nicely done</strong>."
    else if fastingHours > idealNumberOfEatingHoursPerDay()
      alertClass = "alert-warning"
      extraMessage = "Not too shabby."
    else
      alertClass = "alert-danger"
      extraMessage = "Tomorrow comes quickly."

    $("#alert").html "You fasted for <strong>" + fastingHours + " hours</strong> (<em>" + fastingStarted + " - " + fastingEnded + "</em>).<br>" + extraMessage
    clearClasses $("#alert"), ["alert-success", "alert-info", "alert-warning", "alert-danger"]
    $("#alert").addClass alertClass
    $("#alert").show()
    setTimeout (->
      $("#alert").hide()
    ), 1000 * 60

clearAlert = -> $("#alert").hide()

# Hide the URL address bar on iOS
# Also scrolling 21 pixels to hide the history colors
# NOTE: not detecting iOS
hideAddressBar = ->
  setTimeout (->
    window.scrollTo 0, 21
  ), 0

# Given an element nuke any class from the given class names
# e.g. clearClasses($("#timemarker"), ["green", "yellow", "red"])
clearClasses = (el, classNames) ->
  el.removeClass className for className in classNames

#
# Storage / State Management
#
fasting = -> state.period is "fasting"

saveState = ->
  if localStorageWorks
    localStorage.setItem "state", JSON.stringify(state)
  else
    window.globalState = state

readState = ->
  # NUKE
  # localStorage.removeItem("state");
  # return;
  if localStorageWorks
    read = JSON.parse(localStorage.getItem("state"))
    read.time = moment(read.time) if read isnt null and "time" of read # convert the time back to a moment object
    read
  else
    window.globalState

#
# MAIN
#

state = undefined

hexBackgroundColorFor =
  green: "#5cb85c"
  yellow: "#f0ad4e"
  red: "#d9534f"

# only need to check once
localStorageWorks = do ->
  test = "t"
  try
    localStorage.setItem test, test
    localStorage.removeItem test
    return true
  catch e
    return false

$(document).ready ->
  state = readState()

  if (state isnt null) and ("goal" of state)
    render()
    setInterval render, 1000 * 60
  else
    $("#welcome").show()

  $("#eat").click (e) ->
    if fasting()
      state.period = "eating"
      state.lastFastingTime = state.time.clone()
      showFastingResults()
    else
      state.period = "fasting"
      state.lastEatingTime = state.time.clone()
      clearAlert()

    state.time = nearestHour()
    saveState()
    render()

  $("#firstfast").click (e) ->
    nHour = nearestHour()
    state =
      period: "fasting"
      goal: 16
      time: nHour
      lastFastingTime: nHour

    saveState()
    render()

  $("#settings").click (e) ->
    newTime = smartTime($("#settings-time").val())
    state.time = newTime if newTime
    newGoal = parseInt($("#settings-goal").val(), 10)
    state.goal = newGoal if newGoal
    console.log "The state is: "
    console.log "Time: ", state.time
    console.log "Goal: ", state.goal
    saveState()
    render()

  $("#header").click (e) ->
    hideAddressBar()



