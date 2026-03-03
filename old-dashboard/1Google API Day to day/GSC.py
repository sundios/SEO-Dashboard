import logging
import webbrowser
import csv
import json
import time
import sys
import os
from datetime import datetime, timedelta
import itertools
import argparse
from collections import OrderedDict
import httplib2
from oauth2client.file import Storage
from oauth2client.client import flow_from_clientsecrets
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

WEBMASTER_CREDENTIALS_FILE_PATH = "webmaster_credentials.dat"

def rate_limit(max_per_minute):
    """
    Decorator function to prevent more than x calls per minute of any function
    Args:
        max_per_minute. Numeric type.
        The maximum number of times the function should run per minute.
    """

    min_interval = 60.0 / float(max_per_minute)
    def decorate(func):
        last_time_called = [0.0]
        def rate_limited_function(*args, **kwargs):
            elapsed = time.clock() - last_time_called[0]
            wait_for = min_interval - elapsed
            if wait_for > 0:
                time.sleep(wait_for)
            ret = func(*args, **kwargs)
            last_time_called[0] = time.clock()
            return ret
        return rate_limited_function
    return decorate


def acquire_new_oauth2_credentials(secrets_file):
    """
    Args:
        secrets_file. The file path to a JSON file of client secrets, containing:
            client_id; client_secret; redirect_uris; auth_uri; token_uri.
    Returns:
        credentials for use with Google APIs
    """
    flow = flow_from_clientsecrets(
        secrets_file,
        scope="https://www.googleapis.com/auth/webmasters.readonly",
        redirect_uri="http://localhost")
    auth_uri = flow.step1_get_authorize_url()
    webbrowser.open(auth_uri)
    print("Please enter the following URL in a browser " + auth_uri)
    auth_code = input("Enter the authentication code: ")
    credentials = flow.step2_exchange(auth_code)
    return credentials


def load_oauth2_credentials(secrets_file):
    """
    Args:
        secrets_file. The file path to a JSON file of client secrets.
    Returns:
        credentials for use with Google APIs.
    Side effect:
        If the secrets file did not exist, fetch the appropriate credentials and create a new one.
    """
    storage = Storage(WEBMASTER_CREDENTIALS_FILE_PATH)
    credentials = storage.get()
    if credentials is None or credentials.invalid:
        credentials = acquire_new_oauth2_credentials(secrets_file)
    storage.put(credentials)
    return credentials


def create_search_console_client(credentials):
    """
    The search console client allows us to perform queries against the API.
    To create it, pass in your already authenticated credentials
    Args:
        credentials. An object representing Google API credentials.
    Returns:
        service. An object used to perform queries against the API.
    """
    http_auth = httplib2.Http()
    http_auth = credentials.authorize(http_auth)
    service = build('webmasters', 'v3', http=http_auth)
    return service


def date_range(start_date, end_date, delta=timedelta(days=1)):
    """
    Yields a stream of datetime objects, for all days within a range.
    The range is inclusive, so both start_date and end_date will be returned,
    as well as all dates in between.
    Args:
        start_date: The datetime object representing the first day in the range.
        end_date: The datetime object representing the second day in the range.
        delta: A datetime.timedelta instance, specifying the step interval. Defaults to one day.
    Yields:
        Each datetime object in the range.
    """
    current_date = start_date
    while current_date <= end_date:
        yield current_date
        current_date += delta


def generate_filters(**kwargs):
    """
    Yields a filter list for each combination of the args provided.
    """
    kwargs = OrderedDict((k, v) for k, v in kwargs.items() if v)
    dimensions = kwargs.keys()
    values = list(kwargs.values())
    for vals in itertools.product(*values):
        yield [{
            'dimension': dim,
            'operator': 'equals',
            'expression': val} for dim, val in zip(dimensions, vals)
              ]


@rate_limit(200)
def execute_request(service, property_uri, request, max_retries=5, wait_interval=4,
                    retry_errors=(503, 500)):
    """
    Executes a searchanalytics request.
    Args:
        service: The webmasters service object/client to use for execution.
        property_uri: Matches the URI in Google Search Console.
        request: The request to be executed.
        max_retries. Optional. Sets the maximum number of retry attempts.
        wait_interval. Optional. Sets the number of seconds to wait between each retry attempt.
        retry_errors. Optional. Retry the request whenever these error codes are encountered.
    Returns:
        An array of response rows.
    """

    response = None
    retries = 0
    while retries <= max_retries:
        try:
            response = service.searchanalytics().query(siteUrl=property_uri, body=request).execute()
        except HttpError as err:
            decoded_error_body = err.content.decode('utf-8')
            json_error = json.loads(decoded_error_body)
            if json_error['error']['code'] in retry_errors:
                time.sleep(wait_interval)
                retries += 1
                continue
        break
    return response


