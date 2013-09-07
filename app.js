
// The magical global state
var state;

// Wire up the events and get ready
$(document).ready(function() {
	// Setup the initial state by trying to read some from local storage
	state = readState();

	// If this is the first time ever, show help
	if ( (state !== null) && ("goal" in state) ) {
  	// Render now ...
  	render();
  	// ... and re-render every minute
  	setInterval(render, 1000 * 60);
  }

	// Handle the main button which marks the flip between states
	$("#eat").click(function(e) {
		if (fasting()) {
			state.period = "eating";  // switch to eating
			state.lastFastingTime = state.time.clone();
      showFastingResults(); // and then fade away in a bit
		} else {
			state.period = "fasting";	// switch to fasting
			state.lastEatingTime = state.time.clone();
      clearAlert();
		}
		state.time = nearestHour(); // round up or down on input only

		saveState();

		render();
	});

  // Handle the main button which marks the flip between states
  $("#firstfast").click(function(e) {
    var nHour = nearestHour(); // round up or down on input only

    // setup the defaults
    state = {
      period: "fasting",
      goal: 16,
      time: nHour,
      lastFastingTime: nHour
    }

    saveState();

    render();
  });

	// Handle the settings / debug button
	$("#settings").click(function(e) {
		state.time = smartTime($("#settings-time").val());
		state.goal = parseInt($("#settings-goal").val())

		console.log("Manually settings the state to: ");
		console.log("Time: ", state.time);
		console.log("Goal: ", state.goal);

		saveState();

		render();
	});

  // If you tap on the header, get rid of the bar
  $("#header").click(function(e) {
    hideAddressBar();
  });

});

//
// Time related functionality
//

// The ideal consuming hours are the inverse of your fasting goal time
// If you stick to that amount, chances are it will be easier to stick to a rhythm
function idealNumberOfEatingHoursPerDay() {
	return 24 - state.goal;
}

// The number of hours that the user has been in the given state (fasting / consumption)
// e.g. the user started fasting at 8pm, and it is now 10am, this returns 14
function hoursInThisState() {
  // "If the moment is later than the moment you are passing to diff, the return value will be negative."
  // e.g. $future.diff($past) = positive amount
  //      $past.diff($future) = negative amount
  return now().diff(state.time, 'hours');
}

// Sneak a peak at state.now to see if in debug mode the notion of "now" is hijacked
function now() {
  // Defensive as this is called very early on
  if ( (state !== null) && ("now" in state) ) {
    return state.now;
  } else {
    return moment();
  }
}

// Take a Number of hours and return the correct string to handle a couple of issues:
// - "2 hours" vs. "1 hour" (plural)
// - When getting negative hours (getting past the goal for example) convert to positive as the UI will reflect the difference
//   e.g. -1 => 1 hour past your goal!
function stringifyHours(hours) {
  return stringifyNumber(hours, "hour");
}
function stringifyMinutes(minutes) {
  return stringifyNumber(minutes, "minute");
}
function stringifyNumber(number, time) {
  number = Math.abs(number); // make sure we are positive only
  var returnTime = number + " " + time;
  if (number != 1) {
    returnTime = returnTime + "s";
  }
  return returnTime;
}


// Given a time, find the nearest half an hour and return that time
// If the hour has more than 30 minutes, add 30 and then it is save to get
function nearestHour(time) {
	// If no time has been passed in, use the current moment
	if (typeof time !== "object") time = now();

	if (time.minute() > 30) {
		time.add(31, 'minutes');
	}
	return time.clone().startOf("hour");
}

// Return the number of hours between the last fasting time and the given time
function numberOfFastingHours(time) {
	// If no time has been passed in, use the current moment
	if (typeof time !== "object") time = now();

  // $future.diff($past) = positive amount
	return time.diff(state.lastFastingTime, 'hours');
}

// Given a human passed in time, get a real date time back
// 6pm y[esterday]: pm means "add 12 to the number"
// 4[am]
function smartTime(humanTime) {
  var theTime = moment().startOf('hour'); // start with the top of the hour

  // take out all of the cruft
  var theHour = parseInt(humanTime);

  // add on 12 hours if "pm" is matched
  var pmOffset = (humanTime.indexOf('pm') > 0) ? 12 : 0;

  theTime.hours(theHour + pmOffset);

  // if yesterday, knock it back a day
  if (humanTime.indexOf('y') > 0) {
    theTime.subtract(1, 'day');
  }

  return theTime;
}


