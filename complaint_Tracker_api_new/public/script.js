
const API_URL = "/complaints";


const complaintForm = document.getElementById("complaintForm");
if (complaintForm) {
    complaintForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const wing = document.getElementById("wing").value;
        const room = document.getElementById("room").value;
        const name = document.getElementById("name").value;
        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const email = document.getElementById("email").value;
        const messageDiv = document.getElementById("message");

        // Validate required fields
        if (!wing) {
            messageDiv.style.color = "red";
            messageDiv.textContent = "Please select your Wing/Block.";
            return;
        }
        
        if (!room) {
            messageDiv.style.color = "red";
            messageDiv.textContent = "Please enter your room number.";
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title, description, email, name, wing, room })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.style.color = "green";
                messageDiv.textContent = `Success! Complaint ID: ${data.complaint ? data.complaint.id : 'N/A'}`;
                complaintForm.reset();
                document.getElementById("wing").value = "";
                document.getElementById("similarIssuesContainer").style.display = "none";
            } else {
                messageDiv.style.color = "red";
                messageDiv.textContent = `Error: ${data.message}`;
            }
        } catch (error) {
            console.error(error);
            messageDiv.style.color = "red";
            messageDiv.textContent = "Failed to submit complaint.";
        }
    });
}

// Admin Dashboard Functions
let allComplaints = [];

async function loadComplaints() {
    const pendingContainer = document.getElementById("pending-cards");
    if (!pendingContainer) return; // Not on admin page

    try {
        const response = await fetch(API_URL);
        allComplaints = await response.json();
        
        renderBoard(allComplaints);

    } catch (error) {
        console.error("Error loading complaints:", error);
    }
}

function renderBoard(complaintsList) {
    const pendingContainer = document.getElementById("pending-cards");
    const resolvedContainer = document.getElementById("resolved-cards");
    const rejectedContainer = document.getElementById("rejected-cards");

    // Clear existing
    if(pendingContainer) pendingContainer.innerHTML = "";
    if(resolvedContainer) resolvedContainer.innerHTML = "";
    if(rejectedContainer) rejectedContainer.innerHTML = "";

    if (complaintsList.length === 0) {
        pendingContainer.innerHTML = "<p style='text-align:center; color:#999;'>No complaints found.</p>";
        return;
    }

    complaintsList.forEach(complaint => {
        const card = document.createElement("div");
        card.className = "complaint-card";

     
        
        let actionsHtml = "";
        
        if (complaint.status === "pending") {
            actionsHtml += `
                <button class="action-btn btn-resolve" onclick="updateStatus(${complaint.id}, 'resolved')">Resolve</button>
                <button class="action-btn btn-reject" onclick="updateStatus(${complaint.id}, 'rejected')">Reject</button>
            `;
        }
        
        // Delete is always available
        actionsHtml += `<button class="action-btn btn-delete" onclick="deleteComplaint(${complaint.id})">Delete</button>`;


        card.innerHTML = `
            <div class="meta">ID: #${complaint.id}</div>
            <h4>${complaint.title}</h4>
            <p>${complaint.description}</p>
            ${complaint.name ? `<p><strong>Reported by:</strong> ${complaint.name}</p>` : ''}
            ${complaint.wing && complaint.room ? `<p><strong>Location:</strong> ${complaint.wing} - Room ${complaint.room}</p>` : ''}
            ${complaint.meTooCount > 0 ? `<div class="me-too-indicator">${complaint.meTooCount} students affected</div>` : ''}
            <div class="card-actions">
                ${actionsHtml}
            </div>
        `;

        if (complaint.status === "pending") {
            pendingContainer.appendChild(card);
        } else if (complaint.status === "resolved") {
            resolvedContainer.appendChild(card);
        } else if (complaint.status === "rejected") {
            rejectedContainer.appendChild(card);
        }
    });
}

function filterComplaints() {
    const searchInput = document.getElementById("searchInput");
    const query = searchInput.value.toLowerCase();

    const filtered = allComplaints.filter(c => 
        c.id.toString().includes(query) || 
        c.title.toLowerCase().includes(query) || 
        c.description.toLowerCase().includes(query)
    );

    renderBoard(filtered);
}


async function updateStatus(id, status) {
    if (!confirm(`Are you sure you want to mark this as ${status}?`)) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "secret-admin-key"
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            loadComplaints(); // Refresh table
        } else {
            alert("Failed to update status");
        }
    } catch (error) {
        console.error(error);
        alert("Error updating status");
    }
}

