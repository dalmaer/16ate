// The magical global state
var state;

// Wire up the events and get ready
$(document).ready(function() {
	// Setup the initial state by trying to read some from local storage
	state = readState();

	// If this is the first time ever seed a default state
	if ( (state === null) || (!"goal" in state) ) {
		state = {
			period: "eating", // let's assume you are eating
			goal: 16,         // hours to stay in fasting mode (this is 16ate after all!)
			time: nearestHour().subtract(8, "hours") // set to be 8 hours ago
		}
		saveState();
	}

	// Render now ...
	render();
	// ... and re-render every minute
	setInterval(render, 1000 * 60);

	// Handle the main button which marks the flip between states
	$("#eat").click(function(e) {
		if (inFast()) {
			state.period = "eating";  // switch to eating
			state.lastFastingTime = state.time.clone();
		} else {
			state.period = "fasting";	// switch to fasting
			state.lastEatingTime = state.time.clone();
		}
		state.time = nearestHour();

		saveState();

		render();

		showAlert(); // and then fade away in a bit
	});

	// Handle the settings / debug button
	$("#settings").click(function(e) {
		state.time = moment($("#settings-time").val());
		state.goal = parseInt($("#settings-goal").val())

		console.log("Manually settings the state to: ");
		console.log("Time: ", state.time);
		console.log("Goal: ", state.goal);

		saveState();

		render();
	});

});

// The ideal consuming hours are the inverse of your fasting goal time
// If you stick to that amount, chances are it will be easier to stick to a rhythm
function idealNumberOfEatingHoursPerDay() {
	return 24 - state.goal;
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

function stringifyHours(hours) {
	if (hours == 1) {
		return hours + " hour";
	} else if (hours < 0) {
		return Math.abs(hours) + " hour";
	} else {
		return hours + " hours";
	}
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

function numberOfFastingHours(time) {
	// If no time has been passed in, use the current moment
	if (typeof time !== "object") time = now();

	return state.lastFastingTime.diff(time, 'hours');
}

function inFast() {
	return state.period === "fasting";
}

function render() {
	console.log(Date.now());
	if (inFast()) {
		renderFastingState();
	} else {
		renderEatingState();
	}
}

function renderEatingState() {
	var idealFastTime = state.time.clone().add(idealNumberOfEatingHoursPerDay(), "hours");
	var idealHours = idealFastTime.diff(nearestHour(), 'hour');

	$("#hourmarker").html(stringifyHours(idealHours));
	clearClasses($("#hourmarker"), ["green", "yellow", "red"]);

	$("#mode").html("You are eating");

	$("#laststatus").html("your first meal was at <strong>" + state.time.format('ha') + "</strong>");

	// "$IDEALHOURS hours until your ideal start time @$IDEALFROMNOW"
	$("#timeleft").html("until you should start fasting at <strong>" + idealFastTime.format('ha') + "</strong>");

	$("#eat").html("Start Fasting");
}

function renderFastingState() {
	// The time that is $GOAL hours from when fasting began
	// e.g if the goal is 16 hours, and fasting began at 6pm,
	//     then the time will represent the next day at 10am.
	var goalEndOfFastTime = state.time.clone().add(state.goal, "hours");

	// The number of hours from $NOW to the $GOAL time
	// e.g. if it is 9am the next day, the difference will be 1
	var hoursUntilGoalEndOfFastTime = goalEndOfFastTime.diff(nearestHour(), 'hour');

	$("#mode").html("You are fasting");

	clearClasses($("#hourmarker"), ["green", "yellow", "red"]);

	// if the hours is negative it means you are past your goal!
	if (hoursUntilGoalEndOfFastTime < 0) {
		$("#hourmarker").addClass("green");
		$("#hourmarker").html(stringifyHours(hoursUntilGoalEndOfFastTime));
		$("#timeleft").html("past your <em>" + state.goal + " hours</em> goal at <strong>" + goalEndOfFastTime.format('ha') + "</strong>");

	// else there is time left to hit your goal
	} else {
		$("#hourmarker").html(stringifyHours(hoursUntilGoalEndOfFastTime));

		// "to hit your $GOAL goal @ $GOALTIME"
		$("#timeleft").html("to hit your <em>" + state.goal + " hours</em> goal at <strong>" + goalEndOfFastTime.format('ha') + "</strong>");

		// Yellow: you are within 8 hours of your goal
		if (hoursUntilGoalEndOfFastTime < idealNumberOfEatingHoursPerDay()) {
			$("#hourmarker").addClass("yellow");
		// Red: you are more than 8 hours out from the goal
		} else {
			$("#hourmarker").addClass("red");
		}
	}

	$("#laststatus").html("your last meal was at <strong>" + state.time.format('ha') + "</strong>");

	$("#eat").html("Start Eating");
}



function showAlert() {
	if (!inFast()) {
		var fastingHours = numberOfFastingHours();
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

		$("#alert").html("You fasted for <strong>" + fastingHours + " hours</strong>. " + extraMessage);

		clearClasses($("#alert"), ["alert-success", "alert-info", "alert-warning", "alert-danger"])
		$("#alert").addClass(alertClass);
		$("#alert").show();
		setTimeout(function() {
			$("#alert").hide();
		}, 1000 * 60);
	}
}


// Given an element nuke any class from the given class names
// e.g. clearClasses($("#hourmarker"), ["green", "yellow", "red"])
function clearClasses(el, classNames) {
	classNames.forEach(function(className) {
		el.removeClass(className);
	});
}

// -- storage
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
