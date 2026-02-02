const express = require('express');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let existingStudents = [];

app.post('/students', async (req, res) => {
    try{        
        const { name, email, course } = req.body; 
        if (!name || !email || !course) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: req.body
            });
        }
        try {
            const file = await fs.promises.readFile('students.json', 'utf-8');
            existingStudents = JSON.parse(file);
        } catch (err) {
            existingStudents = []; 
            await fs.promises.writeFile('students.json', '[]');
        }
        
        const newId = existingStudents.length > 0 
            ? Math.max(...existingStudents.map(s => s.id)) + 1 
            : 1;
        const newStudent = {
            id: newId, 
            name: name, 
            email: email, 
            course: course
        };
        existingStudents.push(newStudent);
        await fs.promises.writeFile('students.json', JSON.stringify(existingStudents, null, 2));
        console.log("Student added sucessfully........")
        res.status(201).json(newStudent);}
    catch(err) {
        console.error(err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});
app.get('/students', (req, res) => {
    const stream = fs.createReadStream('students.json', 'utf-8');
    stream.pipe(res);
});

app.get("/students/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const file = await fs.promises.readFile('students.json', 'utf-8');
        existingStudents = JSON.parse(file);
        
        const student = existingStudents.find(s => s.id === parseInt(id));
        
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }
        
        res.status(200).json(student);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error: " + err.message });
    }
});


app.put("/students/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, course } = req.body;
        const file = await fs.promises.readFile('students.json', 'utf-8');
        existingStudents = JSON.parse(file);
        const studentIndex = existingStudents.findIndex(s => s.id === parseInt(id));
        if (studentIndex === -1) {
            return res.status(404).send("Student not found");
        }
        if (name) existingStudents[studentIndex].name = name;
        if (email) existingStudents[studentIndex].email = email;
        if (course) existingStudents[studentIndex].course = course;
        await fs.promises.writeFile('students.json', JSON.stringify(existingStudents, null, 2));
        res.status(200).json(existingStudents[studentIndex]);
    } catch (err) {
        res.status(500).send("Internal Server Error: " + err.message);
    }
});



app.delete("/students/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const file = await fs.promises.readFile('students.json', 'utf-8');
        existingStudents = JSON.parse(file);
        
        const initialLength = existingStudents.length;
        existingStudents = existingStudents.filter(s => s.id !== parseInt(id));
        
        if (existingStudents.length === initialLength) {
            return res.status(404).json({ error: "Student not found" });
        }
        
        await fs.promises.writeFile('students.json', JSON.stringify(existingStudents, null, 2));
        res.status(200).json({ message: "Student deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error: ' + err.message });
    }
});
app.listen(3000, () => {
    console.log('Server is running on port 3000......');
})