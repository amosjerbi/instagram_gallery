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
API_FIELDS = "id,caption,media_type,media_url,permalink,timestamp"  # Simplified fields
POSTS_PER_PAGE = 50

def fetch_instagram_media(access_token, limit=POSTS_PER_PAGE):
    """
    Fetch media from Instagram Graph API with simplified fields
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
        
        # Get the raw text first
        raw_text = response.text
        logging.info(f"Response length: {len(raw_text)} characters")
        
        # Try to clean the response if needed
        cleaned_text = raw_text.strip()
        if cleaned_text.endswith('}]}'):  # Ensure proper JSON ending
            cleaned_text = cleaned_text[:cleaned_text.rindex('}]}') + 3]
        
        try:
            # Try to parse the cleaned JSON
            data = json.loads(cleaned_text)
            
            # Validate the response structure
            if not isinstance(data, dict):
                raise ValueError(f"Response is not a valid JSON object, got {type(data)}")
            if "data" not in data:
                raise ValueError(f"Response missing 'data' field. Keys found: {list(data.keys())}")
            if not isinstance(data["data"], list):
                raise ValueError(f"'data' field is not a list, got {type(data['data'])}")
            
            # Log success info
            logging.info(f"Successfully fetched {len(data['data'])} media items")
            return data
            
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse JSON response: {str(e)}")
            logging.error("First 500 characters of response:")
            logging.error(raw_text[:500])
            logging.error("Last 500 characters of response:")
            logging.error(raw_text[-500:])
            raise
            
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to fetch from Instagram API: {e}")
        if response:
            logging.error(f"Response status code: {response.status_code}")
            logging.error(f"Response headers: {dict(response.headers)}")
            logging.error("First 500 characters of response:")
            logging.error(response.text[:500])
        raise

def save_json(data, filename):
    """
    Save data to JSON file with proper formatting and validation
    """
    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        # Validate data before saving
        if not isinstance(data, dict):
            raise ValueError(f"Data must be a dictionary, got {type(data)}")
        
        # Ensure we have the expected structure
        if "data" not in data:
            raise ValueError("Missing 'data' field in the response")
        
        # Convert to string first to validate JSON
        json_str = json.dumps(data, ensure_ascii=False, indent=2)
        
        # Write to file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(json_str)
            
        logging.info(f"Successfully saved data to {filename}")
        logging.info(f"Saved {len(data['data'])} media items")
        
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
