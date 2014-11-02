Qtimecards records grabber
==========================

This utility grabs all records from qtimecards.com for the
specified user account. Data is exported to stdout in JSON
format.

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
qgrab -u <username_or_email>
```

### Grab all your records as JSON:
```bash  
qgrab
```

Grab all your records as JSON with reversed order:
```bash
qgrab -s desc
```

### Calculate time stats:
```bash
qgrab -t
```
which outputs following info:
```bash
Total [7.5 working hrs per day]: <required_time> / <completed_time>
```

If you want to change daily norm pass decimal value as parameter:
```bash
qgrab -t 8
```