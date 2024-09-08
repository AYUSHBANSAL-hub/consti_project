from datetime import datetime
import calendar
import re

def extract_date_conditions(time_json):
    """Extract the start and end dates from the time_json string got from AI response"""

    current_year = datetime.now().year

    date_pat = r'"date": \[(.*)\]'
    time_pat = r'"time": \[(.*)\]'
    period_pat = r'"period": \[(.*)\]'
    freq_pat = r'"frequency": \[(.*)\]'
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    year_pat = r'\d{4}'
    dates = re.search(date_pat, time_json)
    time = re.search(time_pat, time_json)
    period = re.search(period_pat, time_json)
    freq = re.search(freq_pat, time_json)
    start_date = end_date = None
    if dates:
        dates = dates.group(1)
        dates = dates.split(",")
        dates = [d.strip().strip('"') for d in dates]
        print(dates)
        dates = [datetime.strptime(date, r'%Y-%m-%d') for date in dates]
        print(dates)
        start_date = min(dates)
        end_date = max(dates)
    if time:
        pass
    if not start_date or not end_date:
        if period:
            period = period.group(1)
            period = period.split(",")
            if not len(period)> 2:   
                period = [p.strip().strip('"').strip() for p in period]
            
            # Handle the case where only one item is provided
            if len(period) == 1:
                # Parse the single date (either with month and year, or just month)
                try:
                    date = datetime.strptime(period[0], "%B %Y")
                except ValueError:
                    date = datetime.strptime(period[0], "%B")
                    date = date.replace(year=current_year)  # Default to the current year

                # Start date is the 1st of the month
                start_date_p = date.replace(day=1)
                # End date is the last day of the month
                end_date_p = date.replace(day=calendar.monthrange(date.year, date.month)[1])

            # Handle the case where two items are provided
            elif len(period) == 2:
                # Parse the first item as the start date
                try:
                    start_date_p = datetime.strptime(period[0], "%B %Y")
                except ValueError:
                    start_date_p = datetime.strptime(period[0], "%B")
                    start_date_p = start_date_p.replace(year=current_year)  # Default to the current year
                start_date_p = start_date_p.replace(day=1)  # Set the day as 1

                # Parse the second item as the end date
                try:
                    end_date_p = datetime.strptime(period[1], "%B %Y")
                except ValueError:
                    end_date_p = datetime.strptime(period[1], "%B")
                    end_date_p = end_date_p.replace(year=current_year)  # Default to the current year
                # Set the end date as the last day of the month
                end_date_p = end_date_p.replace(day=calendar.monthrange(end_date_p.year, end_date_p.month)[1])
            if start_date:
                start_date = min(start_date_p, start_date)
            else:
                start_date = start_date_p
            if end_date:
                end_date = max(end_date_p, end_date)
            else:
                end_date = end_date_p
            
    return start_date, end_date
