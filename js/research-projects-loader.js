/**
 * Research Projects Loader
 * Loads research projects from JSON file and displays them dynamically
 */

class ResearchProjectsLoader {
    constructor() {
        this.projectsContainer = document.querySelector('#research .row');
        this.jsonFile = 'research-projects.json';
    }

    async loadProjects() {
        try {
            // Show loading state
            this.showLoading();
            
            // Try to fetch projects from JSON file
            const response = await fetch(this.jsonFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const projects = data.projects || [];
            
            // Hide loading and display projects
            this.hideLoading();
            this.displayProjects(projects);
            
        } catch (error) {
            console.error('Error loading research projects:', error);
            
            // If fetch fails, try to load from embedded data
            this.loadFallbackProjects();
        }
    }

    loadFallbackProjects() {
        // Fallback projects data (embedded in case JSON loading fails)
        const fallbackProjects = [
            {
                title: "LLM-driven Molecular Structure Elucidation",
                institution: "Stony Brook University",
                period: "Oct 2023 - Present",
                description: "Developing novel Large Language Models to predict molecular structures from mass spectrometry data using chain-of-thought reasoning. Implementing multi-stage training architecture (SFT, Reward Modeling, RL) inspired by state-of-the-art LLMs like DeepSeek-R1.",
                technologies: "Large Language Models, Reinforcement Learning, Chain of Thought, SMILES/InChI",
                icon: "flaticon-seo"
            },
            {
                title: "Multi-modal LLM for Materials Informatics",
                institution: "Stony Brook University",
                period: "Oct 2023 - Present",
                description: "Fine-tuned YOLOv8 and LLAMA3 models to extract molecular information from scientific literature and predict electrochemical properties using Graph Neural Networks. Achieved R² coefficient exceeding 99.1% in property prediction.",
                technologies: "Multi-modal LLMs, YOLOv8, LLAMA3, Graph Neural Networks, DFT",
                icon: "flaticon-development"
            },
            {
                title: "Variational Transformer for Quantum Systems",
                institution: "Stony Brook University",
                period: "May 2024 - Dec 2024",
                description: "Proposed and developed a novel transformer density operator ansatz to efficiently model steady states of dissipative quantum systems. Validated on dissipative Ising model with high accuracy.",
                technologies: "Transformer Architecture, Quantum Computing, Variational Methods",
                icon: "flaticon-process"
            },
            {
                title: "Diffusion Models for X-ray Spectroscopy",
                institution: "Brookhaven National Laboratory",
                period: "Mar 2023 - Present",
                description: "Constructed extensive database of X-ray Absorption Spectra and protein structures. Developing diffusion model-based multi-modal approach to reconstruct protein structures from XAS spectra.",
                technologies: "Diffusion Models, Computer Vision, Graph Neural Networks, X-ray Spectroscopy",
                icon: "flaticon-discuss-issue"
            },
            {
                title: "AI-enabled Cardiac MRI Interpretation",
                institution: "Stanford University",
                period: "Mar 2022 - Jul 2023",
                description: "Developed large vision model-based deep learning pipelines for heart disease diagnosis. Achieved over 99% accuracy in cardiac anomaly detection, surpassing human performance benchmarks.",
                technologies: "Computer Vision, Deep Learning, Medical Imaging, Large Vision Models",
                icon: "flaticon-idea"
            }
        ];

        this.hideLoading();
        this.displayProjects(fallbackProjects);
    }

    displayProjects(projects) {
        if (!this.projectsContainer) {
            console.error('Research projects container not found');
            return;
        }

        // Clear existing content
        this.projectsContainer.innerHTML = '';

        // Display each project
        projects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            this.projectsContainer.appendChild(projectElement);
        });
    }

    createProjectElement(project) {
        const projectRow = document.createElement('div');
        projectRow.className = 'row';
        
        projectRow.innerHTML = `
            <div class="col-md-12">
                <div class="research-project">
                    <div class="project-content">
                        <div class="project-icon">
                            <i class="${project.icon}"></i>
                        </div>
                        <div class="project-details">
                            <h2>${project.title}</h2>
                            <p class="project-description">${project.description}</p>
                            <p class="project-tech"><strong>Technologies:</strong> <strong>${project.technologies}</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return projectRow;
    }

    showLoading() {
        if (this.projectsContainer) {
            this.projectsContainer.innerHTML = `
                <div class="col-md-12">
                    <div class="research-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading research projects...</p>
                    </div>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading will be replaced by actual content
    }
}

// Initialize research projects loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const loader = new ResearchProjectsLoader();
    loader.loadProjects();
});
