const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/transactionsDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err.message);
});

const transactionSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    category: String,
    dateOfSale: Date,
    sold: Boolean
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Initialize DB by fetching data from third-party API
app.get('/api/initialize', async (req, res) => {
    try {
        const { data } = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        await Transaction.insertMany(data);
        res.status(201).send('Database initialized with seed data');
    } catch (error) {
        res.status(500).send('Error initializing database');
    }
});

// List all transactions with pagination
app.get('/api/transactions', async (req, res) => {
    const { page = 1, perPage = 10, month } = req.query;
    const match = {
        $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] }
    };
    try {
        const transactions = await Transaction.find(match)
            .skip((page - 1) * perPage)
            .limit(Number(perPage));
        
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error); // Log the error
        res.status(500).send('Error fetching transactions');
    }
});


// Statistics API for total sales, sold and not sold items for the month
app.get('/api/statistics', async (req, res) => {
    const { month } = req.query;
    try {
        const totalSales = await Transaction.aggregate([
            { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] } } },
            { $group: { _id: null, totalAmount: { $sum: "$price" }, totalSold: { $sum: { $cond: ["$sold", 1, 0] } }, totalNotSold: { $sum: { $cond: ["$sold", 0, 1] } } } }
        ]);
        res.json(totalSales[0]);
    } catch (error) {
        res.status(500).send('Error fetching statistics');
    }
});

// Bar Chart API for price ranges
app.get('/api/bar-chart', async (req, res) => {
    const { month } = req.query;
    try {
        const priceRanges = await Transaction.aggregate([
            { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] } } },
            {
                $bucket: {
                    groupBy: "$price",
                    boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
                    default: "901-above",
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        res.json(priceRanges);
    } catch (error) {
        res.status(500).send('Error fetching bar chart data');
    }
});

// Pie Chart API for categories
app.get('/api/pie-chart', async (req, res) => {
    const { month } = req.query;
    try {
        const categories = await Transaction.aggregate([
            { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] } } },
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);
        res.json(categories);
    } catch (error) {
        res.status(500).send('Error fetching pie chart data');
    }
});

// Combined API
app.get('/api/combined', async (req, res) => {
    const { month } = req.query;
    try {
        const transactions = await Transaction.find({ $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] } });
        const statistics = await Transaction.aggregate([
            { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] } } },
            { $group: { _id: null, totalAmount: { $sum: "$price" }, totalSold: { $sum: { $cond: ["$sold", 1, 0] } }, totalNotSold: { $sum: { $cond: ["$sold", 0, 1] } } } }
        ]);
        const priceRanges = await Transaction.aggregate([
            { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] } } },
            {
                $bucket: {
                    groupBy: "$price",
                    boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
                    default: "901-above",
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        const categories = await Transaction.aggregate([
            { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] } } },
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        res.json({
            transactions,
            statistics: statistics[0],
            priceRanges,
            categories
        });
    } catch (error) {
        res.status(500).send('Error fetching combined data');
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
