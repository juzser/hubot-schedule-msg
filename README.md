# hubot-schedule

Inspired by & based on: [hubot-schedule](https://github.com/matsukaz/hubot-schedule)
But I think it's BETTER!

I build this to fit with my rocket.chat, but I guess it will work (with some bugs) on other platform.
ES6 so it's easily to maintenance.

### Features

- Send direct message to someone & me.
- Use dots instead of asterisks in cron pattern to avoid markdown parsing.
- Schedule list only show to author not others, hence you can only see your schedules.
- Free format for date, it's impossible to cover all cases, but some.
- Receive message as chain, so you can use this to do other things with bot (My `hubot-hook` for example)
- Each user has only 500 schedules per one.

And actually... I don't remember all.

**TODO:**
[] Recheck the error handling & error emit.
[x] Bug fixes.

### Installation

Install [hubot-rocketchat-boilerplate](https://github.com/RocketChat/hubot-rocketchat-boilerplate)

Add these packages to dependencies in `package.json`
```
  "cron": "~1.7.0",
  "cron-parser": "~1.0.1",
  "node-schedule": "~1.0.0",
```

Add these packages to devDependencies in `package.json`
```
  "babel-plugin-add-module-exports": "^1.0.2",
  "babel-plugin-transform-object-rest-spread": "^6.26.0",
  "babel-polyfill": "^6.26.0",
  "babel-preset-es2015": "^6.24.1",
  "babel-register": "^6.26.0",
```

Copy `.babelrc` file & `lib` directory in `src` to your hubot boilerplate directory.
Copy all files in `scripts` directory to your hubot scripts directory.
Update your `.env` file if needed.

Restart hubot. Done.

### Usage

```
hubot schedule <@someone|#channel> "<time|cron_pattern>" <message>
hubot schedule list
hubot remove id
```

*Examples:*

```
hubot schedule "9am" Hello World
hubot schedule #general "tomorrow" Hello World
hubot schedule @someone "9:00:10 31/1/2020 +07:00" Full date time format.
hubot schedule me "9:00 31 Jan +7" Shorthand @rocket.cat.
hubot schedule "Monday" Next Monday at 9am.
hubot schedule "4 5 . . ." Use dots instead of asterisks to avoid markdown parsing.
```

### Configuration

Put these options to your hubot's `.env` file

#### HUBOT_SCHEDULE_DEBUG=0
Enable/Disable debug mode, some debug messages will appear.

#### HUBOT_SCHEDULE_CHAIN_RECEIVER=1
Enable/Disable hubot not to process messages sent by hubot-schedule-msg.

#### HUBOT_SCHEDULE_IGNORE_EXTERNAL_CONTROL=0
Enable to deny schedule control from other rooms.

#### HUBOT_SCHEDULE_UTC_OFFSET='+00:00'
This will set default UTC Offset to schedules. If not set, OS timezone's offset would be used.

#### HUBOT_SCHEDULE_EMIT_ERROR=0
Emit the error message using robot.emit (not sending message outside) or send as messages.


### Copyright and license

Copyright 2020 juzser.

Licensed under the **[MIT License](LICENSE)**.
