# hubot-schedule

Follow the original doc here: [hubot-schedule](https://github.com/matsukaz/hubot-schedule)

### New Features
- Add `me` or `@user`
- Add `hook` to call Incoming webhook by schedule
- Me or nothing will send direct message instead of channel

### Incoming Webhook schedule
```
hubot schedule hook "2020-01-01 10:00" incoming_webhook_url
```

### TODO
- Refactor
- Map date words to cron pattern
