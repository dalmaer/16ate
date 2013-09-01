16ate is a trivial tool to track intermittant fasting

The key to the technique is having a small window of consecutive hours of consuming whole foods with a large window where you are not (water, coffee, etc though!)

# Fasting states

There are two main states:

- Fasting
- Eating

You will either want to get information:

- "How long until I can eat again?" (shift from fasting to eating)
	- If you are trying to just reach your goal
- "How many hours have I been fasting?" (shift from fasting to eating)
	- Unlike the above, you may be looking to push yourself beyond just the goal
- "How long have I been in the eating phase?" (shift from eating to fasting)
	- You often want to keep to a short eating phase to help you with the next fasting period
- "If I started to fast now, what would my goal next eating time be?"
	- If you want to get a feel for timing. E.g. you have a lunch meeting the next day, so if you start now you can hit that time

Or you will be performing an action to change the state of the application. The only way to do this is to tap on the main button:

- "My First Meal": tap this to shift from fasting to eating
- "My Last Meal": tap this to shift from eating to fasting

## Color

I would like to use color to signal information to the user.

In the *fasting* state the number of hours will change colors:

- Green: you have reached your goal, any additional hours are now gravy!
- Yellow: you are within 8 hours of your goal
- Red: you are more than 8 hours out from the goal

In the *eating* state the number of hours will change colors:

- Green: you are within the (24-$GOAL) number of hours zone (e.g. with a goal of 16, you are within 8 hours of when you started)
- Yellow: you are past the ideal state
- Red: you are 8 hours past the ideal state (stop eating! ;)

## History

## So the tasks

[ ] Wire up the button to let you shift between states and show simple results
[ ] Give you smarter information based on the time
[ ] Self update based on the time
[ ] Store the state away in local storage so it is available on reload
[ ] Store the history as green, yellow, and red markers across the top for the last 7 days
[ ] Be able to set the time versus just using the time when you hit the button
[ ] Get to the nearest half an hour
[ ] Change the color of the hours to give you a signal of where you are
[ ] Be able to change the goal amount
[ ] Be smarter than just rounding to the nearest hour

## More info on fasting