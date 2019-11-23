const express = require('express');
const path = require('path');

//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const PORT = process.env.PORT || 5000
const connectionString = process.env.DATABASE_URL || "postgres://lhnpbohgkyfqsm:3d000cb51fc621646f2857d0ec48c6e401a69d9a42af9d4326869b6478f51910@ec2-50-19-95-77.compute-1.amazonaws.com:5432/d9cp80j40v9h91?ssl=true";

const { Pool } = require('pg')
const pool = new Pool({connectionString: connectionString});

const app = express();

app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, 'public')))
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
})
app.get("/games", getGames);

//get list of games
function getGames(req, res) {
    const id = 1;
    var sql = "SELECT game_id, title FROM game WHERE creator = " + id;
    pool.query(sql, function(err, results) {
        //if an error occurred...
        if (err) {
            console.log("Error in query: ");
            console.log(err);
        }
        //log this to the console for debugging
        console.log(results.rows);
        res.json(results.rows);
    })
    //console.log("Getting games for id: " + id);
}

app.listen(PORT, () => console.log(`Listening on ${PORT}`));