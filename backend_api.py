#!/usr/bin/env python3
"""
GSC Dashboard Backend API
Flask API to serve Google Search Console data to the Next.js frontend
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os
import argparse
import datetime
import httplib2
from apiclient.discovery import build
from oauth2client import client, file, tools
import pandas as pd
from dateutil.relativedelta import relativedelta
import json
from openai import OpenAI

app = Flask(__name__)
# Enable CORS for Next.js frontend with explicit configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Config file path
CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'dashboard_config.json')

# Global variables
webmasters_service = None
verified_sites = []
openai_client = None

# Default settings
DEFAULT_SETTINGS = {
    "openaiApiKey": "",
    "credentialsPath": "/Users/kburchardt/Desktop/SEO_scripts-main/scripts/Api-Keys/client_secret.json",
    "isAuthorized": False,
    "overviewSites": []
}

def load_config():
    """Load configuration from file"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                # Merge with defaults to ensure all keys exist
                return {**DEFAULT_SETTINGS, **config}
        except Exception as e:
            print(f"Error loading config: {e}")
            return DEFAULT_SETTINGS.copy()
    return DEFAULT_SETTINGS.copy()

def save_config(config):
    """Save configuration to file"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving config: {e}")
        return False

def initialize_openai_client():
    """Initialize OpenAI client from config"""
    global openai_client
    config = load_config()
    api_key = config.get('openaiApiKey', '')
    if api_key:
        try:
            openai_client = OpenAI(api_key=api_key)
            print("OpenAI client initialized")
        except Exception as e:
            print(f"Error initializing OpenAI client: {e}")
            openai_client = None
    else:
        openai_client = None

def authorize_creds(creds_path, authorized_creds_path='authorizedcreds.dat'):
    """Authorize and return the Webmasters API service"""
    try:
        SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
        
        parser = argparse.ArgumentParser(
            formatter_class=argparse.RawDescriptionHelpFormatter,
            parents=[tools.argparser])
        flags = parser.parse_args([])

        flow = client.flow_from_clientsecrets(
            creds_path, scope=SCOPES,
            message=tools.message_if_missing(creds_path))

        storage = file.Storage(authorized_creds_path)
        credentials = storage.get()

        if credentials is None or credentials.invalid:
            credentials = tools.run_flow(flow, storage, flags)

        http = httplib2.Http()
        http = credentials.authorize(http=http)
        webmasters_service = build('searchconsole', 'v1', http=http)
        
        return webmasters_service
    except Exception as e:
        print(f"Error in authorize_creds: {str(e)}")
        return None

def get_verified_sites(webmasters_service):
    """Get list of verified sites from Google Search Console"""
    try:
        site_list = webmasters_service.sites().list().execute()
        
        verified_sites_urls = [s['siteUrl'] for s in site_list['siteEntry']
                              if s['permissionLevel'] != 'siteUnverifiedUser'
                              and s['siteUrl'][:4] == 'http']
        
        return verified_sites_urls
    except Exception as e:
        print(f"Error getting verified sites: {str(e)}")
        return []

def get_data(webmasters_service, site, start_date, end_date, dimensions=None, search_type="web", 
             dimension_filters=None, aggregation_type="auto", row_limit=25000, start_row=0):
    """Request data from the GSC API"""
    if dimensions is None:
        dimensions = ['date']
    
    request_body = {
        'startDate': start_date,
        'endDate': end_date,
        'dimensions': dimensions,
        'type': search_type,
        'aggregationType': aggregation_type,
        'rowLimit': row_limit,
        'startRow': start_row
    }
    
    if dimension_filters:
        request_body['dimensionFilterGroups'] = dimension_filters
    
    try:
        response = webmasters_service.searchanalytics().query(siteUrl=site, body=request_body).execute()
        
        if 'rows' in response:
            return response['rows']
        else:
            return []
    except Exception as e:
        print(f"Error fetching data: {str(e)}")
        return []

def clean_and_export_data(rows, dimensions):
    """Clean data and return as dictionary"""
    data = {
        "rows": []
    }
    
    print(f"DEBUG: Processing {len(rows)} rows with dimensions: {dimensions}")
    
    total_clicks = 0
    total_impressions = 0
    total_ctr = 0
    total_position = 0
    
    # For daily aggregation
    daily_data = {}
    
    # For query aggregation (across all dates)
    query_data = {}
    
    for row in rows:
        row_data = {
            "keys": row.get('keys', []),
            "clicks": row.get('clicks', 0),
            "impressions": row.get('impressions', 0),
            "ctr": row.get('ctr', 0),
            "position": row.get('position', 0)
        }
        data["rows"].append(row_data)
        
        if len(row_data["keys"]) > 0:
            print(f"DEBUG: Row keys: {row_data['keys']}, clicks: {row_data['clicks']}")
        
        total_clicks += row_data["clicks"]
        total_impressions += row_data["impressions"]
        total_ctr += row_data["ctr"]
        total_position += row_data["position"]
        
        # Aggregate by date if date dimension is present
        if 'date' in dimensions and row_data["keys"]:
            date_key = row_data["keys"][0]  # First dimension is typically date
            if date_key not in daily_data:
                daily_data[date_key] = {
                    "clicks": 0,
                    "impressions": 0,
                    "ctr": 0,
                    "position": 0,
                    "count": 0
                }
            daily_data[date_key]["clicks"] += row_data["clicks"]
            daily_data[date_key]["impressions"] += row_data["impressions"]
            daily_data[date_key]["ctr"] += row_data["ctr"]
            daily_data[date_key]["position"] += row_data["position"]
            daily_data[date_key]["count"] += 1
        
        # Aggregate by query (across all dates)
        if 'query' in dimensions and len(row_data["keys"]) > 1:
            query_key = row_data["keys"][1]  # Second dimension is typically query when date is first
            print(f"DEBUG: Aggregating query '{query_key}' with {row_data['clicks']} clicks")
            if query_key not in query_data:
                query_data[query_key] = {
                    "clicks": 0,
                    "impressions": 0,
                    "ctr": 0,
                    "position": 0,
                    "count": 0
                }
            query_data[query_key]["clicks"] += row_data["clicks"]
            query_data[query_key]["impressions"] += row_data["impressions"]
            query_data[query_key]["ctr"] += row_data["ctr"]
            query_data[query_key]["position"] += row_data["position"]
            query_data[query_key]["count"] += 1
        
        # Aggregate by country (across all dates)
        if 'country' in dimensions and len(row_data["keys"]) > 1:
            country_key = row_data["keys"][1]  # Second dimension is typically country when date is first
            print(f"DEBUG: Aggregating country '{country_key}' with {row_data['clicks']} clicks")
            if country_key not in query_data:  # Reuse query_data structure for country aggregation
                query_data[country_key] = {
                    "clicks": 0,
                    "impressions": 0,
                    "ctr": 0,
                    "position": 0,
                    "count": 0
                }
            query_data[country_key]["clicks"] += row_data["clicks"]
            query_data[country_key]["impressions"] += row_data["impressions"]
            query_data[country_key]["ctr"] += row_data["ctr"]
            query_data[country_key]["position"] += row_data["position"]
            query_data[country_key]["count"] += 1
    
    # Calculate averages for daily data
    daily_chart_data = []
    for date, values in sorted(daily_data.items()):
        daily_chart_data.append({
            "date": date,
            "clicks": values["clicks"],
            "impressions": values["impressions"],
            "ctr": values["ctr"] / values["count"] if values["count"] > 0 else 0,
            "position": values["position"] / values["count"] if values["count"] > 0 else 0
        })
    
    # Calculate aggregated top queries (or countries if country dimension is used)
    top_queries_data = []
    for query, values in query_data.items():
        top_queries_data.append({
            "keys": [query],
            "clicks": values["clicks"],
            "impressions": values["impressions"],
            "ctr": values["ctr"] / values["count"] if values["count"] > 0 else 0,
            "position": values["position"] / values["count"] if values["count"] > 0 else 0
        })
    
    # Sort top queries by clicks and take top 10 (or more for countries)
    top_queries_data.sort(key=lambda x: x["clicks"], reverse=True)
    # For countries, return more results; for queries, keep top 10
    limit = 100 if 'country' in dimensions else 10
    top_queries_data = top_queries_data[:limit]
    
    # Calculate overall averages
    row_count = len(rows)
    data["totalClicks"] = total_clicks
    data["totalImpressions"] = total_impressions
    data["avgCtr"] = total_ctr / row_count if row_count > 0 else 0
    data["avgPosition"] = total_position / row_count if row_count > 0 else 0
    data["dailyData"] = daily_chart_data
    data["topQueries"] = top_queries_data
    
    print(f"DEBUG: Returning data with {len(top_queries_data)} top queries and {len(daily_chart_data)} daily data points")
    
    return data

# Initialize GSC service
def init_gsc():
    global webmasters_service, verified_sites
    config = load_config()
    creds_path = config.get('credentialsPath', '')
    
    if creds_path and os.path.exists(creds_path):
        webmasters_service = authorize_creds(creds_path)
        if webmasters_service:
            verified_sites = get_verified_sites(webmasters_service)
            print(f"Initialized GSC with {len(verified_sites)} verified sites")
            # Update config to mark as authorized
            config['isAuthorized'] = True
            save_config(config)
        else:
            print("Failed to initialize GSC service")
            config['isAuthorized'] = False
            save_config(config)
    else:
        if creds_path:
            print(f"Credentials file not found at {creds_path}")
        else:
            print("No credentials path configured")

# API Routes
@app.route('/api/sites', methods=['GET'])
def get_sites():
    """Get verified sites"""
    global verified_sites
    return jsonify({"sites": verified_sites})

@app.route('/api/data', methods=['GET'])
def get_gsc_data():
    """Get GSC analytics data"""
    global webmasters_service
    
    site_url = request.args.get('siteUrl')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    dimensions = request.args.get('dimensions', 'date').split(',')
    device = request.args.get('device', 'all')
    
    # Build dimension filters
    dimension_filters = None
    filter_dimension = request.args.get('filterDimension')
    filter_type = request.args.get('filterType')
    filter_value = request.args.get('filterValue')
    
    # Create filter groups if filters are provided
    if device != 'all' or (filter_dimension and filter_value):
        filter_groups = [{
            'groupType': 'and',
            'filters': []
        }]
        
        # Add device filter if not 'all'
        if device != 'all':
            device_map = {
                'desktop': 'DESKTOP',
                'mobile': 'MOBILE',
                'tablet': 'TABLET'
            }
            device_value = device_map.get(device.lower(), device.upper())
            filter_groups[0]['filters'].append({
                'dimension': 'device',
                'operator': 'equals',
                'expression': device_value
            })
        
        # Add advanced filter if provided
        if filter_dimension and filter_value:
            operator_map = {
                'equals': 'equals',
                'notEquals': 'notEquals',
                'contains': 'contains',
                'notContains': 'notContains',
                'greaterThan': 'greaterThan',
                'smallerThan': 'smallerThan'
            }
            operator = operator_map.get(filter_type, 'equals')
            
            # Handle numeric comparisons
            if operator in ['greaterThan', 'smallerThan']:
                # For numeric comparisons, we need to handle them differently
                # GSC API doesn't support direct numeric comparisons on all dimensions
                # So we'll use 'equals' for now and filter client-side if needed
                operator = 'equals'
            
            filter_groups[0]['filters'].append({
                'dimension': filter_dimension,
                'operator': operator,
                'expression': filter_value
            })
        
        dimension_filters = filter_groups
    
    if not all([site_url, start_date, end_date]):
        return jsonify({"error": "Missing required parameters"}), 400
    
    if not webmasters_service:
        return jsonify({"error": "GSC service not initialized"}), 500
    
    try:
        raw_data = get_data(
            webmasters_service, 
            site_url, 
            start_date, 
            end_date, 
            dimensions=dimensions,
            dimension_filters=dimension_filters
        )
        
        cleaned_data = clean_and_export_data(raw_data, dimensions)
        return jsonify(cleaned_data)
        
    except Exception as e:
        print(f"Error in get_gsc_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/top-queries', methods=['GET'])
def get_top_queries():
    """Get top performing queries"""
    global webmasters_service
    
    site_url = request.args.get('siteUrl')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    limit = int(request.args.get('limit', 10))
    
    if not all([site_url, start_date, end_date]):
        return jsonify({"error": "Missing required parameters"}), 400
    
    try:
        raw_data = get_data(
            webmasters_service, 
            site_url, 
            start_date, 
            end_date, 
            dimensions=['query'],
            row_limit=limit
        )
        
        # Sort by clicks
        sorted_data = sorted(raw_data, key=lambda x: x.get('clicks', 0), reverse=True)
        
        return jsonify({"queries": sorted_data[:limit]})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get API status"""
    global webmasters_service, verified_sites
    return jsonify({
        "status": "running",
        "gsc_connected": webmasters_service is not None,
        "sites_count": len(verified_sites)
    })

