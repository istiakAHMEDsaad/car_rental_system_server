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
    const db = client.db('car-rental-system');
    const carsCollection = db.collection('cars');
    const bookingCollection = db.collection('booking');

    // --> save car information in database <--
    app.post('/add-car', async (req, res) => {
      const carData = req.body;
      const result = await carsCollection.insertOne(carData);
      res.send(result);
    });

    // --> get all car from db <--
    app.get('/all-cars', async (req, res) => {
      const result = await carsCollection.find().toArray();
      res.send(result);
    });

    // --> fetch 6 data from database <--
    app.get('/limited-car', async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const result = await carsCollection.find().limit(limit).toArray();
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

    // --> get all car data by category from db <--
    app.get('/all-car', async (req, res) => {
      const search = req.query.search;
      const filter = req.query.filter;

      let query = {
        model: {
          $regex: search || '',
          $options: 'i', //case-insensitive
        },
        available: 'yes'
      };

      let sortOption = {};
      switch (filter) {
        case 'ascending':
          sortOption = { price: 1 };
          break;
        case 'descending':
          sortOption = { price: -1 };
          break;
        case 'old':
          sortOption = { post_date: 1 };
          break;
        case 'new':
          sortOption = { post_date: -1 };
          break;
      }

      const result = await carsCollection
        .find(query)
        .sort(sortOption)
        .toArray();
      res.send(result);
    });

    // <== save booking user data in db ==>
    app.post('/add-carBook', async (req, res) => {
      //check duplicate booking
      const bookingData = req.body;
      const query = {
        bookingMail: bookingData.bookingMail,
        bookId: bookingData.bookId,
      };
      const alreadyBooked = await bookingCollection.findOne(query);
      if (alreadyBooked) {
        return res.status(400).send('You already booked this car!');
      }
      //save
      const result = await bookingCollection.insertOne(bookingData);
      //increase
      const filter = { _id: new ObjectId(bookingData.bookId) };
      const update = {
        $inc: { book_count: 1 },
      };
      await carsCollection.updateOne(filter, update);
      res.send(result);
    });

    // <== get specific booking information by email ==>
    app.get('/my-bookings/:email', async (req, res) => {
      const email = req.params.email;
      const query = {
        bookingMail: email,
      };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // <== booking status update ==>
    app.patch('/booking-status-update/:id', async (req, res) => {
      const id = req.params.id;
      const { bookingStatus } = req.body;

      if (!bookingStatus) {
        return res.status(400).send({ message: 'bookingStatus is missing!' });
      }

      const filter = { _id: new ObjectId(id) };
      const updated = {
        $set: { bookingStatus },
      };
      const result = await bookingCollection.updateOne(filter, updated);
      res.send(result);
    });

    // <== date update ==>
    app.patch('/bookingdate-update/:id', async (req, res) => {
      const id = req.params.id;
      const { bookingDate } = req.body;

      if (!bookingDate) {
        return res.status(400).send({ message: 'date is missing!' });
      }

      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: { bookingDate },
      };
      const result = await bookingCollection.updateOne(filter, update);
      res.send(result);
    });

    // <== delete booking data ==>
    app.delete('/delete-booking/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send({ 'car rental system server': 'server is running...' });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
