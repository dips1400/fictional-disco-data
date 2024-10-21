import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./App.css";

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [priceRanges, setPriceRanges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState("5"); // Default to March
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(""); // Error state
  const [page, setPage] = useState(1); // Current page
  const [perPage] = useState(4); // Items per page
  const [totalPages, setTotalPages] = useState(1); // Total number of pages

  // Fetch data based on month
  const fetchData = async () => {
    setLoading(true); // Start loading
    setError(""); // Reset error

    try {
      const transactionsRes = await axios.get(
        `http://localhost:5000/api/transactions?month=${month}`
      );
      const statisticsRes = await axios.get(
        `http://localhost:5000/api/statistics?month=${month}`
      );
      const barChartRes = await axios.get(
        `http://localhost:5000/api/bar-chart?month=${month}`
      );
      const pieChartRes = await axios.get(
        `http://localhost:5000/api/pie-chart?month=${month}`
      );

      setTransactions(transactionsRes.data);
      setStatistics(statisticsRes.data);
      setPriceRanges(barChartRes.data);
      setCategories(pieChartRes.data);

      // Calculate total pages based on fetched transactions
      setTotalPages(Math.ceil(transactionsRes.data.length / perPage));
    } catch (err) {
      setError("Error fetching data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the component mounts (with default month)
  useEffect(() => {
    fetchData();
  }, [month]);

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Prevent the page from reloading
    fetchData(); // Fetch data based on the selected month
  };

  // Handle page change (frontend pagination)
  const handlePageChange = (direction) => {
    if (direction === "next" && page < totalPages) {
      setPage(page + 1);
    } else if (direction === "prev" && page > 1) {
      setPage(page - 1);
    }
  };

  // Slice the transactions for the current page
  const currentTransactions = transactions.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return (
    <div className="dashboard">
      <h2>Transaction Dashboard</h2>
      <div className="filter">
        {/* Month dropdown */}
        <label>Select Month: </label>
        <br></br>
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

      </div>
      {loading && <p>Loading data...</p>} {/* Loading message */}
      {error && <p style={{ color: "red" }}>{error}</p>} {/* Error message */}
      <div className="container1">
        {/* Transaction Table */}
        <div className="tableSection">
        <div className="table-container">
          <h2>Transactions</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Price</th>
                <th>Category</th>
                <th>Sold</th>
                <th>Date of Sale</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((transaction, index) => (
                <tr key={index}>
                  <td>{transaction.title}</td>
                  <td>{transaction.description}</td>
                  <td>${transaction.price.toFixed(2)}</td>
                  <td>{transaction.category}</td>
                  <td>{transaction.sold ? "Yes" : "No"}</td>
                  <td>
                    {new Date(transaction.dateOfSale).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
          <button
              onClick={() => handlePageChange("prev")}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange("next")}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
        </div>

        {/* Statistics */}
        <div className="stats">
          <h2>Statistics</h2>
          <br></br><br></br>
          <br></br><br></br>
          <div>
            <p><span style={{color:"#8E05C2",fontSize:"large"}}>Total Sales:</span> ${statistics.totalAmount || 0}</p>
            <p><span style={{color:"#8E05C2",fontSize:"large"}}>Total Sold Items: </span> {statistics.totalSold || 0}</p>
            <p><span style={{color:"#8E05C2",fontSize:"large"}}>Total Not Sold Items: </span> {statistics.totalNotSold || 0}</p>
          </div>
        </div>
      </div>
      {/* Bar Chart for Price Range */}
      <h2>Graphical Representation</h2>
      <div className="graphs">
        <div className="barChart">
        <h2>Categories by Bar Chart</h2>
        <h5>Bar chart status - {new Date(0, month-1).toLocaleString("default", { month: "long" })}</h5>
      <BarChart width={500} height={300} data={priceRanges}>
        <XAxis dataKey="_id" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#810CA8" />
      </BarChart>
      </div>
      {/* Pie Chart for Categories */}
      <div className="pieChart">
      <h2>Categories Pie Chart</h2>
      <h5>Pie chart status - {new Date(0, month-1).toLocaleString("default", { month: "long" })}</h5>
      <PieChart width={400} height={400}>
        <Pie
          data={categories}
          cx={200}
          cy={200}
          outerRadius={150}
          fill="#8884d8"
          dataKey="count"
          labelLine={false}
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
      
            return (
<text
          x={x}
          y={y}
          fill="white"
          textAnchor="middle" // Center the text horizontally
          dominantBaseline="central"
        >
          <tspan fontSize={14} fontWeight="bold" dy="-5"> {/* Larger font for count */}
            {categories[index].count}
          </tspan>
          <tspan fontSize={10}> {/* Smaller font for category name */}
            {` ${categories[index]._id} (${(percent * 100).toFixed(0)}%)`}
          </tspan>
        </text>
      );
    }}
  >
            
          {categories.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={["#810CA8", "#58287F", "#A2678A", "#81689D"][index % 4]}
            />
          ))}
        </Pie>
      </PieChart>
      </div>
      </div>
    </div>
  );
};

export default App;
