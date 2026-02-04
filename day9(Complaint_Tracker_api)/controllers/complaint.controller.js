let complaints = [];
let Id = 1;

export const getAllComplaints = (req, res) => {
    res.json(complaints);
};

export const createComplaint = (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: "Title and description are required!!" });
    }

    const newComplaint = {
        id: Id++,
        title,
        description,
        status: "open"
    };

    complaints.push(newComplaint);
    res.status(201).json({ message: "Complaint created successfully...." });
};

export const resolveComplaint = (req, res) => {
    const { id } = req.params;
    const complaint = complaints.find(c => c.id === parseInt(id));

    if (!complaint) {
        return res.status(404).json({ message: "Complaint not found!!!" });
    }

    complaint.status = "resolved";
    res.json({ message: "Complaint resolved successfully", complaint });
};

export const deleteComplaint = (req, res) => {
    const { id } = req.params;
    const index = complaints.findIndex(c => c.id === parseInt(id));

    if (index === -1) {
        return res.status(404).json({ message: "Complaint not found!!!" });
    }

    complaints.splice(index, 1);
    res.json({ message: "Complaint deleted successfully....." });
};
