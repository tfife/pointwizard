const express = require('express');
const path = require('path');

var session = require('express-session');
var FileStore = require('session-file-store')(session);

//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const PORT = process.env.PORT || 5000
const connectionString = process.env.DATABASE_URL || "postgres://lhnpbohgkyfqsm:3d000cb51fc621646f2857d0ec48c6e401a69d9a42af9d4326869b6478f51910@ec2-50-19-95-77.compute-1.amazonaws.com:5432/d9cp80j40v9h91?ssl=true";

const { Pool } = require('pg')
const pool = new Pool({connectionString: connectionString});

const app = express();

app.use(require('morgan')('dev'));
app.use(session({
    name: 'server-session-cookie-id',
    secret: 'LiantheLeddian',
    saveUninitialized: true,
    resave: true,
    store: new FileStore()
}))
.use(function printSession(req, res, next) {
    console.log('req.session', req.session);
    return next();
})
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, 'public')))
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
})
app.get("/id", getId)
app.get("/games", verifyLogin, getGamesByCreator);
app.post("/games/create", verifyLogin, createGame);
app.get("/games/players/:id", verifyLogin, getPlayers);
app.get("/games/:id", verifyLogin, getGameById);
app.post("/games/score/update", verifyLogin, updateScore);
app.get("/login/:username/:password", login);
app.post('/logout', verifyLogin, logout);
app.post('/account/create', verifyDoesNotExist, createAccount);

function verifyLogin(req, res, next) {
    if(!req.session.user_id) {
        res.json({success: false, error: 'Not logged in'});
    }
    else {
        next();
    }
}


function getId(req, res) {
    if(!req.session.user_id) {
        res.json({success: false});
    } else {
        res.json({success: true, id: req.session.user_id});
    }
}

//get list of games
function getGamesByCreator(req, res) {
    if (!req.session.user_id) {
        res.json({success: false});
    }
    const id = req.session.user_id;
    var sql = "SELECT game_id, title FROM game WHERE creator = " + id + " ORDER BY game_id DESC";
    pool.query(sql, function(err, results) {
        //if an error occurred...
        if (err) {
            console.log("Error in query: ");
            console.log(err);
        }
        //log this to the console for debugging
        //console.log(results.rows);
        res.json(results.rows);
    })
    //console.log("Getting games for id: " + id);
}

//get list of games
function getGameById(req, res) {
    if(!req.session.user_id) {
        res.json({success: false});
    }
    const id = req.session.user_id;
    var sql = "SELECT title, creator FROM game WHERE game_id = " + id;
    console.log(sql);
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

//create a new game
function createGame(req, res) {
    if(!req.session.user_id) {
        res.json({success: false});
    }
    console.log("Title: " + req.body.title);
    console.log("Players: " + req.body.players);
    var result;
    var game_id;
    const user_id = req.session.user_id;
    if(req.body.title)
    {
        var sql = "INSERT INTO game(title, creator) VALUES ('" + req.body.title + "', " + user_id + ") RETURNING game_id";
        pool.query(sql, (err, results) => {
            //if an error occurred...
            if (err) {
                console.log("Error in query: ");
                console.log(err);
                result = {success: false};
                res.json(result);
            } else {
                game_id = results.rows[0].game_id;
                console.log(game_id);
                var sql = "INSERT INTO player(player_name, game, color) VALUES";
                req.body.players.forEach( (item, index) => {
                    sql = sql.concat("('"+ item + "', " + game_id + ", '" + req.body.colors[index] + "'), ");
                })
                //remove last comma and space
                sql = sql.slice(0, -2);
                console.log(sql);
                pool.query(sql, (err, results) => {
                    if (err) {
                        console.log("Error in query: ");
                        console.log(err);
                    }
                    else {
                        //let full_url = '/game/' + game_id + '/';
                        //return res.redirect(full_url);
                    }
                })
                console.log(game_id);
                result = {success: true, game_id: game_id};
                
                res.json(result);
            }
        });
    } else {
        result = {success: false};
        res.json(result);
    }
}

function getPlayers(req, res) {
    const id = req.params.id;
    var sql = "SELECT player_id, player_name, score, color FROM player WHERE game = " + id;
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

}

function updateScore(req, res) {
    const player = req.body.player;
    const score = req.body.score;
    var sql = "UPDATE player SET score = " + score + " WHERE player_id = " + player;
    pool.query(sql, (err, results) => {
        if (err) {
            console.log("Error in query: ");
            console.log(err);
        }
        //log for debugging
        console.log("score added: ", score);
    })
}

function login(req, res) {
    console.log(req);
    let username = req.params.username;
    let password = req.params.password;
    console.log('username: ', username, ' password: ', password);
    var sql = "SELECT member_id FROM member WHERE username = '" + username + "' AND password = '" + password + "'";
    pool.query(sql, (err, results) => {
        if (err) {
            console.log("Error in query: ");
            console.log(err);
            res.json({success: false})
        } else if (results.rows[0] != undefined) {
            console.log(results.rows);
            console.log("Successfully retrieved id: ", results.rows[0].member_id);
            req.session.user_id = results.rows[0].member_id;
            res.json({success: true, id: results.rows[0].member_id});
        } else {
            console.log("Error, no match");
            res.json({success: false, err: 'no match'});
        }
    })
}
function logout(req, res) {
    req.session.user_id = null;
    res.json({success: true});
}

function verifyDoesNotExist(req, res, next) {
    //check to see if member already exists
    var sql = "SELECT member_id FROM member WHERE username = '" + req.body.username + "'";
    pool.query(sql, (err, results) => {
        if (err) {
            console.log("Error in query: ");
            console.log(err);
            res.json({success: false})
        } else if (results.rows[0] != undefined) {
            res.json({success: false})
        } else {
            return next();
        }
    })
}

function createAccount(req, res) {
    console.log('username: ', req.body.username);
    console.log('password: ', req.body.password);
    sql = "INSERT INTO member(username, password) VALUES ('" + req.body.username + "', '" + req.body.password + "') RETURNING member_id";
    pool.query(sql, (err, results) => {
        if (err) {
            console.log("Error in query: ");
            console.log(err);
            res.json({success: false});
        } else if (results.rows[0] != undefined) {
            req.session.user_id = results.rows[0].member_id;
            console.log('create successful');
            res.json({success: true, id: req.session.user_id});
        } else {
            console.log('Unable to Create Account');
            res.json({success: false});
        }
    })
}

app.listen(PORT, () => console.log(`Listening on ${PORT}`));