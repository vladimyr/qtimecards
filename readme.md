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

```bash  
qgrab -u <username> -p <password> [-s <sort method>] 
```

Username and password match qtimecards.com credentials and
both of them are required. Sorting method (asc/desc) is
optional, default is asc.