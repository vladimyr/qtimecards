Qtimecards records grabber
==========================

This utility grabs all records from attend.hotelstouch.com 
for the specified user account. Data is exported to stdout 
in JSON format.

## Installation

```bash    
npm install -g vladimyr/qtimecards
```

## How to use

Invoke in your terminal with credentials for qtimecards.com.
It is not necessary to enter domain part of email because
auto-completion will take care of that.

Additionally you could pass username/email parameter to skip
corresponding prompt via following invocation:
```bash
qtime -u <username_or_email>
```

### Grab all your records as JSON:
```bash  
qtime
```

Grab all your records as JSON with reversed order:
```bash
qtime -s desc
```

### Calculate time stats:
```bash
qtime -t

# which outputs following info:
# Total [7.5 working hrs per day]: <required_time> / <completed_time>
```

If you want to change daily norm pass decimal value as parameter:
```bash
qtime -t 8  # set daily norm to 8hrs
```

### Output latest daily records in table format:
```bash
qtime --table
```

If you want to see more than one day history pass decimal value as
parameter:
```bash
qtime --table 3  # shows records from past 3 days
```

### Add new record:
```bash
qtime --add-record <message>
```
