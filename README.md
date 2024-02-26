# Web Scraping Assessment

See the [assessment requirments](https://docs.google.com/document/d/1BvYEldLzFIK4aT_Dvsi31w2crjsBOZyuTLpnSJxCSls) for additional context about the project.

## Insrtuctions

1. Install dependencies (`npm install`)
2. Compile the program (`npm build`)
3. Run the program (`npm start`)

## Overview

This project is a CLI that automates the gathering of the user's Amazon order history data. The user is prompted to enter their Amazon credentials, and then given the options to either retrieve their most recent order history or retrieve orders that match specific search strings. A looping dialogue allows the user to continue retrieve/search order data until they choose to exit.

_An diolague CLI design was chose because the requirements imply the user's presence to manually handle MFA scenarios._

### Sign-in

The user is prompted to enter their Amazon email address and password. The email is not currently validated for email format because the sign-in flow was inteded to be generalized for future extension of the program to target other websites. A failed sign-in will gracefully close the program.

### Retrieve Order History

The user is prompted to enter the maximum number of recent orders they want to retrieve. This is done in reverse chronological order, so the most recent orders are retrieved first. The default results limit is 10 orders.

### Search Order History

The user is prompted to enter a comma-separated list of search strings. The program will then retrieve all orders that contain the search string. The user is prompted to enter another search string, and the program will continue to retrieve orders that contain the search string until the user chooses to exit.

## Caveats

Amazon's order history is based around "orders", that is a single purchase instance that may contain multiple items. Because of that, the order price listed is the total for all items in the order. Even clicking into the "order details" for an individual item listed within order history search results will display a page with the total order price and list all items for that order.

It would require a further step of loading the order invoices and parsing the item-price pairs to retrieve the individual item prices. In the case of search results, item prices would further need to be filtered from the order invoice data to only include item prices from the search results.

I chose to stop my scraping at the order level and include the total order price along with a list of the item descriptions and their page links. For an assessment project, I felt that this was a reasonable stopping point that still sufficiently my abilities.

## Next Steps

Were this a paid/production project, the following would be my next steps:

1. Scrape individual item prices from order invoices
2. Add a thorough set of feature tests
3. Deduplicate search results orders where multiple matched items are from the same order.
4. Add some performance-based batch limit processing when launching many "order details" pages simultaneously
5. Add option to limit the total (or individual) search results
6. Add option to use a `.env` to configure login credentials
7. Add option to save results to a JSON file
8. Add further user input validation (e.g. email format)
9. Add option to retrieve orders from a specific date range
