// const app = require('express')();

// let authenticated = false;

// app.get("/", (req, res)=> {
//     res.send("Home Page ");
// });

// function getsError(req, res, next){
//     try{
//         if(authenticated === true){
//             next();
//         }
//         else{
//             throw new Error("Unauthenticated!!!!");
//         }
//     }
//     catch(err){
//         res.status(404).send("Unauthenticated !!!!!!");
//     }
// };

// app.get("/login", (req, res) => {
//     authenticated = true;
//     res.redirect("/admin");
// });

// app.get("/logout", (req, res) => {
//     authenticated = false;
//     res.send("Logged out");
// });

// app.get("/admin", getsError, (req, res) => {
//     res.send("Admin Page");
// });

// // Handle all undefined routes (catch-all)
// app.use((_req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// app.listen(3000, () => {
//     console.log("server is running .....")
// })




import express from "express";

const app = express();

app.use(express.json());
app.use(express.urlencoded());

let user = {
    id: 1,
    name: "raj", 
    age: 20,
    isActive: true
}


/*

app.get("/users", (req, res ) => {
    res.json(user);
});


app.post("/user/add", (req, res)=> {
    user.id += 1;
   
    res.send(JSON.stringify(user));
})


app.put("/user", (req, res) => {
    user = {
        id: 1,
        name: req.body.name,
        age: req.body.age,
        isActive: req.body.isActive,
    }
});

app.patch("/user/age", (req, res) => {
    user.age += 1;
    user.name = req.body.name;
    
    res.json(user);
});


app.patch("/user/status", (req, res) => {
    user.isActive = req.body.isActive;
    res.send(`${user.name} is ${user.isActive} now.....`)
});
*/



// app.get("/", (req, res) => {
//     res.write(`
//         <html>
//         <head>
//         <title>User Data</title>
//         </head>
//         <body>
//         <button onclick="getData()">Click me</button>

//         <script>
//         async function getData(){
//         const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
//         const data = await response.json();
//         document.write(data.title);
//         }
//         </script>
//         </body>        
//         </html>
//         `);

//     res.end();
// })


// let students = [
//     {id: 1, name: "Aman", rollno: 13},
//     {id: 2, name: "Rohit", rollno: 24},
//     {id: 3, name: "Vikas", rollno: 20}
// ];

// app.get("/users/:id", (req, res) => {
//     const {id} = req.params;
//     const data = students.find(s => s.id === parseInt(id));
//     res.json({
//         data: data
//     });
// });


// app.get("/student",(req,res) => {
//     const {name} = req.query;

//     const data = students.find(s => s.name === name);
//     res.send({
//         query: res.query,
//         student: data
//     });
// });


// app.get("/users/:id/:rollno/:age", (req,res) => {
//     res.json(req.params);
// });







app.listen(3000, () => {
    console.log("Server is running.......");
})