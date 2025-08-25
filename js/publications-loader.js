/**
 * Publications Loader
 * Loads publications from JSON file and displays them dynamically
 */

class PublicationsLoader {
    constructor() {
        this.publicationsContainer = document.querySelector('.publication-list');
        this.jsonFile = 'publications.json';
        this.maxDisplayed = 10; // Maximum number of publications to display
    }

    async loadPublications() {
        try {
            // Show loading state
            this.showLoading();
            
            // Try to fetch publications from JSON file
            const response = await fetch(this.jsonFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const publications = data.publications || [];
            
            // Hide loading and display publications
            this.hideLoading();
            this.displayPublications(publications);
            
            // Update last updated info
            this.updateLastUpdated(data.last_updated);
            
        } catch (error) {
            console.error('Error loading publications:', error);
            
            // If fetch fails, try to load from embedded data
            this.loadFallbackPublications();
        }
    }

    loadFallbackPublications() {
        // Fallback publications data (embedded in case JSON loading fails)
        const fallbackPublications = [
            {
                title: "Screening and diagnosis of cardiovascular disease using artificial intelligence-enabled cardiac magnetic resonance imaging",
                venue: "Nature Medicine",
                year: "2024",
                citations: 94,
                link: "https://www.nature.com/articles/s41591-024-02971-2"
            },
            {
                title: "Variational transformer ansatz for the density operator of steady states in dissipative quantum many-body systems",
                venue: "Physical Review B",
                year: "2025",
                citations: 1,
                link: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=0ZahlvEAAAAJ&citation_for_view=0ZahlvEAAAAJ:d1gkVwhDpl0C"
            },
            {
                title: "Spectra-to-Structure and Structure-to-Spectra Inference Across the Periodic Table",
                venue: "arXiv",
                year: "2025",
                citations: 0,
                link: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=0ZahlvEAAAAJ&citation_for_view=0ZahlvEAAAAJ:2osOgNQ5qMEC"
            },
            {
                title: "An X-ray absorption spectrum database for iron-containing proteins",
                venue: "arXiv",
                year: "2025",
                citations: 0,
                link: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=0ZahlvEAAAAJ&citation_for_view=0ZahlvEAAAAJ:9yKSN-GCB0IC"
            }
        ];

        this.hideLoading();
        this.displayPublications(fallbackPublications);
        this.showFallbackMessage();
    }

    displayPublications(publications) {
        if (!this.publicationsContainer) {
            console.error('Publications container not found');
            return;
        }

        // Clear existing content
        this.publicationsContainer.innerHTML = '';

        // Display publications (limit to maxDisplayed)
        const publicationsToShow = publications.slice(0, this.maxDisplayed);
        
        publicationsToShow.forEach(pub => {
            const pubElement = this.createPublicationElement(pub);
            this.publicationsContainer.appendChild(pubElement);
        });

        // Add "show more" button if there are more publications
        if (publications.length > this.maxDisplayed) {
            this.addShowMoreButton(publications.length - this.maxDisplayed);
        }
    }

    createPublicationElement(pub) {
        const pubItem = document.createElement('div');
        pubItem.className = 'publication-item';
        
        // Get the best available link (prefer direct paper link over Google Scholar)
        const paperLink = pub.link || pub.scholar_link || '#';
        
        // Create publication HTML with title first (clickable), then venue directly from JSON
        pubItem.innerHTML = `
            <div class="pub-info">
                <h4 class="pub-title">
                    <a href="${paperLink}" target="_blank">
                        <strong>${pub.title}</strong>
                    </a>
                </h4>
                <p class="pub-venue">${pub.venue}</p>
            </div>
        `;
        
        return pubItem;
    }

    addShowMoreButton(remainingCount) {
        const showMoreBtn = document.createElement('div');
        showMoreBtn.className = 'publication-item show-more';
        showMoreBtn.innerHTML = `
            <div class="pub-info">
                <p class="pub-title">
                    <a href="https://scholar.google.com/citations?user=0ZahlvEAAAAJ&hl=en" target="_blank">
                        View ${remainingCount} more publications on Google Scholar →
                    </a>
                </p>
            </div>
        `;
        
        this.publicationsContainer.appendChild(showMoreBtn);
    }

    showLoading() {
        if (this.publicationsContainer) {
            this.publicationsContainer.innerHTML = `
                <div class="publication-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading publications...</p>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading will be replaced by actual content
    }

    showFallbackMessage() {
        // Add a small note that we're using fallback data
        const fallbackNote = document.createElement('div');
        fallbackNote.className = 'fallback-note';
        fallbackNote.style.cssText = 'text-align: center; margin-top: 10px; font-size: 11px; color: #999; font-style: italic;';
        fallbackNote.innerHTML = 'Using cached publication data';
        
        const container = this.publicationsContainer.parentElement;
        if (container) {
            container.appendChild(fallbackNote);
        }
    }

    updateLastUpdated(timestamp) {
        // You can add a small indicator showing when data was last updated
        const lastUpdated = document.createElement('div');
        lastUpdated.className = 'last-updated';
        lastUpdated.style.cssText = 'text-align: center; margin-top: 20px; font-size: 12px; color: #999;';
        lastUpdated.innerHTML = `Last updated: ${timestamp}`;
        
        const container = this.publicationsContainer.parentElement;
        if (container) {
            container.appendChild(lastUpdated);
        }
    }
}

// Initialize publications loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const loader = new PublicationsLoader();
    loader.loadPublications();
});