//
// Rendering
//

function render() {
  $("#info").show();
  $("#welcome").hide();

	if (fasting()) {
		renderFastingState();
	} else {
		renderEatingState();
	}

  hideAddressBar(); // ah the good ole iOS address bar hack
}

function renderEatingState() {
  // The time 8 (well, $IDEAL) hours from when eating started
  // e.g. if eating started at 6pm then ideal fast start time = 2am
  //      and then the number of hours until that time (if now==8pm) is 6
	var idealFastTime = state.time.clone().add(idealNumberOfEatingHoursPerDay(), "hours");
	var idealHours = idealFastTime.diff(now(), 'hour');

	$("#mode").html("You are eating");

	$("#laststatus").html("your first meal was at <strong>" + state.time.format('ha') + "</strong>");

  $("#hourmarker").html(stringifyHours(idealHours));

  $("#eat").html("Start Fasting");

  // if the hours is negative it means you have been eating for awhile
  if (idealHours < 0) {
    renderCurrentProgressIndicator("yellow");
    $("#timeleft").html("past your fasting start time at <strong>" + idealFastTime.format('ha') + "</strong>");

  // else you are still in a good eating time
  } else {
    // "until your ideal start time @$IDEALFROMNOW"
    $("#timeleft").html("until you should start fasting at <strong>" + idealFastTime.format('ha') + "</strong>");
  }
}

function renderFastingState() {
	// The time that is $GOAL hours from when fasting began
	// e.g if the goal is 16 hours, and fasting began at 6pm,
	//     then the time will represent the next day at 10am.
	var goalEndOfFastTime = state.time.clone().add(state.goal, "hours");

	// The number of hours from $NOW to the $GOAL time
	// e.g. if it is 9am the next day, the difference will be 1
	var hoursUntilGoalEndOfFastTime = goalEndOfFastTime.diff(now(), 'hour');
  var hoursFasting = hoursInThisState();

  // If the user has been fasting for a bit, tell them by how much
  if (hoursFasting > 0) {
    $("#mode").html(stringifyHours(hoursFasting) + " fasting");
  } else {
    $("#mode").html("You are fasting");
  }

  $("#laststatus").html("your last meal was at <strong>" + state.time.format('ha') + "</strong>");

  $("#hourmarker").html(stringifyHours(hoursUntilGoalEndOfFastTime));

  $("#eat").html("Start Eating");

	// if the hours is negative it means you are past your goal!
	if (hoursUntilGoalEndOfFastTime < 0) {
    renderCurrentProgressIndicator("green");
		$("#timeleft").html("past your <em>" + state.goal + " hours</em> goal at <strong>" + goalEndOfFastTime.format('ha') + "</strong>");

  // if the hours difference are "0" then you are close and we need to customize things a bit
  } else if (hoursUntilGoalEndOfFastTime == 0) {
    // if the number of minutes are negative that means you are actually ahead of the goal
    // e.g. if the goal is 11am and it is 11:42, this will return -42
    var minutesUntilGoalEndOfFastTime = goalEndOfFastTime.diff(now(), 'minutes');
    $("#hourmarker").html(stringifyMinutes(minutesUntilGoalEndOfFastTime));
    if (minutesUntilGoalEndOfFastTime < 0) {
      renderCurrentProgressIndicator("green");
      $("#timeleft").html("past your <em>" + state.goal + " hours</em> goal at <strong>" + goalEndOfFastTime.format('ha') + "</strong>");
    } else {
      renderCurrentProgressIndicator("yellow");
      $("#timeleft").html("away from your <em>" + state.goal + " hours</em> goal at <strong>" + goalEndOfFastTime.format('ha') + "</strong>");
    }

	// else there is time left to hit your goal
	} else {
		// "to hit your $GOAL goal @ $GOALTIME"
		$("#timeleft").html("to hit your <em>" + state.goal + " hours</em> goal at <strong>" + goalEndOfFastTime.format('ha') + "</strong>");

		// Yellow: you are within 8 hours of your goal
		if (hoursUntilGoalEndOfFastTime < idealNumberOfEatingHoursPerDay()) {
      renderCurrentProgressIndicator("yellow");
		// Red: you are more than 8 hours out from the goal
		} else {
      renderCurrentProgressIndicator("red");
		}
	}
}

