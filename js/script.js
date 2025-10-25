// API Base URL - Change if your backend is running on different port
const API_BASE_URL = 'http://localhost:5000';

// Global variable to store current analysis results
let currentAnalysis = null;

// Show demo on home page
function showDemo() {
    const demoSection = document.getElementById('demo-section');
    if (demoSection) {
        demoSection.style.display = 'block';
        demoSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Validate file type
function validateFile(file) {
    const allowedTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload a PDF or DOCX file only.');
    }

    if (file.size > maxSize) {
        throw new Error('File size should be less than 5MB.');
    }

    if (file.size === 0) {
        throw new Error('File appears to be empty.');
    }

    return true;
}

// Show loading animation
function showLoading() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const errorSection = document.getElementById('errorSection');

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');
}

// Hide loading animation
function hideLoading() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingSection = document.getElementById('loadingSection');

    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = 'Analyze Resume';
    loadingSection.classList.add('hidden');
}

// Main function to analyze resume
async function analyzeResume() {
    const fileInput = document.getElementById('resumeFile');
    const resultsSection = document.getElementById('resultsSection');
    const errorSection = document.getElementById('errorSection');

    try {
        // Validate file selection
        if (!fileInput.files || fileInput.files.length === 0) {
            throw new Error('Please select a resume file to analyze.');
        }

        const file = fileInput.files[0];
        
        // Validate file type and size
        validateFile(file);

        // Show loading state
        showLoading();

        // Create form data
        const formData = new FormData();
        formData.append('resume', file);

        // Show progress (simulated)
        simulateProgress();

        // Send to backend API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

        const response = await fetch(`${API_BASE_URL}/api/analyze-resume`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
            currentAnalysis = data;
            displayResults(data);
            // Track successful analysis
            trackAnalysis('success', data.resume_analysis.resume_type);
        } else {
            throw new Error(data.error || 'Analysis failed. Please try again.');
        }

    } catch (error) {
        console.error('Analysis Error:', error);
        
        let errorMessage = 'Analysis failed. ';
        
        if (error.name === 'AbortError') {
            errorMessage += 'Request timed out. Please try again.';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            errorMessage += 'Cannot connect to server. Make sure backend is running on port 5000.';
        } else {
            errorMessage += error.message;
        }
        
        showError(errorMessage);
        // Track failed analysis
        trackAnalysis('error', error.message);
    } finally {
        hideLoading();
    }
}

