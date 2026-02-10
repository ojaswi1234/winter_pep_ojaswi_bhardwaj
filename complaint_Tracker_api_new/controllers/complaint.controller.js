let complaints = [];
let Id = 1;

export const getAllComplaints = (req, res) => {
    res.json(complaints);
};

export const getComplaintById = (req, res) => {
    const {id} = req.params;
    const complaint = complaints.find(c => c.id === parseInt(id));
    if (!complaint) {
        return res.status(404).json({ message: "Complaint not found!!!" });
    }
    res.status(200).json(complaint);
}

export const createComplaint = (req, res) => {
    const { title, description, email, name, wing, room } = req.body;
    
    console.log('Creating complaint with data:', { title, description, email, name, wing, room });

    if (!title || !description || !email || !name || !wing || !room) {
        return res.status(400).json({ message: "All fields are required: title, description, email, name, wing, and room" });
    }

    const newComplaint = {
        id: Id++,
        title,
        description,
        email,
        name,
        wing,
        room,
        status: "pending",
        createdAt: new Date().toISOString(),
        meTooCount: 1,
        meTooUsers: [email]
    };

    complaints.push(newComplaint);
    console.log('Complaint created successfully:', newComplaint);
    res.status(201).json({ message: "Complaint created successfully....", complaint: newComplaint });
};

export const getComplaintsByEmail = (req, res) => {
    const { email } = req.params;
    const userComplaints = complaints.filter(c => c.email === email);
    res.json(userComplaints);
};

export const updateComplaintStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "resolved", "rejected"];

    const complaint = complaints.find(c => c.id === parseInt(id));

    if (!complaint) {
        return res.status(404).json({ message: "Complaint not found!!!" });
    }
    
    if (status && !validStatuses.includes(status)) {
         return res.status(400).json({ message: "Invalid status value" });
    }

    if (status) {
        complaint.status = status;
    }
    
    res.json({ message: "Complaint status updated successfully", complaint });
};

export const deleteComplaint = (req, res) => {
    const { id } = req.params;
    const index = complaints.findIndex(c => c.id === parseInt(id));

    if (index === -1) {
        return res.status(404).json({ message: "Complaint not found!!!" });
    }

    complaints.splice(index, 1);
    res.json({ message: "Complaint deleted successfully" });
};

export const getSimilarComplaints = (req, res) => {
    const { wing } = req.params;
    const similarComplaints = complaints.filter(c => 
        c.wing === wing && 
        c.status === "pending"
    );
    res.json(similarComplaints);
};

export const addMeToo = (req, res) => {
    const { complaintId, userEmail } = req.body;
    
    console.log('Adding Me Too support:', { complaintId, userEmail });
    
    const complaint = complaints.find(c => c.id === parseInt(complaintId));
    
    if (!complaint) {
        console.log('Complaint not found for ID:', complaintId);
        return res.status(404).json({ message: "Complaint not found!!!" });
    }
    
    console.log('Current complaint before adding support:', complaint);
    
    if (complaint.meTooUsers.includes(userEmail)) {
        console.log('User already supported this complaint:', userEmail);
        return res.status(400).json({ message: "You have already supported this complaint" });
    }
    
    complaint.meTooUsers.push(userEmail);
    complaint.meTooCount = complaint.meTooUsers.length;
    
    console.log('Complaint after adding support:', complaint);
    
    res.json({ 
        message: "Support added successfully", 
        meTooCount: complaint.meTooCount,
        complaint: complaint 
    });
};