def get_gpt_insights(content, analysis_type="general"):
    """
    Generate insights from OpenAI GPT model based on the provided content.
    
    Args:
        content (str): The data to analyze
        analysis_type (str): Type of analysis - "daily" for chart data, "queries" for table data
    
    Returns:
        str: GPT insights
    """
    global openai_client
    
    # Initialize OpenAI client if not already initialized
    if openai_client is None:
        initialize_openai_client()
    
    if openai_client is None:
        return "OpenAI API key not configured. Please set your API key in Settings."
    
    try:
        if analysis_type == "daily":
            system_content = (
                "You are an SEO expert analyzing daily Google Search Console performance data. "
                "Your task is to analyze daily traffic patterns and provide clear, data-driven insights. "
                "Focus on:\n\n"
                "**Daily Traffic Trends:**\n"
                "- **Clicks**: Identify daily patterns, spikes, drops, and overall trends\n"
                "- **Impressions**: Analyze impression trends and visibility changes\n"
                "- **CTR**: Examine click-through rate patterns and correlations\n"
                "- **Position**: Track ranking changes over time\n\n"
                "**Key Observations:**\n"
                "- Identify the best and worst performing days\n"
                "- Note any weekly patterns or seasonal trends\n"
                "- Highlight significant changes or anomalies\n"
                "- Suggest potential reasons for performance changes\n\n"
                "Keep insights concise and actionable. Use percentages and specific numbers when relevant."
            )
        else:  # queries analysis
            system_content = (
                "You are an SEO expert analyzing Google Search Console query performance data. "
                "Your task is to analyze search query performance and provide clear, data-driven insights. "
                "Focus on:\n\n"
                "**Query Performance:**\n"
                "- **Top Performers**: Identify highest-traffic queries and their characteristics\n"
                "- **CTR Analysis**: Highlight queries with exceptional or poor CTR\n"
                "- **Position Opportunities**: Find queries with good impressions but poor positions\n"
                "- **Content Gaps**: Identify potential content optimization opportunities\n\n"
                "**Key Recommendations:**\n"
                "- Suggest which queries to optimize for better rankings\n"
                "- Recommend content improvements based on query intent\n"
                "- Identify low-hanging fruit for quick wins\n"
                "- Highlight successful query patterns to replicate\n\n"
                "Keep insights concise and actionable. Focus on specific opportunities and improvements."
            )

        chat_completion = openai_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_content
                },
                {
                    "role": "user",
                    "content": content
                }
            ],
            model="gpt-4o"
        )
        
        response_message = chat_completion.choices[0].message.content
        return response_message
        
    except Exception as e:
        print(f"Error getting GPT insights: {str(e)}")
        return f"Error generating insights: {str(e)}"

