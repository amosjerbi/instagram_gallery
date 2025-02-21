#!/usr/bin/env python3
import json
import os
import sys
import requests
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Constants
API_FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}"
POSTS_PER_PAGE = 50

def fetch_instagram_media(access_token, limit=POSTS_PER_PAGE):
    """
    Fetch media from Instagram Graph API
    """
    base_url = "https://graph.instagram.com/me/media"
    params = {
        "fields": API_FIELDS,
        "limit": limit,
        "access_token": access_token
    }

    try:
        logging.info(f"Fetching from: {base_url}?limit={limit}&fields={API_FIELDS}&access_token=***")
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        
        # Try to parse the JSON response
        try:
            data = response.json()
            # Validate the response structure
            if not isinstance(data, dict):
                raise ValueError("Response is not a valid JSON object")
            if "data" not in data:
                raise ValueError("Response missing 'data' field")
            if not isinstance(data["data"], list):
                raise ValueError("'data' field is not a list")
            
            return data
            
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse JSON response: {str(e)}")
            logging.error(f"Response content: {response.text[:1000]}...")  # Show first 1000 chars
            raise
            
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to fetch from Instagram API: {e}")
        if response:
            logging.error(f"Response status code: {response.status_code}")
            logging.error(f"Response headers: {dict(response.headers)}")
            logging.error(f"Response content: {response.text[:1000]}...")  # Show first 1000 chars
        raise

def save_json(data, filename):
    """
    Save data to JSON file with proper formatting
    """
    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        # Validate data before saving
        if not isinstance(data, dict):
            raise ValueError(f"Data must be a dictionary, got {type(data)}")
        
        # Convert to string first to validate JSON
        json_str = json.dumps(data, ensure_ascii=False, indent=2)
        
        # Write to file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(json_str)
            
        logging.info(f"Successfully saved data to {filename}")
        
    except Exception as e:
        logging.error(f"Failed to save JSON file: {e}")
        raise

def main():
    # Get access token from environment variable
    access_token = os.getenv('INSTAGRAM_ACCESS_TOKEN')
    if not access_token:
        logging.error("No access token provided. Please set INSTAGRAM_ACCESS_TOKEN environment variable.")
        sys.exit(1)

    try:
        # Create data directory if it doesn't exist
        os.makedirs('data/instagram', exist_ok=True)
        
        # Fetch media from Instagram
        logging.info("Fetching media from Instagram...")
        media_data = fetch_instagram_media(access_token)

        # Save current batch
        current_batch_file = 'data/instagram/current-batch.json'
        save_json(media_data, current_batch_file)

        # Save timestamped backup
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'data/instagram/backup_{timestamp}.json'
        save_json(media_data, backup_file)

        logging.info("Successfully completed Instagram media fetch")

    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