async function deleteComplaint(id) {
    if (!confirm("Are you sure you want to delete this complaint? This cannot be undone.")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "secret-admin-key"
            }
        });

        if (response.ok) {
            loadComplaints(); // Refresh table
        } else {
            alert("Failed to delete complaint");
        }
    } catch (error) {
        console.error(error);
        alert("Error deleting complaint");
    }
}

// Tab functionality for index.html
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Load complaints for specific user
async function loadUserComplaints() {
    const email = document.getElementById('searchEmail').value;
    const container = document.getElementById('userComplaintsContainer');
    
    if (!email) {
        container.innerHTML = '<p style="color: red; text-align: center;">Please enter your email address.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/user/${encodeURIComponent(email)}`);
        const userComplaints = await response.json();
        
        if (userComplaints.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No complaints found for this email address.</p>';
            return;
        }
        
        // Display user complaints
        let complaintsHtml = '<div class="user-complaints">';
        userComplaints.forEach(complaint => {
            const statusClass = `status-${complaint.status}`;
            complaintsHtml += `
                <div class="user-complaint-card">
                    <div class="complaint-header">
                        <h3>${complaint.title}</h3>
                        <span class="complaint-id">ID: #${complaint.id}</span>
                        <span class="complaint-status ${statusClass}">${complaint.status.toUpperCase()}</span>
                    </div>
                    <p class="complaint-description">${complaint.description}</p>
                </div>
            `;
        });
        complaintsHtml += '</div>';
        
        container.innerHTML = complaintsHtml;
        
    } catch (error) {
        console.error('Error loading user complaints:', error);
        container.innerHTML = '<p style="color: red; text-align: center;">Error loading complaints. Please try again.</p>';
    }
}

// Check for similar issues in the same wing
async function checkSimilarIssues() {
    const wing = document.getElementById('wing').value;
    const room = document.getElementById('room').value;
    
    if (!wing) {
        const messageDiv = document.getElementById('message');
        messageDiv.style.color = "red";
        messageDiv.textContent = "Please select your Building Block first!";
        document.getElementById('wing').focus();
        return;
    }
    
    if (!room) {
        const messageDiv = document.getElementById('message');
        messageDiv.style.color = "red";
        messageDiv.textContent = "Please enter your room number first!";
        document.getElementById('room').focus();
        return;
    }
    
    // Clear any previous messages
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = "";
    
    try {
        const response = await fetch(`${API_URL}/similar/${wing}`);
        const similarComplaints = await response.json();
        
        displaySimilarIssues(similarComplaints);
    } catch (error) {
        console.error('Error fetching similar issues:', error);
        const messageDiv = document.getElementById('message');
        messageDiv.style.color = "red";
        messageDiv.textContent = "Error checking for similar issues. Please try again.";
    }
}

// Display similar issues
function displaySimilarIssues(complaints) {
    const container = document.getElementById('similarIssuesContainer');
    const listContainer = document.getElementById('similarIssuesList');
    
    if (complaints.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #00b894; font-weight: 600;">
                No active issues found in your wing! You can submit a new complaint below.
            </div>
        `;
    } else {
        listContainer.innerHTML = complaints.map(complaint => `
            <div class="similar-issue-card">
                <div class="similar-issue-header">
                    <h4 class="similar-issue-title">${complaint.title}</h4>
                    ${complaint.meTooCount > 0 ? `<span class="me-too-count">${complaint.meTooCount} affected</span>` : ''}
                </div>
                
                <p class="similar-issue-description">${complaint.description}</p>
                
                <div class="similar-issue-meta">
                    <span>Location: Room ${complaint.room} | Date: ${formatDate(complaint.createdAt)}</span>
                    <span>Reported by: ${complaint.name}</span>
                </div>
                
                <button 
                    class="me-too-btn" 
                    onclick="addMeToo('${complaint.id}')"
                >
                    Me Too - I have this issue!
                </button>
            </div>
        `).join('');
    }
    
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Add "Me Too" support
async function addMeToo(complaintId) {
    // Always prompt for email to ensure proper unique identification
    const userEmail = prompt('Please enter your email to support this issue:');
    
    if (!userEmail || !userEmail.includes('@')) {
        alert('Please enter a valid email address');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/metoo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                complaintId: complaintId,
                userEmail: userEmail
            })
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
            alert(`Thank you! Your support has been added. Total students affected: ${responseData.meTooCount}`);
            // Refresh the similar issues list
            checkSimilarIssues();
        } else {
            alert(`Error: ${responseData.message}`);
        }
    } catch (error) {
        console.error('Error adding Me Too:', error);
        alert('Error adding your support. Please try again.');
    }
}

// Get user email from localStorage
function getUserEmail() {
    return localStorage.getItem('userEmail');
}

// Format date helper function
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}