def parse_command_line_options():
    """
    Parses arguments from the command line and returns them in the form of an ArgParser object.
    """
    parser = argparse.ArgumentParser(description="Query the Google Search Console API for every day in a date range.")
    parser.add_argument('property_uri', type=str, help='The property URI to query. Must exactly match a property URI in Google Search Console')
    parser.add_argument('start_date', type=str, help='The start date for the query. Should not be more than 90 days ago')
    parser.add_argument('end_date', type=str, help='The last date to query. Should not be sooner than two days ago.')
    parser.add_argument('--secrets_file', type=str, default='credentials.json', help='File path of your Google Client ID and Client Secret')
    parser.add_argument('--config_file', type=str, help='File path of a config file containing settings for this Search Console property.')
    parser.add_argument('--output_location', type=str, help='The folder output location of the script.', default="")
    parser.add_argument('--url_type', type=str, help='A string to add to the beginning of the file', default="")
    parser.add_argument('--max-rows-per-day', '-n', type=int, default=100, help='The maximum number of rows to return for each day in the range')

    filters = parser.add_argument_group('filters')
    filters.add_argument('--page_filters_file', type=str, help='File path of a CSV list of pages to filter by', default="")
    filters.add_argument('--devices', nargs='*', type=str, help='List of devices to filter by. By default we do segment by device.',
                         default=['mobile', 'desktop', 'tablet'])
    filters.add_argument('--countries', nargs='*', type=str, help='List of countries to filter by', default=[])
    return parser.parse_args()


def read_page_paths_from_file(page_filters_file, property_uri):
    """
    Args:
        page_filters_file. The filepath of a plain text file containing a list of URLs
        to filter by in the Google Search Console.
    Returns:
        A list of those URLs, if they all specify the full GSC property correctly.
        Otherwise, will raise an exception.
    """
    pages = []
    with open(page_filters_file, "r") as file_handle:
        for line in file_handle.readlines():
            if property_uri in line:
                pages.append(line.strip("\n"))
            else:
                raise ValueError("Page filter does not include the property uri: {}".format(line))
    return pages

def main():
    """
    Fetch and parse all command line options.
    Dispatch queries to the GSC API.
    """
    args = parse_command_line_options()

    if args.page_filters_file:
        try:
            pages = read_page_paths_from_file(args.page_filters_file, args.property_uri)
        except IOError as err:
            logging.error("%s is not a valid file path", args.page_filters_file)
            sys.exit(err)
        except ValueError as err:
            logging.error("Error: all page filters must include the full URL of the Google Search Console property.")
            sys.exit(err)
    else:
        pages = []

    # Prepare the API service
    credentials = load_oauth2_credentials(args.secrets_file)
    service = create_search_console_client(credentials)

    start_date = datetime.strptime(args.start_date, "%Y-%m-%d")
    end_date = datetime.strptime(args.end_date, "%Y-%m-%d")

    for day in date_range(start_date, end_date):
        output_file = os.path.join(
            args.output_location,
            "{}_{}.csv".format(args.url_type, day.strftime("%Y%m%d"))
        )
        day = day.strftime("%Y-%m-%d")
        output_rows = []

        for filter_set in generate_filters(page=pages, device=args.devices, country=args.countries):

            request = {
                'startDate' : day,
                'endDate' : day,
                'dimensions' : ['query'],
                'rowLimit' : args.max_rows_per_day,
                'dimensionFilterGroups' : [
                    {
                        "groupType" : "and",
                        "filters" : filter_set
                    }
                ]
            }

            response = execute_request(service, args.property_uri, request)

            if response is None:
                logging.error("Request failed %s", json.dumps(request, indent=2))
                continue

            if 'rows' in response:

                if pages:
                    filters = [pages[0], 'worldwide', 'all_devices', args.url_type]
                else:
                    filters = ['gsc_property', 'worldwide', 'all_devices', args.url_type]

                filter_mapping = {'page': 0, 'country': 1, 'device': 2}
                for _filter in filter_set:
                    filters[filter_mapping[_filter['dimension']]] = _filter['expression']

                for row in response['rows']:
                    keys = ','.join(row['keys'])
                    output_row = [keys, row['clicks'], row['impressions'], row['ctr'], row['position'],day]
                    output_row.extend(filters)
                    output_rows.append(output_row)

        with open(output_file, 'w', newline="", encoding="utf-8-sig") as file_handle:
            headers = "Keyword,Clicks,Impressions,CTR,Position,Date, Page,Country,Device\n" 
            file_handle.write(headers)
            csvwriter = csv.writer(file_handle)
            csvwriter.writerows(output_rows)

        logging.info("Query for %s complete", day)


if __name__ == '__main__':
    main()