@app.route('/api/insights/daily', methods=['POST'])
def get_daily_insights():
    """Get GPT insights for daily chart data"""
    try:
        data = request.get_json()
        daily_data = data.get('dailyData', [])
        
        if not daily_data:
            return jsonify({"error": "No daily data provided"}), 400
        
        # Format the data for GPT analysis
        content = f"Analyze this daily Google Search Console performance data:\n\n"
        content += "Date | Clicks | Impressions | CTR | Position\n"
        content += "-" * 50 + "\n"
        
        for day in daily_data:
            date = day.get('date', 'N/A')
            clicks = day.get('clicks', 0)
            impressions = day.get('impressions', 0)
            ctr = round((day.get('ctr', 0) * 100), 2)
            position = round(day.get('position', 0), 1)
            content += f"{date} | {clicks} | {impressions} | {ctr}% | {position}\n"
        
        content += f"\n\nTotal data points: {len(daily_data)} days"
        content += f"\nDate range: {daily_data[0].get('date', 'N/A')} to {daily_data[-1].get('date', 'N/A')}"
        
        insights = get_gpt_insights(content, "daily")
        
        return jsonify({"insights": insights})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/insights/queries', methods=['POST'])
def get_query_insights():
    """Get GPT insights for filtered query data"""
    try:
        data = request.get_json()
        queries = data.get('queries', [])
        
        if not queries:
            return jsonify({"error": "No query data provided"}), 400
        
        # Format the data for GPT analysis
        content = f"Analyze this Google Search Console query performance data:\n\n"
        content += "Rank | Query | Clicks | Impressions | CTR | Position\n"
        content += "-" * 70 + "\n"
        
        for i, query in enumerate(queries, 1):
            query_text = query.get('keys', ['Unknown'])[0]
            clicks = query.get('clicks', 0)
            impressions = query.get('impressions', 0)
            ctr = round((query.get('ctr', 0) * 100), 2)
            position = round(query.get('position', 0), 1)
            content += f"#{i} | {query_text} | {clicks} | {impressions} | {ctr}% | {position}\n"
        
        content += f"\n\nTotal queries analyzed: {len(queries)}"
        
        # Add summary statistics
        total_clicks = sum(q.get('clicks', 0) for q in queries)
        total_impressions = sum(q.get('impressions', 0) for q in queries)
        avg_ctr = sum(q.get('ctr', 0) for q in queries) / len(queries) * 100 if queries else 0
        avg_position = sum(q.get('position', 0) for q in queries) / len(queries) if queries else 0
        
        content += f"\nSummary: {total_clicks} total clicks, {total_impressions} total impressions"
        content += f"\nAverage CTR: {avg_ctr:.2f}%, Average Position: {avg_position:.1f}"
        
        insights = get_gpt_insights(content, "queries")
        
        return jsonify({"insights": insights})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get current settings"""
    config = load_config()
    # Return all settings including API keys
    return jsonify({
        "openaiApiKey": config.get('openaiApiKey', ''),
        "credentialsPath": config.get('credentialsPath', ''),
        "isAuthorized": config.get('isAuthorized', False),
        "overviewSites": config.get('overviewSites', [])
    })

@app.route('/api/settings', methods=['POST'])
def save_settings():
    """Save settings"""
    try:
        data = request.get_json()
        config = load_config()
        
        # Update config with new values
        if 'openaiApiKey' in data:
            config['openaiApiKey'] = data['openaiApiKey']
            # Reinitialize OpenAI client with new key
            initialize_openai_client()
        
        if 'credentialsPath' in data:
            config['credentialsPath'] = data['credentialsPath']
            # Reset authorization status when path changes
            config['isAuthorized'] = False
        
        if 'overviewSites' in data:
            # Validate that we don't have more than 6 sites
            overview_sites = data['overviewSites']
            if len(overview_sites) > 6:
                return jsonify({"error": "Maximum 6 sites allowed for overview"}), 400
            config['overviewSites'] = overview_sites
        
        # Save config
        if save_config(config):
            return jsonify({
                "success": True,
                "isAuthorized": config.get('isAuthorized', False),
                "openaiApiKey": config.get('openaiApiKey', ''),
                "credentialsPath": config.get('credentialsPath', ''),
                "overviewSites": config.get('overviewSites', [])
            })
        else:
            return jsonify({"error": "Failed to save settings"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/authorize', methods=['POST'])
def authorize():
    """Authorize Google Search Console credentials"""
    global webmasters_service, verified_sites
    
    try:
        data = request.get_json()
        creds_path = data.get('credentialsPath', '')
        
        if not creds_path:
            config = load_config()
            creds_path = config.get('credentialsPath', '')
        
        if not creds_path:
            return jsonify({"error": "No credentials path provided"}), 400
        
        if not os.path.exists(creds_path):
            return jsonify({"error": f"Credentials file not found at {creds_path}"}), 400
        
        # Authorize credentials
        webmasters_service = authorize_creds(creds_path)
        
        if webmasters_service:
            verified_sites = get_verified_sites(webmasters_service)
            
            # Update config
            config = load_config()
            config['credentialsPath'] = creds_path
            config['isAuthorized'] = True
            save_config(config)
            
            return jsonify({
                "authorized": True,
                "message": f"Successfully authorized! Found {len(verified_sites)} verified sites.",
                "sitesCount": len(verified_sites)
            })
        else:
            # Update config
            config = load_config()
            config['isAuthorized'] = False
            save_config(config)
            
            return jsonify({
                "authorized": False,
                "message": "Failed to authorize credentials. Please check your credentials file."
            }), 400
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings/clear', methods=['POST'])
def clear_settings():
    """Clear all authentication and credentials"""
    global webmasters_service, verified_sites, openai_client
    
    try:
        # Delete authorized credentials file
        authorized_creds_path = 'authorizedcreds.dat'
        if os.path.exists(authorized_creds_path):
            try:
                os.remove(authorized_creds_path)
                print(f"Deleted {authorized_creds_path}")
            except Exception as e:
                print(f"Error deleting {authorized_creds_path}: {e}")
        
        # Reset global variables
        webmasters_service = None
        verified_sites = []
        openai_client = None
        
        # Clear config
        config = {
            "openaiApiKey": "",
            "credentialsPath": "",
            "isAuthorized": False,
            "overviewSites": []
        }
        
        if save_config(config):
            # Reinitialize OpenAI client (will be None since no key)
            initialize_openai_client()
            
            return jsonify({
                "success": True,
                "message": "All credentials and authentication have been cleared successfully."
            })
        else:
            return jsonify({"error": "Failed to clear settings"}), 500
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/url-inspect', methods=['POST'])
def inspect_url():
    """Inspect a URL using Google Search Console URL Inspection API"""
    global webmasters_service
    
    if not webmasters_service:
        return jsonify({"error": "GSC service not initialized. Please authenticate first."}), 401
    
    try:
        data = request.get_json()
        inspection_url = data.get('inspectionUrl')
        site_url = data.get('siteUrl')
        language_code = data.get('languageCode', 'en-US')
        
        if not inspection_url:
            return jsonify({"error": "inspectionUrl is required"}), 400
        
        if not site_url:
            return jsonify({"error": "siteUrl is required"}), 400
        
        # Build the request body for the URL Inspection API
        request_body = {
            'inspectionUrl': inspection_url,
            'siteUrl': site_url,
            'languageCode': language_code
        }
        
        # Call the URL Inspection API
        # The API endpoint is urlInspection.index().inspect()
        try:
            # The method signature is: urlInspection().index().inspect(body={...}).execute()
            response = webmasters_service.urlInspection().index().inspect(body=request_body).execute()
            return jsonify(response)
        except Exception as api_error:
            error_message = str(api_error)
            # Try to extract more detailed error information from the exception
            if hasattr(api_error, 'content'):
                try:
                    import json
                    error_content = json.loads(api_error.content.decode('utf-8'))
                    if 'error' in error_content:
                        error_message = error_content['error'].get('message', error_message)
                except:
                    pass
            elif hasattr(api_error, 'error_details'):
                # Some Google API exceptions have error_details
                try:
                    error_message = str(api_error.error_details) or error_message
                except:
                    pass
            
            return jsonify({"error": f"URL Inspection API error: {error_message}"}), 400
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/sitemaps', methods=['GET'])
def list_sitemaps():
    """List all sitemaps for a site"""
    global webmasters_service
    import json
    import sys
    
    print(f"\n{'='*60}", file=sys.stderr, flush=True)
    print(f"[SITEMAPS] Received request to list sitemaps", file=sys.stderr, flush=True)
    print(f"[SITEMAPS] Request method: {request.method}", file=sys.stderr, flush=True)
    print(f"[SITEMAPS] Request args: {dict(request.args)}", file=sys.stderr, flush=True)
    
    if not webmasters_service:
        print(f"[SITEMAPS] ERROR: GSC service not initialized", file=sys.stderr, flush=True)
        return jsonify({"error": "GSC service not initialized. Please authenticate first."}), 401
    
    try:
        site_url = request.args.get('siteUrl')
        print(f"[SITEMAPS] Site URL from request: {site_url}", file=sys.stderr, flush=True)
        
        if not site_url:
            print(f"[SITEMAPS] ERROR: siteUrl is required", file=sys.stderr, flush=True)
            return jsonify({"error": "siteUrl is required"}), 400
        
        # List sitemaps
        print(f"[SITEMAPS] Calling GSC API: sitemaps().list(siteUrl={site_url})", file=sys.stderr, flush=True)
        response = webmasters_service.sitemaps().list(siteUrl=site_url).execute()
        print(f"[SITEMAPS] API Response received:", file=sys.stderr, flush=True)
        print(json.dumps(response, indent=2), file=sys.stderr, flush=True)
        
        # Check if response has sitemap (singular) or sitemapEntry
        if 'sitemap' in response:
            print(f"[SITEMAPS] Found {len(response['sitemap'])} sitemaps", file=sys.stderr, flush=True)
            for idx, sitemap in enumerate(response['sitemap']):
                print(f"[SITEMAPS]   [{idx+1}] Path: {sitemap.get('path', 'N/A')}, Type: {sitemap.get('type', 'N/A')}", file=sys.stderr, flush=True)
        elif 'sitemapEntry' in response:
            print(f"[SITEMAPS] Found {len(response['sitemapEntry'])} sitemaps (sitemapEntry)", file=sys.stderr, flush=True)
            for idx, sitemap in enumerate(response['sitemapEntry']):
                print(f"[SITEMAPS]   [{idx+1}] Path: {sitemap.get('path', 'N/A')}, Type: {sitemap.get('type', 'N/A')}", file=sys.stderr, flush=True)
        else:
            print(f"[SITEMAPS] WARNING: No 'sitemap' or 'sitemapEntry' key in response. Response keys: {list(response.keys())}", file=sys.stderr, flush=True)
        
        print(f"{'='*60}\n", file=sys.stderr, flush=True)
        return jsonify(response)
    except Exception as e:
        import traceback
        print(f"[SITEMAPS] EXCEPTION occurred:", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        error_message = str(e)
        if hasattr(e, 'content'):
            try:
                import json
                error_content = json.loads(e.content.decode('utf-8'))
                print(f"[SITEMAPS] Error content:", file=sys.stderr, flush=True)
                print(json.dumps(error_content, indent=2), file=sys.stderr, flush=True)
                if 'error' in error_content:
                    error_message = error_content['error'].get('message', error_message)
            except Exception as parse_error:
                print(f"[SITEMAPS] Could not parse error content: {parse_error}", file=sys.stderr, flush=True)
        print(f"[SITEMAPS] Returning error: {error_message}", file=sys.stderr, flush=True)
        print(f"{'='*60}\n", file=sys.stderr, flush=True)
        return jsonify({"error": f"Sitemap API error: {error_message}"}), 400

@app.route('/api/sitemaps/get', methods=['GET'])
def get_sitemap():
    """Get information about a specific sitemap"""
    global webmasters_service
    import json
    import sys
    
    print(f"\n{'='*60}", file=sys.stderr, flush=True)
    print(f"[SITEMAPS GET] Received request to get sitemap details", file=sys.stderr, flush=True)
    print(f"[SITEMAPS GET] Request args: {dict(request.args)}", file=sys.stderr, flush=True)
    
    if not webmasters_service:
        print(f"[SITEMAPS GET] ERROR: GSC service not initialized", file=sys.stderr, flush=True)
        return jsonify({"error": "GSC service not initialized. Please authenticate first."}), 401
    
    try:
        site_url = request.args.get('siteUrl')
        feedpath = request.args.get('feedpath')
        
        print(f"[SITEMAPS GET] Site URL: {site_url}", file=sys.stderr, flush=True)
        print(f"[SITEMAPS GET] Feedpath: {feedpath}", file=sys.stderr, flush=True)
        
        if not site_url:
            print(f"[SITEMAPS GET] ERROR: siteUrl is required", file=sys.stderr, flush=True)
            return jsonify({"error": "siteUrl is required"}), 400
        if not feedpath:
            print(f"[SITEMAPS GET] ERROR: feedpath is required", file=sys.stderr, flush=True)
            return jsonify({"error": "feedpath is required"}), 400
        
        # Get sitemap
        print(f"[SITEMAPS GET] Calling GSC API: sitemaps().get(siteUrl={site_url}, feedpath={feedpath})", file=sys.stderr, flush=True)
        response = webmasters_service.sitemaps().get(siteUrl=site_url, feedpath=feedpath).execute()
        print(f"[SITEMAPS GET] API Response:", file=sys.stderr, flush=True)
        print(json.dumps(response, indent=2), file=sys.stderr, flush=True)
        print(f"{'='*60}\n", file=sys.stderr, flush=True)
        return jsonify(response)
    except Exception as e:
        import traceback
        print(f"[SITEMAPS GET] EXCEPTION occurred:", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        error_message = str(e)
        if hasattr(e, 'content'):
            try:
                import json
                error_content = json.loads(e.content.decode('utf-8'))
                print(f"[SITEMAPS GET] Error content:", file=sys.stderr, flush=True)
                print(json.dumps(error_content, indent=2), file=sys.stderr, flush=True)
                if 'error' in error_content:
                    error_message = error_content['error'].get('message', error_message)
            except Exception as parse_error:
                print(f"[SITEMAPS GET] Could not parse error content: {parse_error}", file=sys.stderr, flush=True)
        print(f"[SITEMAPS GET] Returning error: {error_message}", file=sys.stderr, flush=True)
        print(f"{'='*60}\n", file=sys.stderr, flush=True)
        return jsonify({"error": f"Sitemap API error: {error_message}"}), 400

@app.route('/api/sitemaps/submit', methods=['POST'])
def submit_sitemap():
    """Submit a sitemap for a site"""
    global webmasters_service
    import json
    
    print(f"[SITEMAPS SUBMIT] Received request to submit sitemap")
    
    if not webmasters_service:
        print(f"[SITEMAPS SUBMIT] ERROR: GSC service not initialized")
        return jsonify({"error": "GSC service not initialized. Please authenticate first."}), 401
    
    try:
        data = request.get_json()
        print(f"[SITEMAPS SUBMIT] Request data: {json.dumps(data, indent=2)}")
        site_url = data.get('siteUrl')
        feedpath = data.get('feedpath')
        
        if not site_url:
            print(f"[SITEMAPS SUBMIT] ERROR: siteUrl is required")
            return jsonify({"error": "siteUrl is required"}), 400
        if not feedpath:
            print(f"[SITEMAPS SUBMIT] ERROR: feedpath is required")
            return jsonify({"error": "feedpath is required"}), 400
        
        print(f"[SITEMAPS SUBMIT] Calling GSC API: sitemaps().submit(siteUrl={site_url}, feedpath={feedpath})")
        # Submit sitemap
        response = webmasters_service.sitemaps().submit(siteUrl=site_url, feedpath=feedpath).execute()
        print(f"[SITEMAPS SUBMIT] API Response: {json.dumps(response, indent=2)}")
        return jsonify({"success": True, "message": "Sitemap submitted successfully"})
    except Exception as e:
        import traceback
        print(f"[SITEMAPS SUBMIT] EXCEPTION occurred:")
        traceback.print_exc()
        error_message = str(e)
        if hasattr(e, 'content'):
            try:
                import json
                error_content = json.loads(e.content.decode('utf-8'))
                print(f"[SITEMAPS SUBMIT] Error content: {json.dumps(error_content, indent=2)}")
                if 'error' in error_content:
                    error_message = error_content['error'].get('message', error_message)
            except Exception as parse_error:
                print(f"[SITEMAPS SUBMIT] Could not parse error content: {parse_error}")
        print(f"[SITEMAPS SUBMIT] Returning error: {error_message}")
        return jsonify({"error": f"Sitemap API error: {error_message}"}), 400

@app.route('/api/sitemaps/delete', methods=['POST'])
def delete_sitemap():
    """Delete a sitemap from a site"""
    global webmasters_service
    import json
    
    print(f"[SITEMAPS DELETE] Received request to delete sitemap")
    
    if not webmasters_service:
        print(f"[SITEMAPS DELETE] ERROR: GSC service not initialized")
        return jsonify({"error": "GSC service not initialized. Please authenticate first."}), 401
    
    try:
        data = request.get_json()
        print(f"[SITEMAPS DELETE] Request data: {json.dumps(data, indent=2)}")
        site_url = data.get('siteUrl')
        feedpath = data.get('feedpath')
        
        if not site_url:
            print(f"[SITEMAPS DELETE] ERROR: siteUrl is required")
            return jsonify({"error": "siteUrl is required"}), 400
        if not feedpath:
            print(f"[SITEMAPS DELETE] ERROR: feedpath is required")
            return jsonify({"error": "feedpath is required"}), 400
        
        print(f"[SITEMAPS DELETE] Calling GSC API: sitemaps().delete(siteUrl={site_url}, feedpath={feedpath})")
        # Delete sitemap
        webmasters_service.sitemaps().delete(siteUrl=site_url, feedpath=feedpath).execute()
        print(f"[SITEMAPS DELETE] Sitemap deleted successfully")
        return jsonify({"success": True, "message": "Sitemap deleted successfully"})
    except Exception as e:
        import traceback
        print(f"[SITEMAPS DELETE] EXCEPTION occurred:")
        traceback.print_exc()
        error_message = str(e)
        if hasattr(e, 'content'):
            try:
                import json
                error_content = json.loads(e.content.decode('utf-8'))
                print(f"[SITEMAPS DELETE] Error content: {json.dumps(error_content, indent=2)}")
                if 'error' in error_content:
                    error_message = error_content['error'].get('message', error_message)
            except Exception as parse_error:
                print(f"[SITEMAPS DELETE] Could not parse error content: {parse_error}")
        print(f"[SITEMAPS DELETE] Returning error: {error_message}", file=sys.stderr, flush=True)
        return jsonify({"error": f"Sitemap API error: {error_message}"}), 400

# Debug route to list all registered routes
@app.route('/api/debug/routes', methods=['GET'])
def list_routes():
    """List all registered routes for debugging"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'path': str(rule)
        })
    return jsonify({'routes': routes})

if __name__ == '__main__':
    import warnings
    import os
    
    # Suppress multiprocessing resource tracker warnings (they're harmless)
    warnings.filterwarnings('ignore', category=UserWarning, module='multiprocessing.resource_tracker')
    
    # Set environment variable to prevent multiprocessing issues with Flask reloader
    os.environ['FLASK_ENV'] = 'development'
    
    print("Starting GSC Dashboard Backend...")
    
    # Initialize OpenAI client
    initialize_openai_client()
    
    # Initialize GSC service
    init_gsc()
    
    try:
        # Use use_reloader=False to prevent multiprocessing conflicts
        # This is safer when using pandas and other libraries that use multiprocessing
        app.run(debug=True, port=5001, use_reloader=False, threaded=True)
    except KeyboardInterrupt:
        print("\nShutting down backend...")
    except Exception as e:
        print(f"Error running backend: {e}")
        import traceback
        traceback.print_exc() 