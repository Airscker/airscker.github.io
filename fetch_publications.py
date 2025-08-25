#!/usr/bin/env python3
"""
Google Scholar Publications Fetcher
Automatically retrieves publications from Google Scholar and saves them as JSON
"""

import requests
import json
import time
import re
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
import os

class GoogleScholarFetcher:
    def __init__(self, user_id="0ZahlvEAAAAJ"):
        self.user_id = user_id
        self.base_url = "https://scholar.google.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def fetch_publications(self, max_pages=3):
        """Fetch publications from Google Scholar profile"""
        publications = []
        
        for page in range(max_pages):
            try:
                url = f"{self.base_url}/citations?user={self.user_id}&hl=en&oi=ao&cstart={page * 20}"
                print(f"Fetching page {page + 1}...")
                
                response = self.session.get(url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                pub_items = soup.find_all('tr', class_='gsc_a_tr')
                
                if not pub_items:
                    print(f"No more publications found on page {page + 1}")
                    break
                
                for item in pub_items:
                    pub = self._parse_publication_item(item)
                    if pub:
                        publications.append(pub)
                
                # Be respectful with rate limiting
                time.sleep(2)
                
            except Exception as e:
                print(f"Error fetching page {page + 1}: {e}")
                break
        
        return publications
    
    def _parse_publication_item(self, item):
        """Parse individual publication item"""
        try:
            # Extract title and link
            title_elem = item.find('a', class_='gsc_a_at')
            if not title_elem:
                return None
                
            title = title_elem.get_text(strip=True)
            link = title_elem.get('href')
            if link and not link.startswith('http'):
                link = self.base_url + link
            
            # Extract authors
            authors_elem = item.find('div', class_='gs_gray')
            authors = authors_elem.get_text(strip=True) if authors_elem else ""
            
            # Extract venue and year
            venue_elem = item.find('div', class_='gs_gray').find_next_sibling('div', class_='gs_gray')
            venue_info = venue_elem.get_text(strip=True) if venue_elem else ""
            
            # Parse venue and year
            venue, year = self._parse_venue_year(venue_info)
            
            # Extract citations
            citations_elem = item.find('a', class_='gsc_a_ac')
            citations = 0
            if citations_elem:
                citations_text = citations_elem.get_text(strip=True)
                if citations_text and citations_text != '*':
                    citations = int(citations_text)
            
            return {
                'title': title,
                'authors': authors,
                'venue': venue,
                'year': year,
                'citations': citations,
                'link': link,
                'scholar_link': f"https://scholar.google.com/citations?view_op=view_citation&hl=en&user={self.user_id}&citation_for_view={self.user_id}:{self._extract_citation_id(link)}" if link else None
            }
            
        except Exception as e:
            print(f"Error parsing publication item: {e}")
            return None
    
    def _parse_venue_year(self, venue_info):
        """Parse venue and year from venue information string"""
        venue = ""
        year = ""
        
        if not venue_info:
            return venue, year
        
        # Try to extract year (4-digit number)
        year_match = re.search(r'\b(19|20)\d{2}\b', venue_info)
        if year_match:
            year = year_match.group()
            venue = venue_info.replace(year, '').strip(' ,.')
        else:
            venue = venue_info
        
        return venue, year
    
    def _extract_citation_id(self, link):
        """Extract citation ID from Google Scholar link"""
        if not link:
            return None
        match = re.search(r'citation_for_view=.*?:(.*?)(?:&|$)', link)
        return match.group(1) if match else None
    
    def save_to_json(self, publications, filename='publications.json'):
        """Save publications to JSON file"""
        data = {
            'last_updated': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_publications': len(publications),
            'publications': publications
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Saved {len(publications)} publications to {filename}")
        return filename

def main():
    """Main function to fetch and save publications"""
    # Your Google Scholar user ID (from your profile URL)
    user_id = "0ZahlvEAAAAJ"  # Replace with your actual user ID
    
    fetcher = GoogleScholarFetcher(user_id)
    
    print("Fetching publications from Google Scholar...")
    publications = fetcher.fetch_publications(max_pages=3)
    
    if publications:
        filename = fetcher.save_to_json(publications)
        print(f"\nSuccessfully fetched {len(publications)} publications!")
        print(f"Data saved to: {filename}")
        
        # Print summary
        print("\nPublication Summary:")
        for i, pub in enumerate(publications[:5], 1):  # Show first 5
            print(f"{i}. {pub['title'][:60]}... ({pub['year']}) - {pub['citations']} citations")
        
        if len(publications) > 5:
            print(f"... and {len(publications) - 5} more publications")
    else:
        print("No publications found or error occurred.")

if __name__ == "__main__":
    main()
