import  express from 'express';
import {MongoClient} from 'mongodb';

const app = express.json();
const client = new MongoClient("");

let db;

async function connectDB(){
    await client.connect();
    db = client.db("schoolDB");
    console.log("MONGODB connected! (NO SCHEMA)");
}

app.get("/", (req, res) => {
    db.showCollections().then((collections) => {
        console.log(collections);
    }).catch((err) => { console.log("Error fetching collections: ", err); });
    res.send("Hello World!");
});


app.listen(3000, () => {
    connectDB();
    console.log("Server is running.......");
})