// import module
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@my-mongodb.2rdes.mongodb.net/?retryWrites=true&w=majority&appName=My-MongoDB`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db('car-rental-system');
    const carsCollection = db.collection('cars');

    // --> save car information in database <--
    app.post('/add-car', async (req, res) => {
      const carData = req.body;
      const result = await carsCollection.insertOne(carData);
      console.log(result);
      res.send(result);
    });

    // --> fetch 6 data from database <--
    app.get('/limited-car', async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const result = await carsCollection.find().limit(limit).toArray();
      res.send(result);
    });

    // --> get all car from database <--
    app.get('/all-car', async (req, res) => {
      const result = await carsCollection.find().toArray();
      res.send(result);
    });

    // --> my posted car by email <--
    app.get('/all-car/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'author.author_email': email };
      const result = await carsCollection.find(query).toArray();
      res.send(result);
    });

    // --> delete my post <--
    app.delete('/single-car/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carsCollection.deleteOne(query);
      res.send(result);
    });

    // --> get data by single id <--
    app.get('/single-car/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carsCollection.findOne(query);
      res.send(result);
    });

    // --> save edited data in db <--
    app.put('/update-car/:id', async (req, res) => {
      const id = req.params.id;
      const carData = req.body;
      const updated = {
        $set: carData,
      };
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await carsCollection.updateOne(query, updated, options);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send({ 'car rental system server': 'server is running...' });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
