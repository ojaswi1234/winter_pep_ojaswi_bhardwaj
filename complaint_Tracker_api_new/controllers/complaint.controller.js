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
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: "Title and description are required!!" });
    }

    const newComplaint = {
        id: Id++,
        title,
        description,
        status: "pending"
    };

    complaints.push(newComplaint);
    res.status(201).json({ message: "Complaint created successfully....", complaint: newComplaint });
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