// How are things going today?
// When setting the vibe to green, yellow, or red, also make sure that
// the history bar has a sneak peak on today too

var hexBackgroundColorFor = {
  "green": "#5cb85c",
  "yellow": "#f0ad4e",
  "red": "#d9534f"
};

function renderCurrentProgressIndicator(color) {
  clearClasses($("#hourmarker"), ["green", "yellow", "red"]);
  $("#hourmarker").addClass(color);
  $("#history").css('background-color', hexBackgroundColorFor[color] || "#000000");
}

// If a fast was just completed, give some info to the user
function showFastingResults() {
	if (!fasting()) {
    var rightNow = now(); // capture the time once
    var fastingStarted = state.lastFastingTime.format('ha');
    var fastingEnded = rightNow.format('ha'); // assumption that this comes right after the state change
		var fastingHours = numberOfFastingHours(rightNow);

		var alertClass, extraMessage;
		if (fastingHours > state.goal) {
			alertClass = "alert-success";
			extraMessage = "<strong>Nicely done</strong>.";
		} else if (fastingHours > idealNumberOfEatingHoursPerDay()) {
			alertClass = "alert-warning";
			extraMessage = "Not too shabby.";
		} else {
			alertClass = "alert-danger";
			extraMessage = "Tomorrow comes quickly.";
		}

		$("#alert").html("You fasted for <strong>" + fastingHours + " hours</strong> (<em>" + fastingStarted + " - " + fastingEnded + "</em>).<br>" + extraMessage);

		clearClasses($("#alert"), ["alert-success", "alert-info", "alert-warning", "alert-danger"])
		$("#alert").addClass(alertClass);
		$("#alert").show();
		setTimeout(function() {
			$("#alert").hide();
		}, 1000 * 60);
	}
}

function clearAlert() {
  $("#alert").hide();
}

// Hide the URL address bar on iOS
// Also scrolling 21 pixels to hide the history colors
// NOTE: not detecting iOS
function hideAddressBar() {
  setTimeout(function(){
    window.scrollTo(0, 21);
  }, 0);
}

// Given an element nuke any class from the given class names
// e.g. clearClasses($("#hourmarker"), ["green", "yellow", "red"])
function clearClasses(el, classNames) {
	classNames.forEach(function(className) {
		el.removeClass(className);
	});
}

//
// Storage / State Management
//

function fasting() {
  return state.period === "fasting";
}

function saveState() {
	if (localStorageWorks) {
		localStorage.setItem("state", JSON.stringify(state));
	} else {
		window['globalState'] = state;
	}
}

function readState() {
	// NUKE
	// localStorage.removeItem("state");
	// return;

	if (localStorageWorks) {
		var read = JSON.parse(localStorage.getItem("state"));
		if (read != null && "time" in read) {
			read.time = moment(read.time); // convert the time back to a moment object
		}
		return read;
	} else {
		return window['globalState'];
	}
}

// only need to check once
var localStorageWorks = !!function() {
	var test = 't';
  try {
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch(e) {
    return false;
  }
}();


// It is 10am and I am in the fasting state, with my "last meal" time at 7pm yesterday
// The time should say 1 hour to goal
// I hit the button to shift to the eating state
// - Calculate the number of hours between now (10am) and yesterday at 7pm
// - set state.meal == "first"
// - set state.time == now (now == rounded to the nearest hour)
// - change #hourmarker to be (24-$GOAL) hours ("8 hours")
// - change #timeleft to be "until you will start your fast @$IDEALFROMNOW" where $IDEALFROMNOW is $NOW + 8 hours
// - change #laststatus to be "Your first meal was at $NOW"

// If is 7pm and I am in the eating state, with my "fist meal" time at noon
// The time should say "7 hours" (time since I started to eat)
// I hit the button to shift to the fasting state
// - set state.meal == "last"
// - set state.time == now
// - change #hourmarker to be $GOAL hours ("16 hours")
// - change #timeleft to be "to hit your $GOAL goal @ $GOALTIME" where goaltime is $NOW + $GOAL
// - change #laststatus to be "Your last meal was at $NOW" (rounded)
