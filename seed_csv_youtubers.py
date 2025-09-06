#!/usr/bin/env python3
"""
CSV YouTuber Data Seeding Script
Seeds YouTuber email data from the extracted CSV file to ML processing system
"""
import pandas as pd
import json
import requests
import time
import re
from urllib.parse import urlparse

# Configuration
CSV_FILE = "20k to 25k business - Sheet2.csv"
API_BASE_URL = "https://autocaption-worker.ideamlabs.workers.dev"
BATCH_SIZE = 5  # Process in smaller batches for CSV data
TEST_MODE = False  # Set to False to process all records
TEST_LIMIT = 10  # Only process first 10 records in test mode

def extract_subscribers_count(sub_string):
    """Extract numeric subscriber count from string like '23K subscribers,'"""
    if not sub_string or pd.isna(sub_string):
        return 0
    
    sub_string = str(sub_string).strip()
    # Extract number and multiplier (K, M, etc.)
    match = re.search(r'(\d+(?:\.\d+)?)\s*([KMB]?)', sub_string.upper())
    if match:
        number = float(match.group(1))
        multiplier = match.group(2)
        
        if multiplier == 'K':
            return int(number * 1000)
        elif multiplier == 'M':
            return int(number * 1000000)
        elif multiplier == 'B':
            return int(number * 1000000000)
        else:
            return int(number)
    
    return 0

def clean_channel_url(url):
    """Clean and validate YouTube channel URL"""
    if not url or pd.isna(url):
        return ""
    
    url = str(url).strip()
    # Extract channel ID from playboard URL if present
    if "playboard.co/en/channel/" in url:
        # Extract the channel ID and convert to YouTube URL
        channel_id = url.split("/channel/")[-1]
        return f"https://youtube.com/channel/{channel_id}"
    
    # Return as-is if already a YouTube URL
    if "youtube.com" in url or "youtu.be" in url:
        return url
    
    return ""

def clean_email(email):
    """Clean and validate email address"""
    if not email or pd.isna(email):
        return ""
    
    email = str(email).strip()
    # Basic email validation
    if "@" in email and "." in email and " " not in email:
        return email.lower()
    
    return ""

def extract_channel_name(name_field):
    """Extract clean channel name"""
    if not name_field or pd.isna(name_field):
        return ""
    
    return str(name_field).strip()

def seed_csv_youtuber_data(df):
    """Seed YouTuber data from CSV to the ML processing system"""
    success_count = 0
    error_count = 0
    skipped_count = 0
    
    print(f"Starting to seed {len(df)} YouTuber records from CSV...")
    
    for index, row in df.iterrows():
        try:
            # Extract and clean data from CSV columns
            channel_url = clean_channel_url(row.get('channel link', ''))
            name = extract_channel_name(row.get('name', ''))
            description = str(row.get('description', '')).strip()
            subscribers = extract_subscribers_count(row.get('no of subs', ''))
            email = clean_email(row.get('Email', ''))
            
            # Skip if essential data is missing
            if not name or not email:
                skipped_count += 1
                print(f"SKIP Row {index + 1}: Missing name or email ({name}, {email})")
                continue
            
            # Skip if email seems invalid
            if len(email) < 5 or email.count('@') != 1:
                skipped_count += 1
                print(f"SKIP Row {index + 1}: Invalid email format: {email}")
                continue
            
            # Prepare payload for ML system
            payload = {
                "channel": name,
                "email": email,
                "url": channel_url,
                "subscribers": subscribers,
                "category": "csv_seeded",
                "description": description[:500] if description else "",  # Limit description length
                "source": "20k-25k-business-csv"
            }
            
            # Send to YouTuber data collection endpoint
            try:
                response = requests.post(
                    f"{API_BASE_URL}/youtuber-data",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=30
                )
                
                if response.status_code == 200:
                    success_count += 1
                    print(f"OK Row {index + 1}: {name} ({email}) - {subscribers:,} subs")
                else:
                    error_count += 1
                    print(f"ERROR Row {index + 1}: Failed to seed {name}: {response.status_code} - {response.text[:100]}")
                    
            except requests.exceptions.RequestException as e:
                error_count += 1
                print(f"ERROR Row {index + 1}: Network error seeding {name}: {str(e)}")
            
            # Rate limiting - pause every batch
            if (index + 1) % BATCH_SIZE == 0:
                print(f"Processed {index + 1}/{len(df)} records. Pausing briefly...")
                time.sleep(2)
                
        except Exception as e:
            error_count += 1
            print(f"ERROR Row {index + 1}: Processing error: {str(e)}")
    
    print(f"\n=== CSV Seeding Complete ===")
    print(f"Successfully seeded: {success_count}")
    print(f"Errors: {error_count}")
    print(f"Skipped: {skipped_count}")
    print(f"Total processed: {success_count + error_count + skipped_count}")
    
    return success_count, error_count, skipped_count

def main():
    """Main execution function"""
    try:
        # Load CSV file with proper handling of multiline fields
        print(f"Loading {CSV_FILE}...")
        df = pd.read_csv(CSV_FILE, quotechar='"', skipinitialspace=True)
        
        print(f"Found {len(df)} records with columns: {df.columns.tolist()}")
        
        # Apply test mode limit if enabled
        if TEST_MODE:
            df = df.head(TEST_LIMIT)
            print(f"TEST MODE: Processing only first {TEST_LIMIT} records")
        
        # Display preview of email data
        print(f"\nPreview of first 3 email records:")
        for i, row in df.head(3).iterrows():
            name = row.get('name', 'N/A')
            email = row.get('Email', 'N/A')
            subs = row.get('no of subs', 'N/A')
            print(f"  {i+1}. {name} - {email} ({subs})")
        
        # Count valid emails
        valid_emails = df[df['Email'].notna() & (df['Email'] != '')]['Email'].count()
        print(f"\nFound {valid_emails} records with email addresses")
        
        if valid_emails == 0:
            print("No valid email addresses found in CSV. Exiting.")
            return
        
        # Proceed with seeding
        print(f"\nProceeding to seed YouTuber email data to ML system...")
        
        # Seed the data
        success, errors, skipped = seed_csv_youtuber_data(df)
        
        if success > 0:
            print(f"\nSUCCESS: Seeded {success} YouTuber email records for ML processing!")
            print("The ML system can now begin outreach and processing workflows.")
        else:
            print("No records were successfully seeded. Please check the data format and API connectivity.")
        
    except FileNotFoundError:
        print(f"Error: {CSV_FILE} not found in current directory")
        print("Make sure you've extracted the archive(19).zip file first.")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()