// Simulate progress for better UX
function simulateProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar && progressText) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) {
                progress = 90; // Don't go to 100% until actual completion
            }
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Processing... ${Math.round(progress)}%`;
        }, 200);

        // Store interval ID to clear later
        window.progressInterval = interval;
    }
}

// Clear progress simulation
function clearProgress() {
    if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = null;
    }
    
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar && progressText) {
        progressBar.style.width = '100%';
        progressText.textContent = 'Complete!';
        
        // Reset after a delay
        setTimeout(() => {
            progressBar.style.width = '0%';
            progressText.textContent = 'Starting analysis...';
        }, 1000);
    }
}

// Display analysis results
function displayResults(data) {
    const resultsSection = document.getElementById('resultsSection');
    const basicInfo = document.getElementById('basicInfo');
    const skillsList = document.getElementById('skillsList');
    const jobRecommendations = document.getElementById('jobRecommendations');
    const suggestionsList = document.getElementById('suggestionsList');

    // Clear progress
    clearProgress();

    // Show results section with animation
    resultsSection.classList.remove('hidden');
    resultsSection.style.opacity = '0';
    resultsSection.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        resultsSection.style.transition = 'all 0.5s ease';
        resultsSection.style.opacity = '1';
        resultsSection.style.transform = 'translateY(0)';
    }, 100);

    // Display basic info with resume type
    const domainColors = {
        'technical': '#667eea',
        'management': '#51cf66',
        'marketing': '#ffa94d',
        'finance': '#ff6b6b',
        'design': '#cc5de8',
        'general': '#868e96'
    };

    const domainColor = domainColors[data.resume_analysis.resume_type] || '#667eea';

    basicInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
            <div style="font-size: 2rem;">
                ${getDomainIcon(data.resume_analysis.resume_type)}
            </div>
            <div>
                <h3 style="margin: 0; color: #333;">Resume Analysis Complete</h3>
                <p style="margin: 0.25rem 0; color: #666;">Detected as <strong>${data.resume_analysis.resume_type.toUpperCase()}</strong> resume</p>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5rem; color: ${domainColor}; margin-bottom: 0.5rem;">
                    <i class="fas fa-font"></i>
                </div>
                <strong>${data.resume_analysis.word_count}</strong>
                <div style="font-size: 0.8rem; color: #666;">Words</div>
            </div>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5rem; color: ${domainColor}; margin-bottom: 0.5rem;">
                    <i class="fas fa-text-height"></i>
                </div>
                <strong>${data.resume_analysis.character_count}</strong>
                <div style="font-size: 0.8rem; color: #666;">Characters</div>
            </div>
            
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5rem; color: ${domainColor}; margin-bottom: 0.5rem;">
                    <i class="fas fa-briefcase"></i>
                </div>
                <strong>${data.resume_analysis.experience_years || 'N/A'}</strong>
                <div style="font-size: 0.8rem; color: #666;">Years Experience</div>
            </div>
        </div>

        ${data.resume_analysis.education && data.resume_analysis.education.length > 0 ? `
            <div style="margin-top: 1.5rem;">
                <h4><i class="fas fa-graduation-cap"></i> Education</h4>
                <div style="background: white; padding: 1rem; border-radius: 8px; border-left: 4px solid ${domainColor};">
                    ${data.resume_analysis.education.map(edu => 
                        `<div style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                            <i class="fas fa-check" style="color: ${domainColor}; margin-right: 0.5rem;"></i>
                            ${edu}
                         </div>`
                    ).join('')}
                </div>
            </div>
        ` : ''}
    `;

    // Display skills with categorization
    const skills = data.resume_analysis.skills;
    skillsList.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            <div>
                <h4><i class="fas fa-star" style="color: ${domainColor};"></i> Domain Skills</h4>
                <div style="background: white; padding: 1rem; border-radius: 8px; min-height: 100px;">
                    ${skills.domain_specific_skills.length > 0 ? 
                        skills.domain_specific_skills.map(skill => 
                            `<span class="skill-tag" style="background: ${domainColor};">${skill}</span>`
                        ).join('') 
                        : '<p style="color: #666; font-style: italic;">No domain-specific skills detected</p>'
                    }
                </div>
            </div>
            
            <div>
                <h4><i class="fas fa-users" style="color: #ff6b6b;"></i> Soft Skills</h4>
                <div style="background: white; padding: 1rem; border-radius: 8px; min-height: 100px;">
                    ${skills.soft_skills.length > 0 ? 
                        skills.soft_skills.map(skill => 
                            `<span class="skill-tag" style="background: #ff6b6b;">${skill}</span>`
                        ).join('') 
                        : '<p style="color: #666; font-style: italic;">No soft skills detected</p>'
                    }
                </div>
            </div>
            
            <div>
                <h4><i class="fas fa-cogs" style="color: #51cf66;"></i> Other Technical Skills</h4>
                <div style="background: white; padding: 1rem; border-radius: 8px; min-height: 100px;">
                    ${skills.all_technical_skills.length > 0 ? 
                        skills.all_technical_skills.map(skill => 
                            `<span class="skill-tag" style="background: #51cf66;">${skill}</span>`
                        ).join('') 
                        : '<p style="color: #666; font-style: italic;">No other technical skills detected</p>'
                    }
                </div>
            </div>
        </div>
        
        <div style="margin-top: 1rem; text-align: center; color: #666;">
            <i class="fas fa-info-circle"></i> 
            Total ${skills.all_technical_skills.length + skills.soft_skills.length} skills identified
        </div>
    `;

    // Display job recommendations with better scoring
    const jobs = data.job_recommendations;
    jobRecommendations.innerHTML = Object.entries(jobs)
        .slice(0, 6) // Show top 6 recommendations
        .map(([job, info]) => {
            const scoreColor = getScoreColor(info.final_score);
            const domainIcon = getDomainIcon(info.domain);
            
            return `
                <div class="job-card" style="border-left-color: ${scoreColor};">
                    <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 1rem;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                                ${domainIcon}
                                ${formatJobTitle(job)}
                            </h4>
                            <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">
                                ${info.domain.toUpperCase()} Domain
                            </p>
                        </div>
                        <div class="job-score" style="color: ${scoreColor};">
                            ${info.final_score.toFixed(0)}%
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <small style="color: #666;">Skill Match</small>
                            <div style="background: #f8f9fa; height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: ${scoreColor}; height: 100%; width: ${info.skill_match_score}%;"></div>
                            </div>
                            <div style="font-size: 0.8rem; color: #666;">${info.skill_match_score}%</div>
                        </div>
                        <div>
                            <small style="color: #666;">Domain Bonus</small>
                            <div style="font-size: 0.9rem; color: ${scoreColor};">
                                +${info.domain_bonus}%
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem;">
                        <strong>Key Matches:</strong>
                        <div style="margin-top: 0.5rem;">
                            ${info.matched_skills.slice(0, 4).map(skill => 
                                `<span class="skill-tag" style="background: ${scoreColor}; font-size: 0.8rem;">${skill}</span>`
                            ).join('')}
                            ${info.matched_skills.length > 4 ? 
                                `<span class="skill-tag" style="background: #868e96; font-size: 0.8rem;">+${info.matched_skills.length - 4} more</span>` 
                                : ''
                            }
                        </div>
                    </div>
                    
                    ${info.missing_skills.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong>To Improve:</strong>
                            <div style="margin-top: 0.5rem;">
                                ${info.missing_skills.slice(0, 3).map(skill => 
                                    `<span class="skill-tag" style="background: #ffa8a8; color: #c92a2a; font-size: 0.8rem;">${skill}</span>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

    // Display suggestions
    const suggestions = data.improvement_suggestions;
    suggestionsList.innerHTML = suggestions.map(suggestion => `
        <div style="background: white; padding: 1.5rem; margin: 1rem 0; border-radius: 10px; border-left: 4px solid #ffd43b; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                ${getSuggestionIcon(suggestion.type)}
                ${getSuggestionTitle(suggestion.type)}
            </h4>
            <p style="margin: 0.5rem 0; color: #333;">${suggestion.message}</p>
            ${suggestion.skills ? `
                <div style="margin: 0.5rem 0;">
                    <strong>Focus on:</strong>
                    <div style="margin-top: 0.5rem;">
                        ${suggestion.skills.map(skill => 
                            `<span class="skill-tag" style="background: #fff3bf; color: #e67700; border: 1px solid #ffd8a8;">${skill}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
            ${suggestion.advice ? `
                <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem;">
                    <strong>💡 Advice:</strong> ${suggestion.advice}
                </div>
            ` : ''}
        </div>
    `).join('');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Helper functions
function getDomainIcon(domain) {
    const icons = {
        'technical': '🔧',
        'management': '👔',
        'marketing': '📈',
        'finance': '💰',
        'design': '🎨',
        'general': '📄'
    };
    return icons[domain] || '📄';
}

function getScoreColor(score) {
    if (score >= 80) return '#51cf66';
    if (score >= 60) return '#ffa94d';
    if (score >= 40) return '#ffa8a8';
    return '#ff6b6b';
}

function getSuggestionIcon(type) {
    const icons = {
        'skill_gap': '🔧',
        'domain_switch': '🔄',
        'experience': '💼',
        'education': '🎓',
        'content': '📝'
    };
    return icons[type] || '💡';
}

function formatJobTitle(job) {
    const titleMap = {
        'software_developer': 'Software Developer',
        'data_scientist': 'Data Scientist', 
        'web_developer': 'Web Developer',
        'project_manager': 'Project Manager',
        'product_manager': 'Product Manager',
        'digital_marketer': 'Digital Marketer',
        'marketing_manager': 'Marketing Manager',
        'financial_analyst': 'Financial Analyst',
        'accountant': 'Accountant',
        'ui_ux_designer': 'UI/UX Designer',
        'graphic_designer': 'Graphic Designer'
    };
    
    return titleMap[job] || job.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function getSuggestionTitle(type) {
    const titles = {
        'skill_gap': 'Skill Development',
        'domain_switch': 'Domain Transition',
        'experience': 'Experience Enhancement',
        'education': 'Education & Certification',
        'content': 'Content Improvement'
    };
    return titles[type] || 'Improvement Suggestion';
}

function showError(message) {
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    const errorSection = document.getElementById('errorSection');
    errorSection.classList.add('hidden');
}

function analyzeAnother() {
    // Reset the form
    document.getElementById('resumeFile').value = '';
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('errorSection').classList.add('hidden');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Analytics tracking (optional)
function trackAnalysis(type, data) {
    // You can integrate with Google Analytics or other tracking here
    console.log(`Analysis ${type}:`, data);
}

// Drag and drop functionality
function initializeDragAndDrop() {
    const uploadContainer = document.querySelector('.upload-container');
    const fileInput = document.getElementById('resumeFile');
    
    if (!uploadContainer || !fileInput) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    uploadContainer.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        uploadContainer.style.background = 'rgba(102, 126, 234, 0.1)';
        uploadContainer.style.borderColor = '#667eea';
    }
    
    function unhighlight() {
        uploadContainer.style.background = '#f8f9fa';
        uploadContainer.style.borderColor = '#667eea';
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            // Trigger analysis after a short delay
            setTimeout(() => analyzeResume(), 500);
        }
    }
}

// Check backend connection on page load
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (!response.ok) {
            console.warn('Backend server might not be running');
        }
    } catch (error) {
        console.warn('Cannot connect to backend server. Make sure it\'s running on port 5000.');
    }
    
    // Initialize drag and drop
    initializeDragAndDrop();
});

// Add event listener for file input change
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('resumeFile');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                // You can add file preview logic here if needed
                console.log('File selected:', this.files[0].name);
            }
        });
    }
});