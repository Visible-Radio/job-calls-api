# job-calls-api
Node server for job calls project

Built with Node, Express, Knexs and Postgres.  A separate script handles scraping data and inserting database records.

The API responds to POST requests on the root route and at /members_needed_by_date.
The request body should look like this:

    {
        "start": "2020-12-01",
        "end": "2020-12-31",
        "member_class": ["JW", "AW", "TEC2", "ATEC", "CI"],
        "company": "plan"   
    }

"start" and "end" properties are mandatory and specify the range of dates from which to return records.
"company" property is optional, and omitting it will return results for all companies.
"member_class" property can be omitted to return information on all member classes, or can be an array of specific member classes.

Member class codes are as follows:

    JW: "Journeyman ICI",
    AW: "Apprentice ICI",
    JHW: "Journeyman House",
    AHW: "Apprentice House",
    RJW: "Highrise Journeyman",
    JL: "Journeyman Lineman",
    AL: "Apprentice Lineman",
    TEC1: "Comm Tech 1",
    TEC2: "Comm Tech 2",
    TEC3: "Comm Tech 3",
    TEC4: "Comm Tech 4",
    ATEC: "Apprentice Comm Tech",
    CI: "Cable Installer",
    ETN: "Electronics Technician",
    JCS: "Journeyman Cable Splicer",
    U: "Utility Man",
    
    
members_needed_by_date returns an array of objects, each of which contains totals for a day in the specified date range.
For example, the POST request above would return an array in which this object would appear:
    
    {
        "Date": "2020-12-14",
        "JW": "0",
        "AW": "0",
        "TEC2": "1",
        "ATEC": "1",
        "CI": "0",
        "Total": "2"
    },
    
The root route returns the complete job calls for the specified dates for the specified member classes.
For example, the same POST request above would return an array of job calls objects like this:
    
    {
        "id": 22,
        "union_call_id": "59251 S",
        "call_date_from_html": "Friday,December 4,2020",
        "start_date_from_html": "Friday, December 4th 2020",
        "call_date_ss1970": 1607058000,
        "start_date_ss1970": 1607058000,
        "call_date_iso": "2020-12-04T00:00:00.000Z",
        "start_date_iso": "2020-12-04T00:00:00.000Z",
        "company": "PLAN GROUP INC.",
        "members_needed": 1,
        "member_class": "CI",
        "start_time": "7:00 AM",
        "location": "MULTIPLE SITES - VARIOUS DOWNTOWN LOCATIONS",
        "summary": " TENANT WORK MULTIPLE SITES - VARIOUS DOWNTOWN LOCATIONS START TIME WILL VARY, INVOLVES WORKING VARIOUS SHIFTS, CALL AFTER DISPATCH TO ARRANGE S&O AT VAUGHN OFFICE, BRING ALL SAFETIES & CERT.'S, ** NON MEMBER CI`S WILL DISPATCHED ONLY BY PHONE @ 11AM ** Friday, December 4th 2020 ",
        "scrape_date_ss1970": 0,
        "scrape_date_iso": null
    },
