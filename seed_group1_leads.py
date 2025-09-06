#!/usr/bin/env python3
"""
Group 1 YouTuber Leads Seeding Script
Seeds YouTuber lead data from Excel file to ML processing system
"""
import pandas as pd
import json
import requests
import time
import re
from urllib.parse import urlparse

# Configuration
EXCEL_FILE = "youtuber_leads_group1.xlsx"
API_BASE_URL = "https://autocaption-worker.ideamlabs.workers.dev"
BATCH_SIZE = 10  # Process in batches

def extract_channel_id_from_url(url):
    """Extract channel ID from YouTube URL and estimate subscriber count"""
    if not url or pd.isna(url):
        return "", 0
    
    url = str(url).strip()
    channel_id = ""
    estimated_subs = 0
    
    # Extract channel ID from various YouTube URL formats
    if "youtube.com/channel/" in url:
        channel_id = url.split("/channel/")[-1].split("?")[0]
        # These are likely high-subscriber channels (group1 leads)
        estimated_subs = 500000  # 500K+ estimated for lead group
    elif "youtube.com/user/" in url:
        # User URLs - extract username, estimate high subs
        estimated_subs = 300000  # 300K+ estimated
    elif "youtube.com/@" in url:
        # Handle URLs - extract handle, estimate subs
        estimated_subs = 400000  # 400K+ estimated
    
    return url, estimated_subs

def clean_email(email):
    """Clean and validate email address"""
    if not email or pd.isna(email):
        return ""
    
    email = str(email).strip()
    # Basic email validation
    if "@" in email and "." in email and " " not in email:
        return email.lower()
    
    return ""

def clean_channel_name(name):
    """Clean channel name"""
    if not name or pd.isna(name):
        return ""
    
    return str(name).strip()

def seed_group1_leads(df):
    """Seed Group 1 YouTuber leads to the ML processing system"""
    success_count = 0
    error_count = 0
    skipped_count = 0
    
    print(f"Starting to seed {len(df)} Group 1 YouTuber leads...")
    
    for index, row in df.iterrows():
        try:
            # Extract and clean data from Excel columns
            youtuber_name = clean_channel_name(row.get('YouTuber Name', ''))
            channel_name = clean_channel_name(row.get('YouTuber Channel', ''))
            channel_url, estimated_subs = extract_channel_id_from_url(row.get('Channel URL', ''))
            email = clean_email(row.get('YouTuber Public Email', ''))
            
            # Use channel name if youtuber name is empty
            display_name = youtuber_name or channel_name
            
            # Skip if essential data is missing
            if not display_name or not email:
                skipped_count += 1
                print(f"SKIP Row {index + 1}: Missing name or email ({display_name}, {email})")
                continue
            
            # Skip if email seems invalid
            if len(email) < 5 or email.count('@') != 1:
                skipped_count += 1
                print(f"SKIP Row {index + 1}: Invalid email format: {email}")
                continue
            
            # Prepare payload for ML system
            payload = {
                "channel": display_name,
                "email": email,
                "url": channel_url,
                "subscribers": estimated_subs,  # High-value estimated subscribers
                "category": "group1_leads",
                "description": f"Group 1 lead: {youtuber_name} ({channel_name})",
                "source": "youtuber_leads_group1_excel",
                "priority": "high"  # Mark as high priority leads
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
                    print(f"OK Row {index + 1}: {display_name} ({email}) - {estimated_subs:,} est. subs [HIGH PRIORITY]")
                else:
                    error_count += 1
                    print(f"ERROR Row {index + 1}: Failed to seed {display_name}: {response.status_code} - {response.text[:100]}")
                    
            except requests.exceptions.RequestException as e:
                error_count += 1
                print(f"ERROR Row {index + 1}: Network error seeding {display_name}: {str(e)}")
            
            # Rate limiting - pause every batch
            if (index + 1) % BATCH_SIZE == 0:
                print(f"Processed {index + 1}/{len(df)} group1 leads. Pausing briefly...")
                time.sleep(2)
                
        except Exception as e:
            error_count += 1
            print(f"ERROR Row {index + 1}: Processing error: {str(e)}")
    
    print(f"\n=== Group 1 Leads Seeding Complete ===")
    print(f"Successfully seeded: {success_count}")
    print(f"Errors: {error_count}")
    print(f"Skipped: {skipped_count}")
    print(f"Total processed: {success_count + error_count + skipped_count}")
    
    return success_count, error_count, skipped_count

def main():
    """Main execution function"""
    try:
        # Load Excel file
        print(f"Loading {EXCEL_FILE}...")
        df = pd.read_excel(EXCEL_FILE)
        
        print(f"Found {len(df)} Group 1 lead records")
        print(f"Columns: {df.columns.tolist()}")
        
        # Display preview of lead data
        print(f"\nPreview of first 3 Group 1 leads:")
        for i, row in df.head(3).iterrows():
            name = row.get('YouTuber Name', 'N/A')
            channel = row.get('YouTuber Channel', 'N/A')
            email = row.get('YouTuber Public Email', 'N/A')
            print(f"  {i+1}. {name} / {channel} -> {email}")
        
        # Count valid emails
        email_col = 'YouTuber Public Email'
        valid_emails = df[df[email_col].notna() & (df[email_col] != '')][email_col].count()
        print(f"\nFound {valid_emails} Group 1 leads with email addresses")
        
        if valid_emails == 0:
            print("No valid email addresses found in Group 1 leads. Exiting.")
            return
        
        # Proceed with seeding
        print(f"\nProceeding to seed Group 1 YouTuber leads to ML system...")
        print("NOTE: These are marked as HIGH PRIORITY leads with estimated high subscriber counts")
        
        # Seed the data
        success, errors, skipped = seed_group1_leads(df)
        
        if success > 0:
            print(f"\nSUCCESS: Seeded {success} Group 1 YouTuber leads for ML processing!")
            print("These high-value leads are now prioritized in your ML pipeline.")
        else:
            print("No Group 1 leads were successfully seeded. Please check the data format and API connectivity.")
        
    except FileNotFoundError:
        print(f"Error: {EXCEL_FILE} not found in current directory")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()