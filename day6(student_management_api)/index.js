const express = require('express');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let existingStudents = [];

app.post('/students', async (req, res) => {
    try{        
        const { name, age, course } = req.body; 
        if (!name || !age || !course) {
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
            age: age, 
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


app.put("/students/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, age, course } = req.body;
        const file = await fs.promises.readFile('students.json', 'utf-8');
        existingStudents = JSON.parse(file);
        const studentIndex = existingStudents.findIndex(s => s.id === parseInt(id));
        if (studentIndex === -1) {
            return res.status(404).send("Student not found");
        }
        if (name) existingStudents[studentIndex].name = name;
        if (age) existingStudents[studentIndex].age = age;
        if (course) existingStudents[studentIndex].course = course;
        await fs.promises.writeFile('students.json', JSON.stringify(existingStudents, null, 2));
        res.status(200).json(existingStudents[studentIndex]);
    } catch (err) {
        res.status(500).send("Internal Server Error: " + err.message);
    }
});


app.patch("/student/:id", async (req, res) => {
    try{
        const id = req.params;
        const {age} = req.body;
        const file = await fs.promises.readFile('students.json', 'utf-8');
        existingStudents = JSON.parse(file);

        const studentIndex = existingStudents.findIndex(s => s.id == parseInt(id));

        if(studentIndex === -1) {
            return res.status(404).send("Student not found in database.......")
        }
        if(age){
            existingStudents[studentIndex].age = age;
        }else{
            res.status(404).send("Enter updated value please//////")
        }

        await fs.promises.writeFile('students.json', JSON.stringify(existingStudents, null, 2))

        res.status(200).json(existingStudents);
    }catch(err){
        res.status(400).send("Error - "+err.message);
    }
});

app.delete("/students/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        const initialLength = existingStudents.length;
        existingStudents = existingStudents.filter(s => s.id !== parseInt(id));
        if(existingStudents.length === initialLength) {
            return res.status(404).send("Student not found");
        }
        await fs.promises.writeFile('students.json',JSON.stringify(existingStudents, null, 2));
        res.status(200).send("Student deleted successfully!!!");
    }catch(err){
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000......');
})