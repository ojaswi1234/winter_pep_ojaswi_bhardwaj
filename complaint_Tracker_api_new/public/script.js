// Frontend Logic

const API_URL = "/complaints";

// Handle Complaint Function
const complaintForm = document.getElementById("complaintForm");
if (complaintForm) {
    complaintForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const messageDiv = document.getElementById("message");

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title, description })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.style.color = "green";
                messageDiv.textContent = `Success! Complaint ID: ${data.complaint ? data.complaint.id : 'N/A'}`;
                complaintForm.reset();
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

        // Logic to show buttons based on current status
        // E.g. if pending, show Resolve / Reject
        // If Resolved/Rejected, maybe show Re-open (Pending)
        
        let actionsHtml = "";
        
        if (complaint.status === "pending") {
            actionsHtml += `
                <button class="action-btn btn-resolve" onclick="updateStatus(${complaint.id}, 'resolved')">Resolve</button>
                <button class="action-btn btn-reject" onclick="updateStatus(${complaint.id}, 'rejected')">Reject</button>
            `;
        } else {
             actionsHtml += `
                <button class="action-btn btn-pending" onclick="updateStatus(${complaint.id}, 'pending')">Re-open</button>
            `;
        }
        
        // Delete is always available
        actionsHtml += `<button class="action-btn btn-delete" onclick="deleteComplaint(${complaint.id})">Delete</button>`;


        card.innerHTML = `
            <div class="meta">ID: #${complaint.id}</div>
            <h4>${complaint.title}</h4>
            <p>${complaint.description}</p>
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
