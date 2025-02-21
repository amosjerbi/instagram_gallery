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
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to fetch from Instagram API: {e}")
        if response:
            logging.error(f"Response content: {response.text}")
        sys.exit(1)

def save_json(data, filename):
    """
    Save data to JSON file with proper formatting
    """
    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logging.info(f"Successfully saved data to {filename}")
    except Exception as e:
        logging.error(f"Failed to save JSON file: {e}")
        sys.exit(1)

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
